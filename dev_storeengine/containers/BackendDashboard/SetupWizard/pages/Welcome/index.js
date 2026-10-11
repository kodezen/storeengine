import React, { useState } from 'react';
import { makeRequest2, plugin_root_url } from '@Utils/helper';
import { Button } from '@Components/ui';
import { __ } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';

import './styles.scss';

const propTypes = {};

// Each capability renders as an icon feature-card. `tone` drives the icon-chip
// color; `icon` must be a glyph that actually exists in the icon font (several
// declared classes ship no glyph — verified against the font's cmap).
const CAPABILITIES = [
	{
		label: __( 'Subscriptions', 'storeengine' ),
		note: __( 'Recurring billing & plans', 'storeengine' ),
		icon: 'subscription',
		tone: 'primary',
	},
	{
		label: __( 'Memberships', 'storeengine' ),
		note: __( 'Gated content & tiers', 'storeengine' ),
		icon: 'membership',
		tone: 'violet',
	},
	{
		label: __( 'Point of Sale', 'storeengine' ),
		note: __( 'Sell in person, offline', 'storeengine' ),
		icon: 'cart',
		tone: 'success',
	},
	{
		label: __( 'Funnels', 'storeengine' ),
		note: __( 'Upsells & order bumps', 'storeengine' ),
		icon: 'funnel-settings',
		tone: 'primary',
	},
	{
		label: __( 'Affiliates', 'storeengine' ),
		note: __( 'Grow with partners', 'storeengine' ),
		icon: 'affiliate',
		tone: 'warning',
	},
	{
		label: __( 'Multi-currency', 'storeengine' ),
		note: __( 'Sell worldwide', 'storeengine' ),
		icon: 'globe',
		tone: 'primary',
	},
];

// Full literal class strings per tone so Tailwind's JIT keeps them.
const TONE_CHIP = {
	primary: 'bg-se-primary-light text-se-primary',
	violet: 'bg-[#7c5cff]/10 text-[#7c5cff]',
	success: 'bg-se-success-light text-se-success',
	warning: 'bg-se-warning-light text-se-warning',
};

// A single feature card, shared by the two marquee rows below (each row
// renders the list twice back-to-back so the CSS animation can loop
// seamlessly from 0 to -50%).
function CapabilityCard( { c } ) {
	return (
		<div className="flex w-[230px] shrink-0 items-center gap-3 rounded-md border border-solid border-se-border bg-se-white p-3.5 text-left transition-all duration-300 hover:border-se-primary hover:shadow-se-pop">
			<span
				className={ `flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[17px] ${
					TONE_CHIP[ c.tone ] || TONE_CHIP.primary
				}` }
			>
				<span
					className={ `storeengine-icon storeengine-icon--${ c.icon }` }
					aria-hidden="true"
				/>
			</span>
			<span className="min-w-0">
				<span className="block text-[13.5px] font-semibold text-se-text">
					{ c.label }
				</span>
				<span className="block text-xs text-se-subtitle">
					{ c.note }
				</span>
			</span>
		</div>
	);
}

export default function Welcome() {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ showMessage, setShowMessage ] = useState( false );
	const navigate = useNavigate();

	const redirectHandler = () => {
		setIsLoading( false );
		setTimeout( () => {
			navigate( '/settings' );
		}, 400 );
	};

	return (
		<div className="storeengine-welcome relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
			{ /* Soft ambient backdrop — a primary glow up top fading into the page. */ }
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
				style={ {
					background:
						'radial-gradient(680px 320px at 50% -40px, rgba(0,141,255,0.10), rgba(0,141,255,0) 70%)',
				} }
			/>

			<div className="relative z-[1] w-full max-w-[1200px]">
				<img
					className="mx-auto mb-9 h-9"
					src={ `${ plugin_root_url }assets/images/full-logo.svg` }
					alt={ __( 'StoreEngine', 'storeengine' ) }
				/>

				<h1 className="mt-6 text-[32px] font-bold leading-[1.08] tracking-tight text-se-text">
					{ __( 'Sell anything.', 'storeengine' ) }{ ' ' }
					<span className="text-[32px] font-bold leading-[1.08] text-se-primary">
						{ __( 'In one plugin.', 'storeengine' ) }
					</span>
				</h1>
				<p className="mx-auto mt-5 max-w-[906px] text-[16px] leading-relaxed text-se-subtitle">
					{ __(
						'Products, subscriptions, memberships, courses and licenses — with payments, POS, funnels and affiliates built in. Let’s shape StoreEngine around your store.',
						'storeengine'
					) }
				</p>

				{ /* Decorative, auto-scrolling — screen readers get the same info
				   from the heading/paragraph above, so the whole marquee is
				   hidden from the accessibility tree. */ }
				<div
					className="storeengine-welcome__marquee mx-auto mt-10 flex max-w-[1200px] flex-col gap-3"
					aria-hidden="true"
				>
					<div className="storeengine-welcome__marquee-row">
						<div className="storeengine-welcome__marquee-track">
							{ [ ...CAPABILITIES, ...CAPABILITIES ].map(
								( c, i ) => (
									<CapabilityCard
										key={ `row1-${ i }` }
										c={ c }
									/>
								)
							) }
						</div>
					</div>
					<div className="storeengine-welcome__marquee-row storeengine-welcome__marquee-row--reverse">
						<div className="storeengine-welcome__marquee-track">
							{ [ ...CAPABILITIES, ...CAPABILITIES ].map(
								( c, i ) => (
									<CapabilityCard
										key={ `row2-${ i }` }
										c={ c }
									/>
								)
							) }
						</div>
					</div>
				</div>

				<div className="mt-11 flex flex-wrap items-center justify-center gap-3">
					<Button
						preset="primary"
						size="lg"
						className="h-11"
						iconRight="storeengine-icon--arrow-right"
						isLoading={ isLoading }
						onClick={ () => {
							// Fire-and-forget opt-in, then continue.
							makeRequest2( null, {
								action: 'insights_optin',
								slug: 'storeengine',
								optin: true,
							} );
							setIsLoading( true );
							redirectHandler();
						} }
					>
						{ __( 'Start setup', 'storeengine' ) }
					</Button>
					<Button
						preset="ghost"
						size="lg"
						className="h-11 !bg-se-border"
						onClick={ redirectHandler }
					>
						{ __( 'I’ll explore on my own', 'storeengine' ) }
					</Button>
				</div>

				<div className="mx-auto mt-9 text-xs text-se-placeholder">
					<span>
						{ __(
							'Sends anonymous site & version info to tailor updates.',
							'storeengine'
						) }{ ' ' }
						<Button
							preset="link"
							size="xs"
							onClick={ () => setShowMessage( ! showMessage ) }
						>
							{ __( 'What we collect', 'storeengine' ) }
						</Button>
					</span>
					{ showMessage && (
						<div className="mt-2 rounded-md border border-solid border-se-border bg-se-bg p-3 text-left text-xs leading-relaxed text-se-subtitle">
							<p
								dangerouslySetInnerHTML={ {
									__html: __(
										'We collect your <strong>site URL, plugin version, WordPress version, PHP version</strong> and <strong>admin email</strong> to tailor updates and improve performance.',
										'storeengine'
									),
								} }
							/>
							<p className="mt-1 italic">
								{ __(
									'No sensitive or personal data is collected. You can unsubscribe anytime.',
									'storeengine'
								) }
							</p>
						</div>
					) }
				</div>
			</div>
		</div>
	);
}

Welcome.propTypes = propTypes;
