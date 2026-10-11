import React from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { useFormikContext } from 'formik';
import { Link } from 'react-router-dom';
import { admin_url } from '@Utils/helper';
import { Scope } from '@Components/ui';

const DEFAULTS = {
	show_on_archive: true,
	show_on_single: true,
	button_label_modal: __( 'Quick Checkout', 'storeengine' ),
};

const InstantCheckout = () => {
	useFormikContext(); // ensure subtree re-renders on form value changes

	return (
		<Scope
			as="div"
			id="settingsInstantCheckout"
			className="storeengine-tab-content--instant-checkout"
		>
			<div className="storeengine-content-section">
				<h2 className="storeengine-heading">
					{ __( 'Instant Checkout', 'storeengine' ) }
				</h2>
				<p className="storeengine-mb-6">
					{ __(
						'Adds a Quick Checkout modal to your storefront so shoppers can complete a purchase from the product card without leaving the page. Use the [storeengine_instant_checkout] shortcode to embed the same checkout (with product details + form) on any WP page.',
						'storeengine'
					) }
				</p>

				<div
					className="storeengine-notice storeengine-notice--info storeengine-mb-6"
					style={ {
						padding: '12px 14px',
						borderRadius: '6px',
						fontSize: '13px',
						lineHeight: '1.5',
					} }
				>
					<strong>
						{ __(
							'Replaces the legacy "Buy Now" button.',
							'storeengine'
						) }
					</strong>{ ' ' }
					{ __(
						'While Instant Checkout is enabled, the core Direct Checkout (Buy Now) button is automatically hidden on shop archives and single product pages, and the Quick Checkout button takes its position. The "Enable Direct Checkout" toggle under Products → Settings has no effect for those pages until you turn off Instant Checkout.',
						'storeengine'
					) }
				</div>

				<StoreEngineSeparator isBottom={ true } />

				<h3 className="storeengine-heading">
					{ __( 'Where to show the button', 'storeengine' ) }
				</h3>
				<Checkbox
					title={ __( 'Show on shop archive', 'storeengine' ) }
					name="instant_checkout.show_on_archive"
				/>
				<Checkbox
					title={ __( 'Show on single product page', 'storeengine' ) }
					name="instant_checkout.show_on_single"
				/>

				<StoreEngineSeparator isBottom={ true } />

				<div className="flex flex-col items-start w-full">
					<h3 className="storeengine-heading w-full">
						{ __( 'Available shortcodes', 'storeengine' ) }
					</h3>

					<p className="storeengine-title storeengine-mb-2">
						{ __(
							'Drop these shortcodes on any WordPress page or post to embed Quick Checkout.',
							'storeengine'
						) }
					</p>

					<Link
						to={ `${ admin_url }admin.php/?page=storeengine-tools&path=shortcodes` }
					>
						{ __( 'See all shortcodes', 'storeengine' ) }{ ' ' }
					</Link>
				</div>
			</div>
		</Scope>
	);
};

InstantCheckout.DEFAULTS = DEFAULTS;

export default InstantCheckout;
