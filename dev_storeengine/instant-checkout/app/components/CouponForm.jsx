/**
 * Inline coupon-code field shown inside the order summary.
 * Submits via the parent's `onApply(code)` handler — which calls
 * api.applyCoupon and refreshes the snapshot.
 *
 * Rendered as a <div> (not <form>) because the entire checkout UI is wrapped
 * in the place-order <form>, and HTML disallows nested forms — submit events
 * bubble to the outer form and accidentally trigger place-order.
 */
import { createElement, useState } from '@wordpress/element';

export default function CouponForm({ onApply, disabled }) {
	const [code, setCode] = useState('');
	const [busy, setBusy] = useState(false);

	const submit = async (e) => {
		if (e && typeof e.preventDefault === 'function') e.preventDefault();
		const trimmed = code.trim();
		if (!trimmed || busy) return;
		setBusy(true);
		try {
			await onApply(trimmed);
			setCode('');
		} finally {
			setBusy(false);
		}
	};

	return createElement('div', {
		className: 'flex gap-2',
	},
		createElement('input', {
			type: 'text',
			value: code,
			onChange: (e) => setCode(e.target.value),
			onKeyDown: (e) => { if (e.key === 'Enter') submit(e); },
			placeholder: 'Discount code',
			disabled: disabled || busy,
			className: [
				'flex-1 rounded-lg border border-solid border-[var(--storeengine-border-color)] bg-white px-3 py-2 text-sm',
				'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
				'disabled:bg-gray-100 disabled:text-gray-500',
			].join(' '),
			'aria-label': 'Discount code',
		}),
		createElement('button', {
			type: 'button',
			onClick: submit,
			disabled: disabled || busy || !code.trim(),
			className: [
				'rounded-lg border border-solid border-[var(--storeengine-border-color)] bg-white hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700',
				'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white',
			].join(' '),
		}, busy ? 'Applying…' : 'Apply')
	);
}
