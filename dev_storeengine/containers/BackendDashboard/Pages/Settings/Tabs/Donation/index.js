import React from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import Number from '@Components/Formik/Number';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { useFormikContext } from 'formik';

/**
 * Donation & Name Your Price settings (free). Values live under the `donation`
 * settings key; per-product pricing (mode/min/max) is configured on each price
 * in the product editor, not here.
 */
const Donation = () => {
	const { values } = useFormikContext();
	const feeRecovery = values?.donation?.enable_fee_recovery;

	return (
		<div className="storeengine-settings-tab-content">
			<Checkbox
				title={ __( 'Enable donations & name your price', 'storeengine' ) }
				subtitle={ __(
					'Turn on customer-set pricing. Configure each product’s pricing mode in the product editor.',
					'storeengine'
				) }
				name="donation.enabled"
				direction={ true }
			/>

			<StoreEngineSeparator />

			<Text
				title={ __( 'Amount field label', 'storeengine' ) }
				subtitle={ __( 'Shown above the amount input on the product page.', 'storeengine' ) }
				name="donation.amount_field_label"
			/>

			<Text
				title={ __( 'Below-minimum message', 'storeengine' ) }
				subtitle={ __( 'Shown when the entered amount is below the minimum. Use {min} for the minimum amount.', 'storeengine' ) }
				name="donation.below_min_message"
			/>

			<Text
				title={ __( 'Above-maximum message', 'storeengine' ) }
				subtitle={ __( 'Shown when the entered amount is above the maximum. Use {max} for the maximum amount.', 'storeengine' ) }
				name="donation.above_max_message"
			/>

			<StoreEngineSeparator />

			<Checkbox
				title={ __( 'Enable fee recovery', 'storeengine' ) }
				subtitle={ __( 'Let donors optionally cover the payment processing fee so the cause nets the full amount.', 'storeengine' ) }
				name="donation.enable_fee_recovery"
				direction={ true }
			/>

			{ feeRecovery && (
				<>
					<Number
						title={ __( 'Fee recovery percent', 'storeengine' ) }
						subtitle={ __( 'Percentage added when a donor opts to cover the fee.', 'storeengine' ) }
						name="donation.fee_recovery_percent"
						percentage
					/>
					<Text
						title={ __( 'Fee recovery label', 'storeengine' ) }
						name="donation.fee_recovery_label"
					/>
				</>
			) }
		</div>
	);
};

export default Donation;
