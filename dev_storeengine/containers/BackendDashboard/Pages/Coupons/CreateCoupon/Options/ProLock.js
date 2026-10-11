import React from 'react';
import { __ } from '@wordpress/i18n';
import { get_route_path } from '@Utils/helper';

const UPGRADE_URL = 'https://storeengine.pro/pricing/';

/**
 * Whether StoreEngine Pro is active (installed + licensed).
 *
 * @return {boolean} True when Pro is active.
 */
export const isProActive = () =>
	!! (
		typeof window !== 'undefined' &&
		window.StoreEngineGlobal &&
		window.StoreEngineGlobal.is_pro
	);

/**
 * Whether the Advanced Coupons Pro addon is active. Pro-only coupon features —
 * Buy X Get Y, Auto apply, Allowed emails, Promote in cart — are gated on this.
 *
 * Requires BOTH Pro to be active AND the addon toggle to be on. The stored
 * addons option can still read `advanced-coupon: true` after the Pro plugin is
 * deactivated (deactivation doesn't reset it), so the Pro check is essential.
 *
 * @return {boolean} True when the Advanced Coupons addon is active.
 */
export const isAdvancedCouponActive = () => {
	if ( ! isProActive() ) {
		return false;
	}
	const globals =
		( typeof window !== 'undefined' && window.StoreEngineGlobal ) || {};
	const addons = globals.addons || {};
	return !! addons[ 'advanced-coupon' ];
};

/**
 * The contextual "requires …" hint for a locked feature:
 *   - Pro inactive            → requires StoreEngine Pro (links to pricing).
 *   - Pro active but addon off → requires the add-on (links to the Add-ons screen).
 *
 * @return {{ text: string, url: string, external: boolean }} Hint.
 */
export const requiresHint = () => {
	if ( isProActive() ) {
		return {
			text: __( 'Requires the Advanced Coupons add-on', 'storeengine' ),
			url: get_route_path( 'storeengine-addons' ),
			external: false,
		};
	}

	return {
		text: __( 'Requires StoreEngine Pro — Advanced Coupons', 'storeengine' ),
		url: UPGRADE_URL,
		external: true,
	};
};

/**
 * Soft promotion for an Advanced Coupons field: when the addon is active it
 * renders the field as-is; otherwise it shows the field disabled with a small
 * "Requires …" hint just below it.
 *
 * @param {Object}      props
 * @param {JSX.Element} props.children The real field.
 * @return {JSX.Element} The field, or the disabled field + hint.
 */
const ProLock = ( { children } ) => {
	if ( isAdvancedCouponActive() ) {
		return children;
	}

	const hint = requiresHint();

	return (
		<div className="storeengine-pro-lock">
			<div className="storeengine-pro-lock__body" aria-hidden="true">
				{ children }
			</div>
			<a
				className="storeengine-pro-lock__hint"
				href={ hint.url }
				target={ hint.external ? '_blank' : '_self' }
				rel="noreferrer"
			>
				<span className="storeengine-pro-lock__lockicon" aria-hidden="true">
					🔒
				</span>
				{ hint.text }
			</a>
		</div>
	);
};

export default ProLock;
