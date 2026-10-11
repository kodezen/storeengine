import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import FormHeading from '../../Component/FormHeading';
import { useFormikContext } from 'formik';
import Label from '@Components/Formik/Label';
import { Button } from '@Components/ui';
import { makeRequest2 } from '@Utils/helper';
import PostSelect from '@Components/PostSelect';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

import './styles.scss';

const SetupPages = () => {
	const {
		values: { settings },
		setFieldValue,
	} = useFormikContext();
	const [ showWooWarning, setShowWooWarning ] = useState( false );
	const dispatch = useDispatch();
	const [ loading, setLoading ] = useState();

	const generate_pages = async ( payload = {} ) => {
		setLoading( true );

		try {
			const response = await makeRequest2(
				'setup/generate_store_pages',
				payload
			);

			if ( response.should_use_woo_pages ) {
				dispatch(
					showNotification( {
						message: __(
							'You should Use WooCommerce Pages',
							'storeengine'
						),
						isShow: true,
						type: 'success',
					} )
				);
				setShowWooWarning( true );
				return;
			}
			dispatch(
				showNotification( {
					message: __(
						'Generated Pages Successfully',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
			setShowWooWarning( false );
			Object.keys( response ).forEach( ( key ) =>
				setFieldValue( 'settings.' + key, response[ key ] )
			);
		} catch ( error ) {
			dispatch(
				showNotification( {
					message: __( 'Something went wrong', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		} finally {
			setLoading( false );
		}
	};

	return (
		<div className="storeengine-setup-pages">
			<FormHeading
				title={ __( 'Set up your store pages', 'storeengine' ) }
				subHeading={ __(
					'Generate Shop, Cart, Checkout, Receipt and Account pages in one click — or pick existing pages.',
					'storeengine'
				) }
			/>
			<div className="storeengine-setup-pages__generate-all">
				<Button
					preset="outline"
					icon="storeengine-icon--magic-pen"
					onClick={ () => generate_pages() }
					disabled={ showWooWarning }
					isLoading={ loading }
				>
					{ __( 'Generate All Pages', 'storeengine' ) }
				</Button>
			</div>
			{ showWooWarning && (
				<div className="storeengine-setup-pages__warning storeengine-mb-4 storeengine-flex storeengine-justify-between storeengine-align-center">
					<div className="storeengine-flex-column storeengine-flex-gap-4">
						<h2>
							{ __(
								'WooCommerce Already Installed',
								'storeengine'
							) }
						</h2>
						<p>
							{ ' ' }
							{ __(
								'Do you want to use the StoreEngine default pages over the existing WooCommerce pages?',
								'storeengine'
							) }
						</p>
					</div>
					<div className="storeengine-flex storeengine-flex-gap-12 storeengine-flex-align-center">
						<Button
							preset="outline"
							onClick={ () =>
								generate_pages( { use_prefix: true } )
							}
							isLoading={ loading }
						>
							{ __( 'No', 'storeengine' ) }
						</Button>
						<Button
							preset="primary"
							onClick={ () =>
								generate_pages( { use_woo_pages: true } )
							}
							isLoading={ loading }
						>
							{ __( 'Yes', 'storeengine' ) }
						</Button>
					</div>
				</div>
			) }
			<div className="storeengine-setup-pages__selects storeengine-mb-4 storeengine-mt-6">
				<div className="storeengine-setup-pages__select-item">
					<Label
						htmlFor="setup_pages_checkout"
						title={ __( 'Checkout', 'storeengine' ) }
					/>
					<PostSelect name="settings.checkout_page" postType="page" />
				</div>
				<div className="storeengine-setup-pages__select-item">
					<Label
						htmlFor="setup_pages_cart"
						title={ __( 'Cart', 'storeengine' ) }
					/>
					<PostSelect name="settings.cart_page" postType="page" />
				</div>
			</div>
			<div className="storeengine-setup-pages__selects storeengine-mb-4">
				<div className="storeengine-setup-pages__select-item">
					<Label
						htmlFor="setup_pages_receipt"
						title={ __( 'Receipt', 'storeengine' ) }
					/>
					<PostSelect name="settings.thankyou_page" postType="page" />
				</div>
				<div className="storeengine-setup-pages__select-item">
					<Label
						htmlFor="setup_pages_shop"
						title={ __( 'Shop', 'storeengine' ) }
					/>
					<PostSelect name="settings.shop_page" postType="page" />
				</div>
			</div>
			<Label
				htmlFor="setup_pages_user_dashboard"
				title={ __( 'User Dashboard', 'storeengine' ) }
			/>
			<PostSelect name="settings.dashboard_page" postType="page" />
		</div>
	);
};

export default SetupPages;
