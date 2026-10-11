import { createElement, useEffect } from '@wordpress/element';

export default function SuccessScreen({ orderId, onDismiss, successUrl, parentOrigin }) {
	useEffect(() => {
		// Notify the parent frame (modal launcher) that the purchase finished.
		// Use the allow-listed parentOrigin from the iframe template; fall back
		// to '*' only when there's no parent (inline usage).
		try {
			window.parent && window.parent !== window && window.parent.postMessage(
				{ source: 'storeengine-checkout', type: 'purchase.completed', payload: { order_id: orderId } },
				parentOrigin || '*'
			);
		} catch (e) { /* noop */ }
		// Optional caller-supplied redirect after a short delay.
		if (successUrl) {
			const t = setTimeout(() => { window.location.href = successUrl; }, 1500);
			return () => clearTimeout(t);
		}
	}, [orderId]);

	return createElement('div', { className: 'se-embedded-app__success', role: 'status', 'aria-live': 'polite' },
		createElement('div', { className: 'se-embedded-app__success-icon', 'aria-hidden': true }, '✓'),
		createElement('h2', { className: 'se-embedded-app__success-title' }, 'Payment successful'),
		createElement('p', { className: 'se-embedded-app__success-msg' },
			'Thanks! Your order has been placed and a confirmation has been sent to your email.'
		),
		orderId && createElement('p', { className: 'se-embedded-app__success-meta' }, 'Order ', createElement('strong', null, `#${orderId}`)),
		onDismiss && createElement('button', {
			type: 'button',
			className: 'se-embedded-app__btn',
			onClick: onDismiss,
		}, 'Done')
	);
}
