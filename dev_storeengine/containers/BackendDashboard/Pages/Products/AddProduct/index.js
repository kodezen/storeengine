import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Formik } from 'formik';
import TopBar from '@Components/TopBar';
import {
	createNewProduct,
	updateProduct,
	getProduct,
} from '@Redux/Slices/productsSlice/productsSlice';
import { useDispatch, useSelector } from 'react-redux';
import { Scope, Button, Select } from '@Components/ui';
import PublishSplitButton, {
	getStatusActionLabel,
} from '@Components/PublishSplitButton';
import { useNavigate } from 'react-router-dom';
import FormInner from './FormInner';
import NewProductModal from './NewProductModal';
import { getProductInitialValues, normalizeNumericMeta } from './helper';
import { getRequiredErrors, setRequiredAttempted } from './productFormConfig';
import {
	getDefaultPriceName,
	persistSimplePrice,
} from './Options/Price/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import AddProductSkeleton from './AddProductSkeleton';
import { canWriteResource } from '@Utils/helper';
import ReadOnlyNotice from '@Components/ReadOnlyNotice';

// The simplified single-price UI keeps its working state on the product form
// (so it can be saved together with the product). These keys must never reach
// the product REST payload.
const stripPricingWorkingFields = ( obj ) => {
	const clone = { ...obj };
	delete clone._pricing_mode;
	delete clone._simple_price;
	delete clone._simple_compare_price;
	return clone;
};

import './styles.scss';

const AddProduct = ( { id, mode = 'admin', onSaved = null } ) => {
	const products = useSelector( ( state ) => state.products );
	const dispatch = useDispatch();
	const ID = id;
	const [ loading, setLoading ] = useState( false );
	// Onboarding step for brand-new products: prompt for title + type first.
	// Initialised once from the ID, so it only opens on a fresh create flow
	// and never re-opens after the user continues or while editing.
	const [ showStartModal, setShowStartModal ] = useState( ! ID );
	const [ creatingDraft, setCreatingDraft ] = useState( false );
	const navigate = useNavigate();
	const isVendor = mode === 'vendor';
	// View-only staff: keep the editor readable but hide the write controls.
	// Vendors and admins are never constrained here.
	const canEdit =
		isVendor || canWriteResource( 'products', ID ? 'update' : 'create' );

	// Continue from the onboarding modal: persist a draft with the chosen title
	// + type immediately, then move into edit mode for the saved record. Mirrors
	// the create branch of onSubmitHandler so the rest of the flow is identical.
	const handleCreateDraft = (
		formProps,
		{ title, shippingType, bundleEnabled }
	) => {
		setCreatingDraft( true );
		const payload = {
			...stripPricingWorkingFields( formProps.values ),
			title,
			// Variable vs. simple is decided later (by adding variants); the
			// modal only chooses simple vs. bundle.
			product_type: bundleEnabled ? 'bundled' : 'simple',
			status: isVendor ? 'pending' : 'draft',
			meta: normalizeNumericMeta( {
				...formProps.values.meta,
				_storeengine_product_shipping_type: shippingType,
			} ),
		};
		dispatch( createNewProduct( payload ) )
			.unwrap()
			.then( ( data ) => {
				setShowStartModal( false );
				if ( isVendor ) {
					if ( typeof onSaved === 'function' ) {
						onSaved( data );
					}
				} else {
					const searchParams = new URLSearchParams(
						window.location.search
					);
					searchParams.set( 'id', data?.id );
					searchParams.set( 'action', 'edit' );
					navigate( `?${ searchParams.toString() }` );
				}
				dispatch(
					showNotification( {
						message: __( 'Draft saved', 'storeengine' ),
						isShow: true,
						type: 'success',
					} )
				);
			} )
			.catch( () => {
				dispatch(
					showNotification( {
						message: __(
							'Could not create the product. Please try again.',
							'storeengine'
						),
						isShow: true,
						type: 'error',
					} )
				);
			} )
			.finally( () => setCreatingDraft( false ) );
	};

	useEffect( () => {
		if ( ! ID ) {
			return;
		}
		// The canonical record still needs fetching — the list-level response is
		// sparse (no rendered content, no full meta) and the create-response
		// payload is sparser — so `getProduct(ID)` hydrates the full record and
		// Formik (with `enableReinitialize`) rebinds to it.
		//
		// But only show the full-screen skeleton on a COLD open (deep-link /
		// refresh where nothing is in state yet). When the record is already in
		// `products.data` — e.g. right after creating it from the modal, or when
		// arriving from the list — render immediately from that record and
		// hydrate in the background. This keeps the post-create transition a
		// smooth in-place DOM update instead of a reload-like skeleton flash.
		const existing = products?.data?.find(
			( p ) => p && Number( p.id ) === Number( ID )
		);
		if ( ! existing ) {
			setLoading( true );
		}
		Promise.resolve( dispatch( getProduct( ID ) ) )
			.catch( ( error ) => console.warn( error ) )
			.finally( () => setLoading( false ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ ID, dispatch ] );

	// Show the "required" problems inline and as a toast. Returns true when
	// there were any (so the caller stops before saving).
	const reportRequiredErrors = ( requiredErrors ) => {
		if ( ! Object.keys( requiredErrors ).length ) {
			return false;
		}
		// Turns on the inline tags (they clear themselves as fields get filled).
		setRequiredAttempted( true );
		dispatch(
			showNotification( {
				message: Object.values( requiredErrors ).join( ' ' ),
				isShow: true,
				type: 'error',
			} )
		);
		window.requestAnimationFrame( () =>
			document
				.querySelector( '.storeengine-pf-field.has-error' )
				?.scrollIntoView( { behavior: 'smooth', block: 'center' } )
		);
		return true;
	};

	// Required-field tags belong to one editing session: clear them on leaving / switching product.
	useEffect( () => () => setRequiredAttempted( false ), [ ID ] );

	// Primary-button handler. The status picked in the caret menu is only staged
	// in Formik (like the Academy course editor), so this saves whatever is
	// currently staged. It still runs the normal Formik submit, so every
	// validation / vendor rule applies.
	const saveProduct = ( props ) => {
		if ( reportRequiredErrors( getRequiredErrors( props.values ) ) ) {
			return;
		}
		props.submitForm();
	};

	const onSubmitHandler = async ( values, actions ) => {
		actions.setSubmitting( true );

		// Pull the simplified single-price working state off the form before it
		// becomes the product payload; it is persisted separately below.
		const pricingMode = values._pricing_mode;
		const simplePrice = values._simple_price;
		const simpleComparePrice = values._simple_compare_price;
		const hasSimplePrice =
			simplePrice !== '' &&
			simplePrice !== null &&
			simplePrice !== undefined;

		const updatedValues = stripPricingWorkingFields( values );

		// The publish date is only sent for a Scheduled product; any other status
		// leaves WordPress to manage it.
		if ( updatedValues.status === 'future' ) {
			if (
				! updatedValues.date ||
				new Date( updatedValues.date ).getTime() <= Date.now()
			) {
				dispatch(
					showNotification( {
						message: __(
							'Pick a future date and time to schedule this product.',
							'storeengine'
						),
						isShow: true,
						type: 'error',
					} )
				);
				actions.setSubmitting( false );
				return;
			}
		} else {
			delete updatedValues.date;
		}
		if ( updatedValues.meta ) {
			updatedValues.meta = normalizeNumericMeta( updatedValues.meta );
		}
		if ( updatedValues.meta?._storeengine_product_purchase_redirect_url ) {
			updatedValues.meta._storeengine_product_purchase_redirect_url = `${ updatedValues.meta._storeengine_product_purchase_redirect_url }`;
		}

		// Vendor mode: server-side pins post_author and (for new/unpublished
		// products) forces post_status=pending — vendors can't self-publish. But
		// editing an already-published product keeps its real status, so only
		// force pending on create; existing products keep values.status.
		if ( isVendor && ! ID ) {
			updatedValues.status = 'pending';
		}

		if ( values.title === '' ) {
			dispatch(
				showNotification( {
					message: __( 'Title Missing', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
			return;
		}

		// Required fields from Settings → Product form. Drafts stay lenient (the
		// server applies the same rule), so this only bites when leaving draft.
		const requiredErrors = getRequiredErrors( values );
		if ( reportRequiredErrors( requiredErrors ) ) {
			actions.setSubmitting( false );
			return;
		}

		// Validate the simple compare-at price up front so we never half-save
		// (product persisted, then the price rejected by the server). The
		// compare-at price is OPTIONAL: only enforce "must be higher" when a
		// positive value is entered — empty or 0 means "no compare price".
		if (
			pricingMode === 'simple' &&
			hasSimplePrice &&
			parseFloat( simpleComparePrice ) > 0 &&
			parseFloat( simpleComparePrice ) <= parseFloat( simplePrice )
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
			actions.setSubmitting( false );
			return;
		}

		try {
			let data;
			if ( ID ) {
				if (
					updatedValues.meta
						._storeengine_product_description_editor_type ===
					'builder'
				) {
					delete updatedValues.content;
				}
				const action = await dispatch(
					updateProduct( { id: ID, formData: updatedValues } )
				);
				data = action.payload;
			} else {
				const action = await dispatch(
					createNewProduct( updatedValues )
				);
				data = action.payload;
			}

			// Thunk swallowed an error and already notified the user.
			if ( ! data?.id ) {
				actions.setSubmitting( false );
				return;
			}

			let formData = data;

			// Persist the single one-time price for the simplified UI through
			// the existing price endpoints (no DB/schema change), then re-read
			// the product so prices[] and the simple fields rebind from
			// canonical data.
			if ( pricingMode === 'simple' && hasSimplePrice ) {
				const existingOnetime = ( values.prices ?? [] ).find(
					( p ) => p?.price_type === 'onetime'
				);
				try {
					await persistSimplePrice( {
						productId: data.id,
						priceId: existingOnetime?.id,
						// Keep an existing (hidden) label; only auto-name a
						// brand-new price.
						priceName:
							existingOnetime?.price_name ||
							getDefaultPriceName(),
						price: simplePrice,
						comparePrice: simpleComparePrice,
						donation: values.donation,
					} );
				} catch ( error ) {
					dispatch(
						showNotification( {
							message:
								error?.message ||
								error ||
								__( 'Could not save the price.', 'storeengine' ),
							isShow: true,
							type: 'error',
						} )
					);
				}
			}

			// Always re-read the canonical record (edit context) after saving so
			// server-generated fields — auto-generated SKU / barcode, recomputed
			// prices, etc. — show up immediately instead of only after a manual
			// browser refresh. The create/update response is deliberately sparse,
			// so binding the form to it alone left auto SKU/barcode blank.
			try {
				const refetch = await dispatch( getProduct( data.id ) );
				if ( refetch?.payload ) {
					formData = refetch.payload;
				}
			} catch ( e ) {
				// Non-fatal: fall back to the save response.
			}

			actions.setValues(
				getProductInitialValues( formData?.id, formData )
			);

			if ( ! ID ) {
				if ( isVendor ) {
					// Vendor flow: hand the saved record back to the host
					// (VendorProducts owns the URL transition).
					if ( typeof onSaved === 'function' ) {
						onSaved( formData );
					} else {
						console.warn(
							'[AddProduct] vendor mode but no onSaved'
						);
					}
				} else {
					// Admin flow: navigate to ?id=<new>&action=edit.
					const searchParams = new URLSearchParams(
						window.location.search
					);
					searchParams.set( 'id', formData?.id );
					searchParams.set( 'action', 'edit' );
					navigate( `?${ searchParams.toString() }` );
				}

				dispatch(
					showNotification( {
						message: __(
							'Create Product Successfully',
							'storeengine'
						),
						isShow: true,
						type: 'success',
					} )
				);
			} else if ( isVendor && typeof onSaved === 'function' ) {
				onSaved( formData );
			}
		} finally {
			actions.setSubmitting( false );
		}
	};

	return (
		<Scope>
			{ loading ? (
				<AddProductSkeleton />
			) : (
				<Formik
					enableReinitialize={ true }
					initialValues={ ( () => {
						const base = getProductInitialValues(
							ID,
							// Guard against sparse/undefined entries that can
							// appear in `products.data` between a create
							// dispatch and the slice settling.
							products.data.find(
								( p ) =>
									p && Number( p.id ) === Number( ID )
							)
						);
						// Vendors cannot self-publish — show 'pending' from the get-go.
						if ( isVendor && ! ID ) {
							base.status = 'pending';
						}
						return base;
					} )() }
					onSubmit={ onSubmitHandler }
				>
					{ ( props ) => {
						return (
							<>
								<TopBar
									classNames='mx-6'
									title={
										ID
											? __(
													'Update Product',
													'storeengine'
											  )
											: __(
													'Create Product',
													'storeengine'
											  )
									}
									render={ () => (
										<>
											{ ID ? (
												<Button
													icon="storeengine-icon--go-on"
													preset="ghost"
													size="md"
													aria-label={ __(
														'View Product',
														'storeengine'
													) }
													onClick={ () =>
														window.open(
															props?.values?.link,
															'_blank'
														)
													}
												/>
											) : (
												''
											) }

												{ ! isVendor && canEdit && (
													<PublishSplitButton
														value={ props?.values?.status }
														date={ props?.values?.date }
														label={ getStatusActionLabel(
															props?.values?.status,
															Boolean( ID ) &&
																props?.values?.status === 'publish'
														) }
														isSaving={ props?.isSubmitting }
														isMuted={ ! props?.dirty }
														onStatusChange={ ( status ) =>
															props.setFieldValue( 'status', status )
														}
														onDateChange={ ( date ) =>
															props.setFieldValue( 'date', date )
														}
														onSave={ () => saveProduct( props ) }
													/>
												) }
											{ isVendor && (
												<>
													{ canEdit && (
														<Button
															type="submit"
															preset="primary"
															onClick={ props?.submitForm }
															isLoading={ props?.isSubmitting }
															disabled={ ! props?.dirty }
														>
															{ ID ? __( 'Update Product', 'storeengine' ) : __( 'Create Product', 'storeengine' ) }
														</Button>
													) }
												</>
											) }
										</>
									) }
								/>
								{ ! canEdit && <ReadOnlyNotice /> }
								<FormInner ID={ ID } mode={mode} />
								{ ! ID && (
									<NewProductModal
										isOpen={ showStartModal }
										isSaving={ creatingDraft }
										defaultShippingType={
											props.values?.meta
												?._storeengine_product_shipping_type
										}
										onClose={ () => {
											if ( ! creatingDraft ) {
												setShowStartModal( false );
											}
										} }
										onContinue={ ( data ) =>
											handleCreateDraft( props, data )
										}
									/>
								) }
							</>
						);
					} }
				</Formik>
			) }
		</Scope>
	);
};

export default AddProduct;
