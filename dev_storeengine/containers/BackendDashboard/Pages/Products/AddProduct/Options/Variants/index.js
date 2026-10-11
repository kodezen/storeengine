import React, { useEffect, useRef, useState } from 'react';
import { __, _n, sprintf } from '@wordpress/i18n';
import Button from '@Components/Button';
import './styles.scss';
import EditVariants from './EditVariants';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllAttributes } from '@Redux/Slices/attributesSlice/attributesSlice';
import { getAttributeTerm } from '@Redux/Slices/attributesSlice/term';
import { useFormikContext } from 'formik';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import DynamicVariant from './DynamicVariant';
import VariantImages from './VariantImages';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import {
	countDroppedSavedVariants,
	generateCombinations,
	handleManageAttributes,
	prepareGeneratedVaiants,
	prepareVariantAttributes,
	syncOldCombinationsWithNew,
} from './helper';
import Tooltip from '@Components/Tooltip';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import { admin_url } from '@Utils/helper';
import Modal from '@Components/Modal';
import { Scope } from '@Components/ui';
import OptionMenu from '@Components/OptionMenu';
import useVariantsView, { useAttributesEditor } from './useVariantsView';
import {
	getDefaultPriceName,
	persistSimplePrice,
} from '../Price/helper';

const SortableItem = SortableElement(
	( {
		variant,
		itemIndex,
		editingVariant,
		setEditingVariant,
		attributes,
		setAttributes,
		currentAttributesTerms,
		setGeneratedVariants,
		generatedVariants,
		onDeleteAttribute,
		onTermsCreated,
	} ) => (
		<div
			key={ `variant-${ itemIndex }` }
			className="storeengine-variants__editing-wrapper-child"
		>
			{ editingVariant === variant?.attribute_id ? (
				<EditVariants
					variant={ variant }
					index={ itemIndex }
					setEditingVariant={ setEditingVariant }
					variants={ attributes }
					setVariants={ setAttributes }
					attributesTerms={ currentAttributesTerms }
					setGeneratedVariants={ setGeneratedVariants }
					generatedVariants={ generatedVariants }
					onDeleteAttribute={ onDeleteAttribute }
					onTermsCreated={ onTermsCreated }
				/>
			) : (
				<>
					<div className="storeengine-d-flex">
						<div className="storeengine-variants__drag-icon">
							<span className="storeengine-icon storeengine-icon--drag"></span>
							<span>{ __( variant?.label, 'storeengine' ) }</span>
						</div>

						<div className="storeengine-d-flex">
							<Button
								type="button"
								onClick={ () =>
									setEditingVariant( variant?.attribute_id )
								}
								preset="white"
								border="gray"
								label={
									variant?.attributes?.length > 0
										? __( 'Edit', 'storeengine' )
										: __( 'Add Value', 'storeengine' )
								}
								suffix="edit-selected-variant"
							/>
							<OptionMenu
								suffix="variant-menu"
								options={ [
									{
										type: 'button',
										label: __( 'Delete', 'storeengine' ),
										suffix: 'trash',
										icon: (
											<span
												className="storeengine-icon storeengine-icon--trash"
												aria-hidden={ true }
											/>
										),
										onClick: () =>
											onDeleteAttribute( variant?.name ),
									},
								] }
							/>
						</div>
					</div>
					{ variant?.attributes?.length > 0 && (
						<div className="storeengine-variants-values">
							{ variant?.attributes?.map(
								( value, valueIndex ) => (
									<span
										key={ valueIndex }
										className="storeengine-variants-values__value"
									>
										{ __( value?.name, 'storeengine' ) }
									</span>
								)
							) }
						</div>
					) }
				</>
			) }
		</div>
	)
);

const SortableList = SortableContainer( ( { children } ) => (
	<div className="storeengine-variants__editing-wrapper">{ children }</div>
) );

const Variants = () => {
	const { values, setFieldValue } = useFormikContext();
	const variantAttributes = useSelector( ( state ) => state.attributes );
	const [ attributes, setAttributes ] = useState( [] );
	const [ editingVariant, setEditingVariant ] = useState( null );
	const [ attributesTerms, setAttributesTerms ] = useState( [] );
	const [ currentAttributesTerms, setCurrentAttributesTerms ] = useState(
		[]
	);
	const [ generatedVariants, setGeneratedVariants ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isAttributes, setIsAttributes ] = useState( false );
	const attributeListRef = useRef( null );
	const prevAttributesRef = useRef( [] );
	const generatedVariantsRef = useRef( generatedVariants );
	const { mode: viewMode } = useVariantsView();
	const { open: editorOpen, setOpen: setEditorOpen } = useAttributesEditor();

	useEffect( () => {
		generatedVariantsRef.current = generatedVariants;
	}, [ generatedVariants ] );

	const dispatch = useDispatch();
	useEffect( () => {
		if ( ! attributes?.length ) {
			handleVariantsSelect();
		}
	}, [] );

	const handleVariantsSelect = async () => {
		try {
			setIsLoading( true );
			const {
				payload: { data },
			} = await dispatch( fetchAllAttributes( { per_page: -1 } ) );
			if ( !! data?.length ) {
				// Only fetch terms for the attributes THIS product actually uses,
				// not every attribute in the store. Terms for a not-yet-added
				// attribute are fetched on demand in handleAddvariants(), so the
				// initial load previously made one term request per global
				// attribute (N+1) even when the product used none — the main
				// cause of the slow Variants load.
				//
				// Derive the used attribute names from BOTH the applied
				// attributes (`values.attributes[].label`) AND the saved
				// variants' taxonomy keys (each is an attribute name — see
				// handleGetTaxonomies). The variants are the source of truth for
				// what terms the variant NAMES need, so relying on
				// `values.attributes` alone left names blank whenever that array
				// lagged the variants.
				const usedLabels = new Set();
				( values?.attributes || [] ).forEach( ( a ) => {
					if ( a?.label ) {
						usedLabels.add( a.label );
					}
				} );
				( values?.variants || [] ).forEach( ( v ) => {
					Object.keys( v?.taxonomies || {} ).forEach( ( key ) =>
						usedLabels.add( key )
					);
				} );
				const usedData = data.filter( ( d ) =>
					usedLabels.has( d?.attribute_name )
				);
				const results = await Promise.all(
					usedData.map( ( element ) =>
						handleFetchVariants( element?.attribute_id )
					)
				);

				setAttributesTerms(
					usedData.map( ( element, i ) => ( {
						attribute_index: element?.attribute_id,
						terms: results[ i ] ?? [],
					} ) )
				);

				const newVariants = results.flat().filter( Boolean );

				const variantMap = newVariants.reduce( ( acc, item ) => {
					acc[ item.id ] = item.label;
					return acc;
				}, {} );

				const currentProduct = { ...values };
				const variantAttributes = prepareVariantAttributes(
					currentProduct.attributes,
					data,
					newVariants,
					variantMap
				);
				const newGeneratedVariants = prepareGeneratedVaiants(
					currentProduct.variants,
					variantMap
				);

				setGeneratedVariants( newGeneratedVariants );
				setAttributes( variantAttributes );
				setFieldValue( 'attributes', currentProduct?.attributes );
				setIsLoading( false );
			}
		} catch ( error ) {
			//
		} finally {
			setIsLoading( false );
		}
	};

	useEffect( () => {
		if ( editingVariant !== null ) {
			const terms = attributesTerms.find(
				( item ) => item?.attribute_index === editingVariant
			);
			if ( terms ) {
				setCurrentAttributesTerms( terms?.terms );
			}
		}
	}, [ editingVariant, attributesTerms ] );

	const handleFetchVariants = async ( id ) => {
		try {
			const { payload } = await dispatch( getAttributeTerm( id ) );
			return (
				payload?.data?.map( ( v ) => ( {
					slug: v?.slug,
					id: v?.term_id,
					label: v?.name,
					color: v?.color || '',
					image: v?.image || '',
				} ) ) ?? []
			);
		} catch ( error ) {
			return [];
		}
	};

	const handleAddvariants = async ( variant, id ) => {
		// Block the duplicate using every available signal: the applied
		// attributes state (by stable id, then name) AND the variants' taxonomy
		// keys (attribute names) — the latter catches products whose attributes
		// state didn't hydrate but whose variants clearly already use it.
		const usedNames = new Set(
			( generatedVariants || [] ).flatMap( ( v ) =>
				Object.keys( v?.taxonomies || {} )
			)
		);
		const existingVariant =
			usedNames.has( variant?.attribute_name ) ||
			( attributes &&
				attributes?.find(
					( item ) =>
						String( item?.attribute_id ) === String( id ) ||
						item?.name === variant?.attribute_name
				) );

		if ( existingVariant ) {
			dispatch(
				showNotification( {
					message: __( 'This variant has already been added', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			setIsAttributes( false );
			return;
		}
		setIsAttributes( false );

		setIsLoading( true );
		const attributeVariants = await handleFetchVariants( id );
		setIsLoading( false );
		const newVariant = {
			attribute_id: id,
			label: variant.attribute_label,
			name: variant?.attribute_name,
			attributes: [],
		};

		setEditorOpen( true );
		setAttributes( ( prev ) => [ ...prev, newVariant ] );
		// Straight into picking this attribute's values (saves a click).
		setEditingVariant( id );
		setAttributesTerms( ( prev ) => [
			...prev,
			{ attribute_index: id, terms: attributeVariants },
		] );
	};

	// New terms created inside the editor join the attribute's term list.
	const handleTermsCreated = ( attributeId, options ) => {
		setAttributesTerms( ( prev ) =>
			prev.map( ( item ) => {
				if ( String( item.attribute_index ) !== String( attributeId ) ) {
					return item;
				}
				const have = new Set( item.terms.map( ( t ) => String( t.id ) ) );
				return {
					...item,
					terms: [
						...item.terms,
						...options.filter( ( o ) => ! have.has( String( o.id ) ) ),
					],
				};
			} )
		);
	};

	const handleDeleteAttribute = ( variantName ) => {
		const updatedAttributes = attributes.filter(
			( v ) => v?.name !== variantName
		);
		const remainingVariants = syncOldCombinationsWithNew(
			generatedVariants,
			generateCombinations( updatedAttributes )
		);
		const dropped = countDroppedSavedVariants(
			generatedVariants,
			remainingVariants
		);
		if (
			dropped > 0 &&
			// eslint-disable-next-line no-alert
			! window.confirm(
				sprintf(
					/* translators: %d: number of saved variants that will be deleted */
					_n(
						'Removing this attribute will delete %d saved variant, including its price, SKU and stock. Continue?',
						'Removing this attribute will delete %d saved variants, including their price, SKU and stock. Continue?',
						dropped,
						'storeengine'
					),
					dropped
				)
			)
		) {
			return;
		}
		setAttributes( updatedAttributes );
		setFieldValue(
			'attributes',
			handleManageAttributes( updatedAttributes )
		);
		setGeneratedVariants( remainingVariants );
		dispatch(
			showNotification( {
				message: __( 'Successfully deleted attributes', 'storeengine' ),
				isShow: true,
				type: 'success',
			} )
		);
	};

	const onSortEnd = ( { oldIndex, newIndex } ) => {
		const sortedData = arrayMoveImmutable( attributes, oldIndex, newIndex );
		const sortedAttributes = sortedData.map( ( item ) => ( {
			label: item?.name,
			ids:
				item?.attributes.length > 0
					? item?.attributes.map( ( attr ) => attr.id )
					: [],
		} ) );
		setFieldValue( 'attributes', sortedAttributes );
		setAttributes( sortedData );
	};

	useEffect( () => {
		const handleClickOutside = ( event ) => {
			if (
				attributeListRef.current &&
				! attributeListRef.current.contains( event.target )
			) {
				setIsAttributes( false );
			}
		};
		if ( isAttributes ) {
			document.addEventListener( 'mousedown', handleClickOutside );
		}
		return () =>
			document.removeEventListener( 'mousedown', handleClickOutside );
	}, [ isAttributes ] );

	useEffect( () => {
		const changes = attributes
			.map( ( attr, index ) => {
				const previousValue = prevAttributesRef.current[ index ];
				if ( previousValue !== attr ) {
					return { index, prev: previousValue, current: attr };
				}
				return null;
			} )
			.filter( ( change ) => change !== null );

		const hasAttributes = changes.every( ( item ) => {
			if ( item.current.attributes.length > 0 ) {
				return true;
			}
			return false;
		} );

		if (
			changes.length > 0 &&
			changes[ 0 ].prev !== undefined &&
			hasAttributes
		) {
			// Always match against the variants we already have. Rebuilding from
			// scratch here used to strip every saved variant's id, SKU, price and
			// stock whenever an attribute changed.
			setGeneratedVariants(
				generateCombinations( attributes, generatedVariantsRef.current )
			);
		}
		prevAttributesRef.current = attributes;
	}, [ attributes ] );

	// Attributes already applied to this product stay VISIBLE in the "Add
	// Attribute" dropdown but are disabled, so the same attribute can't be added
	// twice while the user can still see it's already in use (the core
	// duplicate-attribute bug — the dropdown previously let you re-select an
	// applied attribute).
	const addedAttributeIds = new Set(
		attributes
			.map( ( a ) => a?.attribute_id )
			.filter( Boolean )
			.map( String )
	);
	// The applied-attributes STATE can be empty for a product whose saved
	// `attributes` array didn't hydrate, even though its variants clearly use
	// attributes. The variants' taxonomy keys ARE attribute names, so they're
	// the reliable source of "already used" — fold them in so the dropdown
	// disables (and the add-guard blocks) an attribute that's in use even when
	// there's no chip for it.
	const usedAttributeNames = new Set(
		attributes.map( ( a ) => a?.name ).filter( Boolean )
	);
	( generatedVariants || [] ).forEach( ( v ) => {
		Object.keys( v?.taxonomies || {} ).forEach( ( key ) =>
			usedAttributeNames.add( key )
		);
	} );
	const isAttributeUsed = ( item ) =>
		addedAttributeIds.has( String( item?.attribute_id ) ) ||
		usedAttributeNames.has( item?.attribute_name );
	const allAttributes = variantAttributes?.data || [];
	// Nothing to pick and nothing added: show the empty state only, with no
	// Update button (there is nothing to save from this modal).
	const noAttributesExist = ! allAttributes.length && ! attributes?.length;


	// A variant extends the product's base price, and DynamicVariant reads its
	// Base Price options straight from `values.prices`. So a variant needs at
	// least one saved price row to build on.
	const priceIsSet = ( v ) => v !== '' && v !== null && v !== undefined;
	const hasSavedPrice = ( values?.prices || [] ).some( ( p ) =>
		priceIsSet( p?.price )
	);
	// In simple mode the merchant may have typed a price that isn't persisted
	// yet (`_simple_price`). That still counts as "has a price" for the button —
	// clicking Add Attribute will save it first (see ensurePriceThenToggle).
	const typedSimplePrice = values?._simple_price;
	const hasTypedPrice =
		priceIsSet( typedSimplePrice ) &&
		! Number.isNaN( parseFloat( typedSimplePrice ) );
	const hasAnyPrice = hasSavedPrice || hasTypedPrice;

	// True while the click-handler persists a typed-but-unsaved simple price.
	const [ savingPrice, setSavingPrice ] = useState( false );

	// Add Attribute stays clickable. On click we make sure a saved price row
	// exists first: if the merchant typed a simple price but never saved it, we
	// persist it here (so it's saved automatically, without a full product save)
	// and only then open the attribute picker. This replaces the unreliable
	// save-on-blur — the click is a direct handler we fully control.
	// Opens (or, with forceOpen false, toggles) the attribute picker once the
	// product has a saved base price, saving a typed one first. Resolves true
	// when the picker could be opened.
	const ensurePriceThenToggle = async ( forceOpen = false ) => {
		const showPicker = () =>
			setIsAttributes( ( prev ) => ( forceOpen ? true : ! prev ) );
		// Already have a saved price → variants can read the base price; open.
		if ( hasSavedPrice ) {
			showPicker();
			return true;
		}

		// A typed simple price we can persist right now.
		if ( hasTypedPrice ) {
			const productId = values?.id;
			if ( ! productId ) {
				dispatch(
					showNotification( {
						message: __(
							'Please save the product once before adding variants.',
							'storeengine'
						),
						isShow: true,
						type: 'error',
					} )
				);
				return false;
			}

			const comparePrice = values?._simple_compare_price;
			// Mirror the full save's guard: a positive compare-at price must be
			// higher than the price, otherwise the server rejects it.
			if (
				parseFloat( comparePrice ) > 0 &&
				parseFloat( comparePrice ) <= parseFloat( typedSimplePrice )
			) {
				dispatch(
					showNotification( {
						message: __(
							'Compare-at price must be higher than the price.',
							'storeengine'
						),
						isShow: true,
						type: 'error',
					} )
				);
				return false;
			}

			const existingOnetime = ( values.prices ?? [] ).find(
				( p ) => p?.price_type === 'onetime'
			);

			try {
				setSavingPrice( true );
				const saved = await persistSimplePrice( {
					productId,
					priceId: existingOnetime?.id,
					priceName:
						existingOnetime?.price_name || getDefaultPriceName(),
					price: typedSimplePrice,
					comparePrice,
				} );
				// Land the saved row in the form so DynamicVariant's Base Price
				// picker (and the full save) see it — no duplicate row created.
				setFieldValue(
					'prices',
					existingOnetime
						? ( values.prices ?? [] ).map( ( p ) =>
								parseInt( p?.id ) === parseInt( saved?.id )
									? saved
									: p
						  )
						: [ ...( values.prices ?? [] ), saved ]
				);
				showPicker();
				return true;
			} catch ( error ) {
				dispatch(
					showNotification( {
						message:
							error?.message ||
							error ||
							__(
								'Could not save the price.',
								'storeengine'
							),
						isShow: true,
						type: 'error',
					} )
				);
			} finally {
				setSavingPrice( false );
			}
			return false;
		}

		// No price anywhere.
		dispatch(
			showNotification( {
				message: __(
					'Set a product price before adding variants.',
					'storeengine'
				),
				isShow: true,
				type: 'error',
			} )
		);
		return false;
	};


	// Adding / editing attributes (and so variants) happens in a modal, the
	// same in Inline and Side panel view; the page keeps a one-line summary.
	const closeAttributeEditor = () => {
		setIsAttributes( false );
		setEditingVariant( null );
		setEditorOpen( false );
	};

	return (
		<div className="storeengine-variants storeengine-element-fade-in-transition">
			<div className="storeengine-variants__attributes">
				{ attributes?.length > 0 ? (
					<div className="storeengine-variants__attr-summary">
						{ attributes.map( ( attr ) => (
							<span
								key={ attr?.attribute_id }
								className="storeengine-variants__attr-summary-item"
							>
								<strong>{ attr?.label }</strong>
								{ ( attr?.attributes || [] )
									.map( ( term ) => term?.name )
									.filter( Boolean )
									.join( ', ' ) ||
									__( 'No values', 'storeengine' ) }
							</span>
						) ) }
						<button
							type="button"
							className="storeengine-variants__attr-summary-edit"
							onClick={ () => setEditorOpen( true ) }
						>
							{ __( 'Edit attributes', 'storeengine' ) }
						</button>
					</div>
				) : hasAnyPrice && (
					<Button
						type="button"
						preset="white"
						border="gray"
						isLoading={ savingPrice }
						onClick={ async () => {
							// One click: open the modal with the attribute
							// list already showing.
							if ( await ensurePriceThenToggle( true ) ) {
								setEditorOpen( true );
							}
						} }
						icon={
							<span
								className="storeengine-icon storeengine-icon--add"
								aria-hidden={ true }
							/>
						}
						label={ __( 'Add variants', 'storeengine' ) }
						suffix="add-variants"
					/>
				) }
				{ editorOpen &&
					createPortal(
						<Scope>
							<Modal
								open={ editorOpen }
								size="md"
								className="storeengine-variants-attr-modal"
								title={ __( 'Add or edit variants', 'storeengine' ) }
								onClose={ closeAttributeEditor }
								closeAriaLabel={ __( 'Close', 'storeengine' ) }
							>
								{ /* Wrapper re-applies the Variants styles the
								     portaled editor would otherwise lose. */ }
								<div className="storeengine-variants storeengine-variants--modal">
									{ ! noAttributesExist && (
										<p className="storeengine-variants__modal-hint">
											{ __(
												'Each combination of attribute values becomes a variant. Add an attribute, then pick its values.',
												'storeengine'
											) }
										</p>
									) }
									{ attributes?.length > 0 && (
										<SortableList
											onSortEnd={ onSortEnd }
											shouldCancelStart={ ( e ) => {
												return ! e.target.closest(
													'.storeengine-variants__drag-icon'
												);
											} }
											axis="y"
											helperClass="storeengine-variants__drag-helper"
										>
											{ attributes.map( ( variant, index ) => (
												<SortableItem
													key={ `variant-${ index }` }
													index={ index }
													itemIndex={ index }
													variant={ variant }
													editingVariant={ editingVariant }
													setEditingVariant={ setEditingVariant }
													attributes={ attributes }
													setAttributes={ setAttributes }
													currentAttributesTerms={
														currentAttributesTerms
													}
													setGeneratedVariants={ setGeneratedVariants }
													generatedVariants={ generatedVariants }
													onDeleteAttribute={ handleDeleteAttribute }
													onTermsCreated={ handleTermsCreated }
												/>
											) ) }
										</SortableList>
									) }

									<div className="storeengine-variants__attributes__trigger">
										{ /* No attribute yet: skip this button, the list below is already open. */ }
										{ attributes?.length > 0 && (
											<Button
												type="button"
												preset="white"
												border="gray"
												isLoading={ isLoading || savingPrice }
												onClick={ () => ensurePriceThenToggle() }
												icon={
													<span
														className="storeengine-icon storeengine-icon--add"
														aria-hidden={ true }
													/>
												}
												label={ __( 'Add Another Attribute', 'storeengine' ) }
												suffix="add-variants"
											/>
										) }
										{ ( isAttributes || ! attributes?.length ) && (
											<ul
												className="storeengine-variants__attributes__select"
												ref={ attributeListRef }
											>
												{ allAttributes.length > 0 ? (
													allAttributes.map( ( item ) => {
														const isAdded = isAttributeUsed( item );
														return (
															<li
																key={ item?.attribute_id }
																className={ classNames( {
																	'storeengine-variants__attributes__select-item--added':
																		isAdded,
																} ) }
															>
																<Button
																	label={ item.attribute_name }
																	type="button"
																	suffix="item-btn"
																	preset="white"
																	isDisabled={ isAdded }
																	onClick={ () => {
																		if ( isAdded ) {
																			return;
																		}
																		handleAddvariants(
																			item,
																			item?.attribute_id
																		);
																	} }
																/>
															</li>
														);
													} )
												) : (
													<li className="storeengine-variants__attributes__select-empty">
														<span
															className="storeengine-variants__empty-icon"
															aria-hidden={ true }
														>
															<svg
																width="22"
																height="22"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="1.8"
																strokeLinecap="round"
																strokeLinejoin="round"
															>
																<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
																<circle cx="7" cy="7" r="1.5" />
															</svg>
														</span>
														<strong className="storeengine-variants__empty-title">
															{ __( 'No attributes yet', 'storeengine' ) }
														</strong>
														<span className="storeengine-variants__empty-text">
															{ __(
																'Variants are built from attributes like Size or Color. Create one first, then come back to generate variants.',
																'storeengine'
															) }
														</span>
														<a
															className="storeengine-variants__empty-cta"
															href={ `${ admin_url }admin.php?page=storeengine-attributes` }
															target="_blank"
															rel="noopener noreferrer"
														>
															<span aria-hidden={ true }>+</span>
															{ __( 'Create attribute', 'storeengine' ) }
														</a>
													</li>
												) }
											</ul>
										) }
									</div>
									{ /* No save button here: attribute edits live in
									     the form and persist with the page's own
									     "Update product". */ }
								</div>
							</Modal>
						</Scope>,
						document.body
					) }
				{ ! hasAnyPrice && (
					<div className="storeengine-warning storeengine-product-notice storeengine-variants__price-hint">
						<span
							className="storeengine-icon storeengine-icon--info-primary"
							aria-hidden={ true }
						/>
						<div className="storeengine-product-notice__body">
							<span className="storeengine-product-notice__title">
								{ __( 'Set a product price first', 'storeengine' ) }
							</span>
							<span className="storeengine-product-notice__text">
								{ __(
									'Each variant extends the base price, so add a price before creating variants.',
									'storeengine'
								) }
							</span>
						</div>
					</div>
				) }
			</div>
			{ generatedVariants?.length > 0 && (
				<VariantImages
					attributes={ attributes }
					generatedVariants={ generatedVariants }
					setGeneratedVariants={ setGeneratedVariants }
				/>
			) }
			{ generatedVariants?.length > 0 && (
				<div
					className={ classNames(
						'storeengine-variants__scroll',
						'storeengine-mt-6',
						{
							'storeengine-variants__scroll--panel': 'panel' === viewMode,
						}
					) }
				>
					{ 'inline' === viewMode && (
					<div className="storeengine-variants__header">
						<span className="storeengine-variants__header__text storeengine-variants__col--variant">
							{ __( 'Variant', 'storeengine' ) }
						</span>
						<span className="storeengine-variants__header__text price-width storeengine-variants__col--base-price">
							<span className="price-width-text">
								{ __( 'Price', 'storeengine' ) }
							</span>
							<Tooltip>
								{ __(
									"Pick a base price, then optionally enter an extended price below it to adjust that base. Use a positive value to increase and a negative value to decrease the selected pricing's price. For unavailability of the variation, set the extended price to empty.",
									'storeengine'
								) }
							</Tooltip>
						</span>
						<span className="storeengine-variants__header__text storeengine-variants__col--total">
							{ __( 'Total', 'storeengine' ) }
						</span>
						<span className="storeengine-variants__header__text storeengine-variants__col--sku">
							{ __( 'SKU', 'storeengine' ) }
						</span>
						<span className="storeengine-variants__header__text storeengine-variants__col--barcode">
								{ __( 'Barcode', 'storeengine' ) }
							</span>
					</div>
					) }
					<div className="storeengine-variants__contents">
						<DynamicVariant
							generatedVariants={ generatedVariants }
							setGeneratedVariants={ setGeneratedVariants }
						/>
					</div>
				</div>
			) }
		</div>
	);
};

export default Variants;
