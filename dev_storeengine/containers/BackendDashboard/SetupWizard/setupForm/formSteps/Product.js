import { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { cx } from '@Components/ui';
import FormHeading from '../Component/FormHeading';
import SelectableCard from '../Component/SelectableCard';
import TipRail from '../Component/TipRail';

// Required, single-select primary product type (defaults to "both").
const PRIMARY = [
	{
		value: 'physical',
		icon: 'box',
		title: __( 'Physical products', 'storeengine' ),
		subtitle: __( 'Ship goods, manage stock', 'storeengine' ),
	},
	{
		value: 'digital',
		icon: 'download',
		title: __( 'Digital downloads', 'storeengine' ),
		subtitle: __( 'Files, keys, media', 'storeengine' ),
	},
	{
		value: 'both',
		icon: 'grid',
		title: __( 'Both', 'storeengine' ),
		subtitle: __( 'Physical & digital products', 'storeengine' ),
	},
];

// Optional extra capabilities. `types` decides which primary product types the
// capability is offered for, so the list adapts as the user switches between
// Physical / Digital / Both (e.g. POS only makes sense with physical selling,
// memberships lean digital). Anything toggled on but then hidden by a type
// switch is reset, so state always matches what's shown.
const CAPABILITIES = [
	{
		name: 'service_products',
		icon: 'briefcase',
		title: __( 'Services', 'storeengine' ),
		subtitle: __( 'Coaching, consulting, bookings', 'storeengine' ),
		enables: __( 'Enables · Subscriptions', 'storeengine' ),
		types: [ 'digital', 'both' ],
	},
	{
		name: 'membership_support',
		icon: 'membership',
		title: __( 'Memberships', 'storeengine' ),
		subtitle: __( 'Members-only products & content', 'storeengine' ),
		enables: __( 'Enables · Membership', 'storeengine' ),
		types: [ 'digital', 'both' ],
	},
	{
		name: 'enable_pos',
		icon: 'store',
		title: __( 'Point of Sale', 'storeengine' ),
		subtitle: __( 'Sell in person from one catalog', 'storeengine' ),
		enables: __( 'Enables · POS (Pro)', 'storeengine' ),
		types: [ 'physical', 'both' ],
	},
	{
		name: 'affiliate_support',
		icon: 'affiliate-alt',
		title: __( 'Affiliates', 'storeengine' ),
		subtitle: __( 'Referral marketing & commissions', 'storeengine' ),
		enables: __( 'Enables · Affiliate', 'storeengine' ),
		types: [ 'physical', 'digital', 'both' ],
	},
	{
		name: 'enable_funnel',
		icon: 'sales_funnel',
		title: __( 'Sales funnels', 'storeengine' ),
		subtitle: __( 'One-click upsells & order bumps', 'storeengine' ),
		enables: __( 'Enables · Funnel Builder', 'storeengine' ),
		types: [ 'physical', 'digital', 'both' ],
	},
	{
		name: 'enable_multicurrency',
		icon: 'globe',
		title: __( 'Multi-currency', 'storeengine' ),
		subtitle: __( 'Sell & settle in local currencies', 'storeengine' ),
		enables: __( 'Enables · Multi-currency', 'storeengine' ),
		types: [ 'physical', 'digital', 'both' ],
	},
];

const TIPS = [
	{
		icon: 'subscription',
		tone: 'primary',
		title: __( 'Recurring billing', 'storeengine' ),
		text: __(
			'Subscriptions, free trials, setup fees & installments — native.',
			'storeengine'
		),
	},
	{
		icon: 'funnel_2',
		tone: 'violet',
		title: __( 'Funnel builder', 'storeengine' ),
		text: __( 'One-click upsells & order bumps at checkout.', 'storeengine' ),
	},
	{
		icon: 'lock',
		tone: 'success',
		title: __( 'Fraud Shield', 'storeengine' ),
		text: __( 'Screen risky orders automatically.', 'storeengine' ),
	},
];

const Product = () => {
	const { values, setFieldValue } = useFormikContext();
	const primary = values.primary_type || 'both';

	const capabilities = CAPABILITIES.filter( ( c ) =>
		c.types.includes( primary )
	);

	// Keep state in sync with what's shown: if a capability is toggled on and
	// then hidden by switching the product type, turn it back off.
	useEffect( () => {
		CAPABILITIES.forEach( ( c ) => {
			if ( ! c.types.includes( primary ) && values[ c.name ] ) {
				setFieldValue( c.name, false );
			}
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ primary ] );

	return (
		<div className="storeengine-setup-product flex gap-8">
			<div className="min-w-0 flex-1">
				<FormHeading
					title={ __( 'What will you sell?', 'storeengine' ) }
					subHeading={ __(
						"Choose your product type, then add any extras — we'll switch on the right tools for you.",
						'storeengine'
					) }
				/>

				{ /* Required, single-select primary type. */ }
				<p className="mt-6 mb-2 text-sm font-semibold text-se-text">
					{ __( 'Product type', 'storeengine' ) }
					<span className="text-se-error"> *</span>
				</p>
				<div
					className="grid grid-cols-3 gap-3"
					role="radiogroup"
					aria-label={ __( 'Product type', 'storeengine' ) }
				>
					{ PRIMARY.map( ( p ) => {
						const active = primary === p.value;
						return (
							<button
								key={ p.value }
								type="button"
								role="radio"
								aria-checked={ active }
								onClick={ () =>
									setFieldValue( 'primary_type', p.value )
								}
								className={ cx(
									'group relative flex flex-col gap-2 rounded-se border border-solid p-4 text-left cursor-pointer transition-colors',
									active
										? 'border-se-primary bg-se-primary-light'
										: 'border-se-border bg-se-white hover:border-se-primary'
								) }
							>
								<span
									className={ cx(
										'flex h-8 w-8 items-center justify-center rounded-se text-[16px]',
										active
											? 'bg-white text-se-primary'
											: 'bg-se-bg text-se-subtitle'
									) }
									aria-hidden="true"
								>
									<span
										className={ `storeengine-icon storeengine-icon--${ p.icon }` }
									/>
								</span>
								<span className="text-sm font-semibold text-se-text leading-tight">
									{ p.title }
								</span>
								<span className="text-xs text-se-subtitle leading-snug">
									{ p.subtitle }
								</span>
								<span
									className={ cx(
										'absolute right-3 top-3 h-5 w-5 items-center justify-center rounded-full bg-se-primary text-white text-[11px] font-bold',
										active ? 'flex' : 'hidden'
									) }
									aria-hidden="true"
								>
									<span className="storeengine-icon storeengine-icon--check" />
								</span>
							</button>
						);
					} ) }
				</div>

				{ /* Optional extra capabilities (multi-select). */ }
				<p className="mt-8 mb-2 text-sm font-semibold text-se-text">
					{ __( 'Add extra capabilities', 'storeengine' ) }
				</p>
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
					{ capabilities.map( ( c ) => (
						<SelectableCard
							key={ c.name }
							name={ c.name }
							icon={ c.icon }
							title={ c.title }
							subtitle={ c.subtitle }
							enables={ c.enables }
							active={ !! values[ c.name ] }
						/>
					) ) }
				</div>
			</div>

			<TipRail tips={ TIPS } />
		</div>
	);
};

export default Product;
