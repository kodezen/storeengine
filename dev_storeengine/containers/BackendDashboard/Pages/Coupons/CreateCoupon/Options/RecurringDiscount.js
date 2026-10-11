import React from 'react';
import { useFormikContext } from 'formik';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import Number from '@Components/Formik/Number';
import { Scope, Heading } from '@Components/ui';

/**
 * Subscription recurring-discount controls. When enabled, the coupon's discount
 * keeps applying to renewals (for a fixed number of renewals, or forever).
 */
const RecurringDiscount = () => {
	const { values } = useFormikContext();
	const enabled =
		values?.meta?._storeengine_coupon_recurring_discount === true;

	return (
		<Scope
			as="div"
			id="recurringDiscount"
			className="storeengine-content-section storeengine-content-section__recurring-discount"
		>
			<Heading as="p">
				{ __( 'Subscription Renewals', 'storeengine' ) }
			</Heading>

			<Checkbox
				title={ __( 'Recurring discount', 'storeengine' ) }
				subtitle={ __(
					'Keep applying this discount to subscription renewals, not just the first payment.',
					'storeengine'
				) }
				name="meta._storeengine_coupon_recurring_discount"
			/>

			{ enabled && (
				<Number
					title={ __( 'Number of renewals', 'storeengine' ) }
					subtitle={ __(
						'How many renewals to keep the discount for. Set 0 to apply it forever.',
						'storeengine'
					) }
					name="meta._storeengine_coupon_recurring_discount_limit"
					min={ 0 }
				/>
			) }
		</Scope>
	);
};

export default RecurringDiscount;
