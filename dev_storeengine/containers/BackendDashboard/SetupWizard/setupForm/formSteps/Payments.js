import React from 'react';
import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import { cx } from '@Components/ui';
import FormHeading from '../Component/FormHeading';
import TipRail from '../Component/TipRail';

const GATEWAYS = [
	{
		name: 'enable_stripe',
		badge: 'S',
		color: '#635bff',
		title: __( 'Stripe', 'storeengine' ),
		note: __( 'Cards, wallets, 3-D Secure · recommended', 'storeengine' ),
	},
	{
		name: 'enable_paypal',
		badge: 'P',
		color: '#003087',
		title: __( 'PayPal', 'storeengine' ),
		note: __( 'PayPal balance & cards', 'storeengine' ),
	},
	{
		name: 'enable_cod',
		badge: '₿',
		color: '#646c73',
		title: __( 'Offline / Cash on delivery', 'storeengine' ),
		note: __( 'Bank transfer, cash on delivery', 'storeengine' ),
	},
];

const TIPS = [
	{
		icon: 'globe',
		tone: 'primary',
		title: __( 'Multi-currency', 'storeengine' ),
		text: __( 'Sell & settle in local currencies with live rates.', 'storeengine' ),
	},
	{
		icon: 'installment',
		tone: 'violet',
		title: __( 'Installments', 'storeengine' ),
		text: __( 'Let buyers split payments into scheduled plans.', 'storeengine' ),
	},
	{
		icon: 'store',
		tone: 'success',
		title: __( 'Point of Sale', 'storeengine' ),
		text: __( 'Take the same catalog to an in-person register.', 'storeengine' ),
	},
];

const Payments = () => {
	const { values } = useFormikContext();

	return (
		<div className="storeengine-setup-payments flex gap-8">
			<div className="min-w-0 flex-1">
				<FormHeading
					title={ __( 'How do you want to get paid?', 'storeengine' ) }
					subHeading={ __(
						'Turn on a payment method now, or start with offline and add more anytime from Settings → Payments.',
						'storeengine'
					) }
				/>

				<div className="mt-6 flex flex-col gap-2.5">
					{ GATEWAYS.map( ( g ) => {
						const on = !! values[ g.name ];
						return (
							<label
								key={ g.name }
								htmlFor={ g.name }
								className={ cx(
									'flex items-center gap-4 rounded-se border border-solid p-3.5 cursor-pointer transition-colors',
									on
										? 'border-se-primary bg-se-primary-light'
										: 'border-se-border bg-se-white hover:border-se-primary'
								) }
							>
								<span
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-se text-sm font-extrabold text-white"
									style={ { background: g.color } }
									aria-hidden="true"
								>
									{ g.badge }
								</span>
								<span className="flex-1">
									<span className="block text-[13.5px] font-semibold text-se-text">
										{ g.title }
									</span>
									<span className="block text-xs text-se-subtitle">
										{ g.note }
									</span>
								</span>
								<Field
									id={ g.name }
									name={ g.name }
									type="checkbox"
									className="sr-only"
								/>
								<span
									className={ cx(
										'rounded-full px-3 py-1 text-[11px] font-bold',
										on
											? 'bg-se-success-light text-se-success'
											: 'bg-se-bg text-se-placeholder'
									) }
								>
									{ on
										? __( 'On', 'storeengine' )
										: __( 'Off', 'storeengine' ) }
								</span>
							</label>
						);
					} ) }
				</div>

				<p className="mt-4 text-xs text-se-placeholder">
					{ __(
						'You can connect API keys and fine-tune each gateway later in Settings.',
						'storeengine'
					) }
				</p>
			</div>

			<TipRail tips={ TIPS } />
		</div>
	);
};

export default Payments;
