import * as React from 'react';
import { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import ContentSection from '@Components/Layouts/ContentSection';
import { FieldArray, useFormikContext } from 'formik';
import { Button, Scope } from '@Components/ui';
import {
	ReactSelect,
	ReactAsyncSelect,
	Option,
	SelectOptions,
} from '@Components/Formik/ReactSelect';
import { makeRequest2, API, get_api_route } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import OptionMenu from '@Components/OptionMenu';
import {
	PostMetaObject,
	ProductBundle,
	StoreEngineProduct,
} from '../../../../../../../index';

import './table.scss';
import './styles.scss';

type BundleEditorProps = {
	ID: number;
	meta?: PostMetaObject;
	bundles?: ProductBundle[];
	push: ( bundle: ProductBundle ) => void;
	remove: ( index: number ) => void;
	setFieldValue: ( name: string, value: any ) => void;
};

type productSearchArgs = {
	search?: string | undefined;
	id?: number | null;
	exclude?: number[] | undefined;
	[ key: string ]: any;
};

type ProductPriceData = Option< number > & {
	price: number;
	compare: number;
};

type SearchProductResponse =
	| ( Option< number > & { prices: ProductPriceData[] } )[]
	| null;

const searchProduct = (
	{ search, id, exclude }: productSearchArgs,
	meta?: PostMetaObject
): Promise< SearchProductResponse > => {
	const payload: Record< string, any > = { search, id, exclude };

	if ( meta ) {
		if ( meta._storeengine_product_shipping_type ) {
			payload.is_digital =
				'digital' === meta._storeengine_product_shipping_type;
		}
		if ( meta._storeengine_product_download_type ) {
			payload.is_versioned =
				'versioned' === meta._storeengine_product_download_type;
		}
	}

	return makeRequest2( 'search_product_callback', payload );
};

const BundleEditor = ( {
	ID,
	meta,
	bundles,
	push,
	remove,
	setFieldValue,
}: BundleEditorProps ) => {
	const [ prices, setPrices ] = useState< {
		[ key: string ]: ProductPriceData[];
	} >( {} );
	const [ isSyncing, setIsSyncing ] = useState( false );
	const dispatch = useDispatch();

	// Retroactively grant every product currently in this bundle to everyone
	// who already purchased it. The endpoint reads the *saved* bundle contents
	// (not the in-form state) and is idempotent, so already-granted items are
	// skipped. It is paged, so we loop until the server reports it is done.
	const handleSyncToBuyers = async () => {
		if (
			! window.confirm(
				__(
					'Grant every product currently in this bundle to everyone who already purchased it? This uses the saved bundle contents — save the product first if you have unsaved changes.',
					'storeengine'
				)
			)
		) {
			return;
		}

		setIsSyncing( true );

		let page = 1;
		let total = 0;
		let processed = 0;
		let skipped = 0;
		let syncedOrders = 0;
		let grantedDownloads = 0;
		let warnings: { product_name: string; reason: string }[] = [];

		try {
			// eslint-disable-next-line no-constant-condition
			while ( true ) {
				const { data } = await API.post(
					get_api_route( `bundle/${ ID }/sync-purchasers` ),
					{ page, per_page: 25 }
				);

				total = data.total;
				processed += data.processed;
				skipped += data.skipped ?? 0;
				syncedOrders += data.synced_orders;
				grantedDownloads += data.granted_downloads;
				warnings = data.warnings ?? [];

				if ( data.done || ! data.next_page ) {
					break;
				}

				page = data.next_page;
			}

			let message =
				0 === total
					? __( 'No buyers found for this bundle yet.', 'storeengine' )
					: sprintf(
							/* translators: 1: orders updated, 2: buyers processed, 3: download grants created. */
							__(
								'Synced %1$d of %2$d buyers — %3$d new download grants.',
								'storeengine'
							),
							syncedOrders,
							processed,
							grantedDownloads
					  );

			if ( skipped > 0 ) {
				message +=
					' ' +
					sprintf(
						/* translators: %d: orders skipped because they are not paid or no longer active. */
						__(
							'%d order(s) skipped — not paid or no longer active.',
							'storeengine'
						),
						skipped
					);
			}

			// A product with nothing released behind it still grants a license key
			// but no file. Say it out loud in the same toast — the notification
			// store holds one message, so a second dispatch would just erase this
			// one — otherwise the only signal is a support ticket.
			if ( warnings.length > 0 ) {
				message +=
					'<ul class="storeengine-m-0" style="padding-left:1rem;">' +
					warnings
						.map(
							( w ) =>
								`<li>${ w.product_name } — ${ w.reason }</li>`
						)
						.join( '' ) +
					'</ul>';
			}

			dispatch(
				showNotification( {
					message,
					isShow: true,
					type: warnings.length > 0 ? 'warning' : 'success',
				} )
			);
		} catch ( error ) {
			dispatch(
				showNotification( {
					message: error,
					isShow: true,
					type: 'error',
				} )
			);
		} finally {
			setIsSyncing( false );
		}
	};

	return (
		<Scope>
			{ bundles && bundles.length > 0 && (
				<div className="storeengine-product-bundle-list se-ui-table layout-fixed">
					<div className="se-ui-thead">
						<div className="se-ui-tr">
							<div className="se-ui-th">
								{ __( 'Select Product', 'storeengine' ) }
							</div>
							<div className="se-ui-th">
								{ __( 'Choose Plan', 'storeengine' ) }
							</div>
							<div className="se-ui-th">
								<span className="screen-reader-text">
									{ __( 'Action', 'storeengine' ) }
								</span>
							</div>
						</div>
					</div>
					<div className="se-ui-tbody bundle-list">
						{ bundles.map( ( item, index ) => {
							return (
								<div className="se-ui-tr" key={ index }>
									<div className="se-ui-td">
										<ReactAsyncSelect< number, false >
											name={ `bundles.${ index }.product_id` }
											placeholder={ __(
												'Select A Product',
												'storeengine'
											) }
											className="storeengine-select"
											classNamePrefix="storeengine-react-select"
											defaultOptions={ true }
											loadByValue={ ( product_id ) =>
												searchProduct(
													{ id: product_id },
													meta
												)
											}
											loadOptions={ async (
												input
											): Promise< SelectOptions< number > | void > => {
												const args: productSearchArgs =
													{ exclude: [] };
												if ( '' === input ) {
													args.id =
														item.product_id as number;
													args.exclude = bundles?.map(
														( b ) =>
															b.product_id as number
													);
												} else {
													args.search = input;
													args.exclude = bundles?.map(
														( b ) =>
															b.product_id as number
													);
												}

												if ( args.exclude ) {
													args.exclude =
														args.exclude.filter(
															( pid ) =>
																pid !=
																item.product_id
														);
												}

												if ( args.exclude ) {
													args.exclude = [
														ID,
														...args.exclude,
													];
												} else {
													args.exclude = [ ID ];
												}

												const response =
													await searchProduct(
														args,
														meta
													);

												if ( ! response ) {
													return;
												}

												setPrices( ( prev ) => {
													const _p = { ...prev };
													response.forEach(
														( p ) =>
															( _p[
																'' + p.value
															] = p.prices )
													);
													return _p;
												} );

												return response;
											} }
										/>
									</div>
									<div className="se-ui-td">
										<ReactSelect< number >
											name={ `bundles.${ index }.price_id` }
											placeholder={
												item.product_id
													? __(
															'Select A Price',
															'storeengine'
													  )
													: __(
															'Select A Product First',
															'storeengine'
													  )
											}
											options={
												prices[ '' + item.product_id ]
											}
											isDisabled={ ! item.product_id }
										/>
									</div>
									<div className="se-ui-td">
										<Button
											preset="outline-danger"
											size="md"
											className="storeengine-product-bundle-list__remove"
											aria-label={ __(
												'Remove from bundle',
												'storeengine'
											) }
											icon="storeengine-icon--trash"
											onClick={ () => remove( index ) }
										/>
									</div>
								</div>
							);
						} ) }
					</div>
				</div>
			) }

			<div className="storeengine-product-bundle-actions">
				<Button
					preset="outline"
					className="storeengine-product-bundle-add"
					aria-label={ __( 'Add product to bundle', 'storeengine' ) }
					icon="storeengine-icon--add"
					onClick={ () =>
						push( { product_id: null, price_id: null } )
					}
				>
					{ __( 'Add New Product', 'storeengine' ) }
				</Button>

				{ ID > 0 && bundles && bundles.length > 0 && (
					<OptionMenu
						suffix="bundle-actions"
						isLoading={ isSyncing }
						options={ [
							{
								type: 'button',
								label: (
									<span>
										{ __(
											'Sync to Existing Buyers',
											'storeengine'
										) }
									</span>
								),
								icon: (
									<span
										className="storeengine-icon storeengine-icon--reload"
										aria-hidden={ true }
									/>
								),
								onClick: handleSyncToBuyers,
							},
						] }
					/>
				) }
			</div>
		</Scope>
	);
};

type ProductBundleEditorProps = {
	ID: number;
	mode: string;
};

const ProductBundleEditor = React.memo(
	( { ID, mode }: ProductBundleEditorProps ) => {
		const {
			values: { product_type, variants, bundles, meta },
			setFieldValue,
		} = useFormikContext< StoreEngineProduct >();

		return (
			<ContentSection
				className="storeengine-prodcut-bundle"
				slug="product-bundle"
				label={ __( 'Product Bundle', 'storeengine' ) }
				useToggle
				isEnabled={ product_type === 'bundled' }
				mode={ mode }
				onToggle={ ( toggled ) => {
					if ( toggled ) {
						setFieldValue( 'product_type', 'bundled' );
					} else {
						setFieldValue(
							'product_type',
							variants && variants.length ? 'variable' : 'simple'
						);
					}
				} }
			>
				<FieldArray name="bundles">
					{ ( { push, remove } ) => {
						return (
							<BundleEditor
								ID={ ID }
								meta={ meta }
								bundles={ bundles }
								push={ push }
								remove={ remove }
								setFieldValue={ setFieldValue }
							/>
						);
					} }
				</FieldArray>
			</ContentSection>
		);
	}
);

ProductBundleEditor.displayName = 'ProductBundleEditor';

export default ProductBundleEditor;
