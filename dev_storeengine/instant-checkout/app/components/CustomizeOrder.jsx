import { createElement } from '@wordpress/element';

const fmt = (currency, value) => {
	const n = Number(value || 0);
	try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n); }
	catch (e) { return `${(currency || 'USD')} ${n.toFixed(2)}`; }
};

/**
 * "Customize your order" panel — appears above billing when the shortcode
 * declared multiple [se_checkout_item] entries.
 *
 *   Required items: rendered as locked summary rows with a quantity spinner.
 *   Optional items: rendered with a checkbox + spinner; toggling re-syncs.
 *
 * Props:
 *   declared      — declared_items[] from the snapshot.
 *   selection     — { [product_id]: { product_id, price_id, quantity } }
 *   currency      — string
 *   onChange      — (newSelection) => void  (fires immediately; parent debounces sync)
 *   syncing       — boolean (shows a "Updating…" indicator)
 */
export default function CustomizeOrder({ declared, selection, currency, onChange, syncing }) {
	if (!declared || !declared.length) return null;

	const required = declared.filter((d) => !d.optional);
	const optional = declared.filter((d) => d.optional);

	const setItem = (item, patch) => {
		const next = { ...selection };
		const key = item.product_id;
		if (patch.checked === false) {
			delete next[key];
		} else {
			next[key] = {
				product_id: item.product_id,
				price_id: item.price_id,
				quantity: patch.quantity ?? next[key]?.quantity ?? item.quantity ?? 1,
			};
		}
		onChange(next);
	};

	const Row = ({ item, locked }) => {
		const isSelected = !!selection[item.product_id];
		const qty = selection[item.product_id]?.quantity ?? item.quantity ?? 1;
		return createElement('div', {
			className: `se-embedded-app__cust-row ${isSelected ? 'is-selected' : ''} ${locked ? 'is-locked' : ''}`,
		},
			!locked && createElement('label', { className: 'se-embedded-app__cust-check' },
				createElement('input', {
					type: 'checkbox',
					checked: isSelected,
					onChange: (e) => setItem(item, { checked: e.target.checked }),
				})
			),
			item.image && createElement('img', { src: item.image, alt: '', className: 'se-embedded-app__cust-img' }),
			createElement('div', { className: 'se-embedded-app__cust-body' },
				createElement('div', { className: 'se-embedded-app__cust-name' }, item.name),
				createElement('div', { className: 'se-embedded-app__cust-meta' }, fmt(currency, item.price))
			),
			createElement('div', { className: 'se-embedded-app__cust-qty' },
				createElement('button', {
					type: 'button',
					'aria-label': 'Decrease quantity',
					disabled: !isSelected || qty <= 1,
					onClick: () => setItem(item, { quantity: Math.max(1, qty - 1) }),
				}, '−'),
				createElement('span', { className: 'se-embedded-app__cust-qty-num' }, qty),
				createElement('button', {
					type: 'button',
					'aria-label': 'Increase quantity',
					disabled: !isSelected,
					onClick: () => setItem(item, { quantity: qty + 1 }),
				}, '+')
			),
			createElement('div', { className: 'se-embedded-app__cust-line' },
				fmt(currency, (item.price || 0) * (isSelected ? qty : 0))
			)
		);
	};

	return createElement('div', { className: 'se-embedded-app__section se-embedded-app__customize' },
		createElement('div', { className: 'se-embedded-app__customize-head' },
			createElement('h3', { className: 'se-embedded-app__section-title' }, 'Customize your order'),
			syncing && createElement('span', { className: 'se-embedded-app__customize-syncing' }, 'Updating…')
		),
		required.length > 0 && createElement('div', { className: 'se-embedded-app__cust-group' },
			...required.map((it) => createElement(Row, { key: `r-${it.product_id}`, item: it, locked: true }))
		),
		optional.length > 0 && createElement('div', { className: 'se-embedded-app__cust-group se-embedded-app__cust-group--optional' },
			required.length > 0 && createElement('p', { className: 'se-embedded-app__cust-hint' }, 'Optional add-ons'),
			...optional.map((it) => createElement(Row, { key: `o-${it.product_id}`, item: it, locked: false }))
		)
	);
}
