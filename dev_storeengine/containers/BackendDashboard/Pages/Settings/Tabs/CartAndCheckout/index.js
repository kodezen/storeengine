import React from 'react';
import { useFormikContext } from 'formik';
import { __, _x } from '@wordpress/i18n';
import {
	TabContent,
	ContentSection,
} from '@Containers/BackendDashboard/Pages/Settings/Layouts';
import { Select } from '@Components/ui/Select';
import Label from '@Components/Formik/Label';
import countries from '@Utils/countries';
import './styles.scss';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';

const CountryListWithDefault = [
	{ label: __( 'Default', 'storeengine' ), value: 'none' },
	...countries,
];

const CartAndCheckout = () => {
	const {
		values: {
			checkout_default_country: country,
			enable_after_purchase_redirect: afterPurchaseRedirectEnabled,
		},
		setFieldValue,
	} = useFormikContext();

	return (
		<TabContent>
			<ContentSection
				slug={ 'cart' }
				label={ __( 'Cart', 'storeengine' ) }
			>
				<div className="flex flex-col gap-[24px]">
					<Checkbox
						title={ __( 'Mini Cart', 'storeengine' ) }
						name={ 'enable_floating_cart' }
						suffix='plain'
					/>
					<Checkbox
						title={ __( 'Open cart drawer on add to cart', 'storeengine' ) }
						name={ 'auto_open_cart_drawer' }
						subtitle={ __(
							'Slides the mini-cart drawer open automatically after a product is added (including from Quick View).',
							'storeengine'
						) }
					/>
				</div>
			</ContentSection>
			<ContentSection
				slug={ 'checkout' }
				label={ __( 'Checkout', 'storeengine' ) }
			>
				<Checkbox
					title={ __(
						'Enable After Purchase Redirect',
						'storeengine'
					) }
					name={ 'enable_after_purchase_redirect' }
				/>
				{ afterPurchaseRedirectEnabled && (
					<Text
						title={ __( 'Redirect URL', 'storeengine' ) }
						subtitle={ __(
							'Sent here after purchase when the product itself has no redirect set. Leave blank to keep the default thank-you page.',
							'storeengine'
						) }
						name="after_purchase_redirect_url"
						type="url"
						placeholder={ __(
							'https://example.com/thank-you',
							'storeengine'
						) }
					/>
				) }
				<div className={ `storeengine-form-group` }>
					<Label title={ __( 'Default Country', 'storeengine' ) } />
					<Select
						id="checkout_default_country"
						name="checkout_default_country"
						className="storeengine-select storeengine-mt-2"
						classNamePrefix="storeengine-react-select"
						placeholder={ __( 'Select country', 'storeengine' ) }
						value={
							country
								? countries?.filter(
										( item ) => item.value === country
								  )
								: CountryListWithDefault[ 0 ]
						}
						options={ CountryListWithDefault }
						onChange={ ( option ) => {
							setFieldValue(
								'checkout_default_country',
								'none' === option.value ? '' : option.value
							);
						} }
						menuPlacement={ 'top' }
					/>
				</div>
			</ContentSection>
		</TabContent>
	);
};

export default CartAndCheckout;
