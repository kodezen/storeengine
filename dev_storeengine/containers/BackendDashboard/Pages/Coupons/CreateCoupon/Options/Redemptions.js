import { __ } from '@wordpress/i18n';
import Number from '@Components/Formik/Number';
import Label from '@Components/Formik/Label';
import Checkbox from '@Components/Formik/Checkbox';
import Textarea from '@Components/Formik/Textarea';
import ProLock from './ProLock';
import { Scope, Heading } from '@Components/ui';

const Redemptions = () => {
	return (
		<Scope
			as="div"
			id="coupon-usage-limit"
			className="storeengine-content-section storeengine-content-section__limit"
		>
			<Heading as="p">
				{ __( 'Coupon Usage Limit', 'storeengine' ) }
			</Heading>
			<div className="storeengine-tab-content__limit--body">
				<div className="storeengine-mb-6">
					<Label
						htmlFor="meta._storeengine_coupon_customer_usage_limit"
						title={ __( 'Customer Limit', 'storeengine' ) }
						tooltip={ __(
							'Number of times each customer can use this coupon.',
							'storeengine'
						) }
					/>
					<Number
						placeholder={ __( 'Unlimited', 'storeengine' ) }
						name="meta._storeengine_coupon_customer_usage_limit"
						min={ 0 }
						step={ 1 }
					/>
					<span className="storeengine-sub-title-light">
						{ __(
							'Max uses per customer; 0 for unlimited',
							'storeengine'
						) }
					</span>
				</div>
				<Label
					htmlFor="meta._storeengine_coupon_usage_limit"
					title={ __( 'Total Usages Limit', 'storeengine' ) }
					tooltip={ __(
						'Total number of times this coupon can be used.',
						'storeengine'
					) }
				/>
				<Number
					placeholder={ __( 'Unlimited', 'storeengine' ) }
					name="meta._storeengine_coupon_usage_limit"
					min={ 0 }
					step={ 1 }
				/>
				<span className="storeengine-sub-title-light">
					{ __(
						'Max total uses for all customers; 0 for unlimited.',
						'storeengine'
					) }
				</span>
				<div className="storeengine-mt-6">
					<ProLock
						label={ __(
							'Auto-apply this coupon to every eligible cart.',
							'storeengine'
						) }
					>
						<Checkbox
							title={ __( 'Auto apply', 'storeengine' ) }
							subtitle={ __(
								'Automatically apply this coupon to every eligible cart, without entering a code.',
								'storeengine'
							) }
							name="meta._storeengine_coupon_auto_apply"
						/>
					</ProLock>
				</div>
				<div className="storeengine-mt-6">
					<ProLock
						label={ __(
							'Promote coupons in the cart & customer dashboard.',
							'storeengine'
						) }
					>
						<>
							<Checkbox
								title={ __( 'Promote in cart', 'storeengine' ) }
								subtitle={ __(
									'Show this coupon as a cart nudge and on the customer coupons dashboard.',
									'storeengine'
								) }
								name="meta._storeengine_coupon_promote"
							/>
							<Textarea
								title={ __(
									'Promotion message (optional)',
									'storeengine'
								) }
								name="meta._storeengine_coupon_promote_text"
								rows={ 2 }
								placeholder={ __(
									'e.g. Members save big!',
									'storeengine'
								) }
							/>
						</>
					</ProLock>
				</div>
			</div>
		</Scope>
	);
};

export default Redemptions;
