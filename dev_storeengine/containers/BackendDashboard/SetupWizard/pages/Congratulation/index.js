import { __ } from '@wordpress/i18n';
import { Button } from '@Components/ui';
import { admin_url, customize_url } from '@Utils/helper';
import { useEffect } from 'react';
import { generateConfetti } from './generateConfetti';

import './styles.scss';

const FEATURES = [
	{
		icon: 'box',
		title: __( 'Products & inventory', 'storeengine' ),
		note: __( 'Physical & digital', 'storeengine' ),
	},
	{
		icon: 'payment',
		title: __( 'Payments', 'storeengine' ),
		note: __( 'Stripe, PayPal, offline', 'storeengine' ),
	},
	{
		icon: 'subscription',
		title: __( 'Subscriptions', 'storeengine' ),
		note: __( 'Recurring billing', 'storeengine' ),
	},
	{
		icon: 'funnel_2',
		title: __( 'Funnels', 'storeengine' ),
		note: __( 'Upsells & order bumps', 'storeengine' ),
	},
];

const Congratulation = () => {
	useEffect( () => {
		const reduce =
			window.matchMedia &&
			window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
		if ( reduce ) {
			return undefined;
		}
		generateConfetti(
			{
				quantity: 90,
				minSize: 5,
				maxSize: 10,
				colorsArray: [ '#008DFF', '#00AD6B', '#7c5cff', '#FDB022' ],
				velocity: 0.1,
				infiniteLoop: true,
				minOpacity: 0.6,
				maxOpacity: 1,
			},
			'vanillaConfettiCanvas'
		);
		return () => {
			const canvas = document.getElementById( 'vanillaConfettiCanvas' );
			const ctx = canvas && canvas.getContext( '2d' );
			ctx && ctx.clearRect( 0, 0, canvas.width, canvas.height );
		};
	}, [] );

	return (
		<div className="storeengine-setup-screen--congrats flex min-h-screen items-center justify-center px-6 py-16">
			<canvas
				id="vanillaConfettiCanvas"
				style={ {
					position: 'fixed',
					top: 0,
					left: 0,
					width: '100vw',
					height: '100vh',
					pointerEvents: 'none',
					zIndex: 999,
				} }
			/>

			<div className="relative z-[1000] w-full max-w-[560px] rounded-se border border-solid border-se-border bg-se-white p-8 text-center shadow-se-pop">
				<span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-se-success-light text-[30px] text-se-success">
					<span className="storeengine-icon storeengine-icon--check" />
				</span>

				<h2 className="text-[26px] font-extrabold tracking-tight text-se-text">
					{ __( 'Your store is ready to sell.', 'storeengine' ) }
				</h2>
				<p className="mt-2 text-sm text-se-subtitle">
					{ __(
						'StoreEngine is set up and every tool you need is one click away.',
						'storeengine'
					) }
				</p>

				<div className="mt-6 grid grid-cols-2 gap-2.5 text-left">
					{ FEATURES.map( ( f ) => (
						<div
							key={ f.title }
							className="flex items-start gap-3 rounded-se border border-solid border-se-border bg-se-bg p-3"
						>
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-se bg-se-primary-light text-[15px] text-se-primary">
								<span
									className={ `storeengine-icon storeengine-icon--${ f.icon }` }
								/>
							</span>
							<span>
								<span className="block text-[13px] font-semibold text-se-text">
									{ f.title }
								</span>
								<span className="block text-[11.5px] text-se-subtitle">
									{ f.note }
								</span>
							</span>
						</div>
					) ) }
				</div>

				<div className="mt-7 flex flex-wrap justify-center gap-3">
					<Button
						as="a"
						preset="primary"
						href={ `${ admin_url }admin.php?page=storeengine-products` }
					>
						{ __( 'Add your first product', 'storeengine' ) }
					</Button>
					<Button
						as="a"
						preset="outline"
						href={ `${ admin_url }admin.php?page=storeengine` }
					>
						{ __( 'Go to dashboard', 'storeengine' ) }
					</Button>
					<Button as="a" preset="ghost" href={ customize_url }>
						{ __( 'Customize storefront', 'storeengine' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default Congratulation;
