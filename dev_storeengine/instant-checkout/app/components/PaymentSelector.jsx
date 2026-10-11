import { createElement, useEffect, useRef, useState } from '@wordpress/element';
import { get as getGateway } from '../gateways/registry';

/**
 * Fallback React wrapper for adapters that expose `mountUI(ctx)` (the DOM-
 * based lifecycle the legacy /checkout/ surface uses) but don't ship a
 * dedicated React `Component`. Renders a div, calls `mountUI` with the div
 * as `ctx.ui.container` from a useEffect, and tears down via `unmountUI`
 * when the gateway changes. While the adapter's mount is in flight, a
 * spinner is shown so shoppers see "loading" rather than empty space.
 * Lets a single third-party adapter satisfy both surfaces with one
 * `mountUI` implementation.
 */
function MountUIBridge({ adapter, gateway, api, onReady, onError }) {
	const containerRef = useRef(null);
	const stateRef     = useRef(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!adapter || typeof adapter.mountUI !== 'function') {
			setLoading(false);
			return undefined;
		}

		setLoading(true);
		let cancelled = false;
		(async () => {
			try {
				const ctx = {
					formData: {},
					gateway,
					api,
					surface: 'react',
					ui: {
						container: containerRef.current,
						onReady: (s) => {
							if (cancelled) return;
							stateRef.current = s || stateRef.current;
							setLoading(false);
							onReady && onReady(s || {});
						},
						onError: (e) => {
							if (cancelled) return;
							setLoading(false);
							onError && onError(e);
						},
					},
				};
				const result = await adapter.mountUI(ctx);
				if (cancelled) return;
				if (result && !stateRef.current) {
					stateRef.current = result;
					onReady && onReady(result);
				}
				// Some adapters (Square) signal readiness via ctx.ui.onReady,
				// others (no-op gateways) just resolve mountUI. Either way,
				// once mountUI's promise settles the form is on screen.
				setLoading(false);
			} catch (e) {
				if (cancelled) return;
				setLoading(false);
				onError && onError(e);
			}
		})();

		return () => {
			cancelled = true;
			if (adapter && typeof adapter.unmountUI === 'function') {
				try { adapter.unmountUI(stateRef.current); } catch (e) { /* ignore */ }
			}
			stateRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [adapter && adapter.id]);

	return createElement('div', { className: 'se-embedded-app__gateway-mount-wrap' },
		loading && createElement(GatewayLoader),
		createElement('div', {
			className: 'se-embedded-app__gateway-mount',
			ref: containerRef,
			style: loading ? { display: 'none' } : undefined,
		})
	);
}
MountUIBridge.displayName = 'MountUIBridge';

function GatewayLoader() {
	return createElement('div', { className: 'flex items-center justify-center py-6 text-gray-500 text-sm gap-2' },
		createElement('span', {
			className: 'inline-block h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin',
		}),
		createElement('span', null, 'Loading payment form…')
	);
}
GatewayLoader.displayName = 'GatewayLoader';

/**
 * Build the body element for a gateway row. Returns either the adapter's
 * React Component (Stripe/Paddle/PayPal/Razorpay/offline ship one) or a
 * MountUIBridge wrapping the adapter's `mountUI` (third-party gateways
 * like Square that only ship the cross-surface lifecycle).
 */
function buildGatewayBody({ adapter, gateway, api, amount, currency, onGatewayContext, onGatewayError, onAutoSubmit }) {
	if (!adapter) return null;
	if (adapter.Component) {
		return createElement(adapter.Component, {
			gateway,
			api,
			amount,
			currency,
			onReady: onGatewayContext,
			onError: onGatewayError,
			onAutoSubmit,
		});
	}
	if (typeof adapter.mountUI === 'function') {
		return createElement(MountUIBridge, {
			adapter,
			gateway,
			api,
			onReady: onGatewayContext,
			onError: onGatewayError,
		});
	}
	return null;
}

export default function PaymentSelector({ gateways, selected, onSelect, onGatewayContext, onGatewayError, onAutoSubmit, api, amount, currency }) {
	if (!gateways || !gateways.length) {
		return createElement('div', { className: 'se-embedded-app__section' },
			createElement('h3', { className: 'se-embedded-app__section-title' }, 'Payment'),
			createElement('p', { className: 'se-embedded-app__hint' }, 'No payment methods available.')
		);
	}

	return createElement('div', { className: 'se-embedded-app__section' },
		createElement('h3', { className: 'se-embedded-app__section-title' }, 'Payment'),
		createElement('div', { className: 'se-embedded-app__gateways' },
			...gateways.map((gw) => {
				const isSelected      = selected === gw.id;
				const adapter         = isSelected ? getGateway(gw.id) : null;
				const body            = isSelected
					? buildGatewayBody({
						adapter,
						gateway: gw,
						api,
						amount,
						currency,
						onGatewayContext,
						onGatewayError,
						onAutoSubmit,
					})
					: null;

				return createElement('div', {
					key: gw.id,
					className: `se-embedded-app__gateway-row ${isSelected ? 'is-selected' : ''}`,
				},
					createElement('label', { className: 'se-embedded-app__gateway' },
						createElement('input', {
							type: 'radio',
							name: 'payment_method',
							value: gw.id,
							checked: isSelected,
							onChange: () => onSelect(gw.id),
						}),
						createElement('span', null, gw.title)
					),
					body && createElement('div', { className: 'se-embedded-app__gateway-body' }, body)
				);
			})
		)
	);
}
