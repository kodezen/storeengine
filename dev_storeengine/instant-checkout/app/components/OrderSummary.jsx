/**
 * Shopify-style sticky order summary card.
 *
 * Renders a 56×56 thumbnail per line item with a quantity badge top-right,
 * line totals, an inline coupon form (apply/remove via REST), the totals
 * breakdown (subtotal / shipping / tax / discount / total), and a soft
 * placeholder when a product has no image.
 */
import { createElement, useState } from '@wordpress/element';
import CouponForm from './CouponForm.jsx';

const fmt = (currency, value) => {
	const n = Number(value || 0);
	try {
		return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n);
	} catch (e) {
		return `${currency || 'USD'} ${n.toFixed(2)}`;
	}
};

const Placeholder = () => createElement('div', {
	className: 'flex items-center justify-center w-full h-full text-gray-300',
	'aria-hidden': true,
},
	createElement('svg', {
		width: '24',
		height: '24',
		viewBox: '0 0 24 24',
		fill: 'none',
		xmlns: 'http://www.w3.org/2000/svg',
	},
		createElement('path', {
			d: 'M4 5h16v14H4V5zm2 2v8.586l3.293-3.293a1 1 0 011.414 0L13 14.586l2.293-2.293a1 1 0 011.414 0L18 13.586V7H6zm0 10h12v-1L16 14l-2.293 2.293a1 1 0 01-1.414 0L10 14l-4 4z',
			fill: 'currentColor',
		})
	)
);

const LineItem = ({ item, currency }) => createElement('li', {
	className: 'flex items-center gap-3 p-[10px] border border-solid border-[var(--storeengine-border-color)] rounded',
},
	// Thumbnail (or placeholder) + qty badge.
	createElement('div', { className: 'relative shrink-0' },
		createElement('div', {
			className: 'w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden',
		},
			item.image
				? createElement('img', {
					src: item.image,
					alt: '',
					className: 'w-full h-full object-cover',
					loading: 'lazy',
				})
				: createElement(Placeholder)
		),
		createElement('span', {
			className: 'absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-gray-700 text-white text-[11px] font-semibold flex items-center justify-center leading-none',
		}, item.quantity)
	),
	// Title + meta.
	createElement('div', { className: 'flex-1 min-w-0' },
		createElement('div', {
			className: 'text-sm font-medium text-gray-900 line-clamp-2',
		}, item.name),
		Number(item.price) > 0 && Number(item.quantity) > 1 && createElement('div', {
			className: 'text-xs text-gray-500 mt-0.5',
		}, `${fmt(currency, item.price)} × ${item.quantity}`)
	),
	// Line subtotal.
	createElement('div', {
		className: 'text-sm font-medium text-gray-900 shrink-0',
	}, fmt(currency, item.subtotal != null ? item.subtotal : Number(item.price || 0) * Number(item.quantity || 1)))
);

const TotalsRow = ({ label, value, emphasis }) => createElement('div', {
	className: 'flex items-center justify-between py-1',
},
	createElement('dt', {
		className: emphasis ? 'text-base font-semibold text-gray-900' : 'text-[16px] text-[var(--storeengine-text-color)]',
	}, label),
	createElement('dd', {
		className: emphasis ? 'text-base font-semibold text-gray-900' : 'text-sm text-[var(--storeengine-text-color)]',
	}, value)
);

const AppliedCouponPill = ({ code, onRemove, busy }) => createElement('span', {
	className: 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-medium',
},
	createElement('span', null, code),
	createElement('button', {
		type: 'button',
		onClick: onRemove,
		disabled: busy,
		className: 'rounded-full hover:bg-emerald-100 w-4 h-4 inline-flex items-center justify-center text-emerald-700 disabled:opacity-50',
		'aria-label': `Remove coupon ${code}`,
	}, '×')
);

/**
 * Collapsible "Future Payments" section: for an installment-plan product, shows
 * each product's remaining installment total with an expandable per-installment
 * breakdown (label, due date, amount). Fed by snapshot.future_payments, which
 * the installment-plan addon injects server-side.
 */
const FuturePayments = ({ groups, currency }) => {
	const [openGroups, setOpenGroups] = useState({});

	return createElement('div', { className: 'px-5 pb-4' },
		createElement('div', {
			className: 'border-b-0 border-l-0 border-r-0 border-t border-solid border-[var(--storeengine-border-color)] pt-3',
		},
			createElement('h4', {
				className: 'text-sm font-semibold text-gray-900 m-0 mb-2',
			}, 'Future Payments'),
			...groups.map((group, gi) => {
				const isOpen = !!openGroups[gi];
				const toggle = () => setOpenGroups((s) => ({ ...s, [gi]: !s[gi] }));

				return createElement('div', {
					key: gi,
					className: 'py-1',
				},
					createElement('button', {
						type: 'button',
						onClick: toggle,
						'aria-expanded': isOpen,
						className: 'w-full flex items-center justify-between gap-2 bg-transparent border-0 p-0 cursor-pointer text-left',
					},
						createElement('span', {
							className: 'flex items-center gap-1.5 min-w-0',
						},
							createElement('span', {
								className: 'text-sm text-gray-900 truncate',
							}, group.name),
							createElement('span', {
								className: 'text-xs text-gray-500 shrink-0',
							}, `(${group.count} ${group.count === 1 ? 'installment' : 'installments'})`),
							createElement('span', {
								className: `text-gray-400 text-[10px] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`,
								'aria-hidden': true,
							}, '▼')
						),
						createElement('span', {
							className: 'text-sm font-medium text-gray-900 shrink-0',
						}, fmt(currency, group.total))
					),
					isOpen && createElement('ul', {
						className: 'mt-2 mb-1 pl-0 list-none flex flex-col gap-2',
					},
						...group.installments.map((inst, ii) => createElement('li', {
							key: ii,
							className: 'flex items-center justify-between gap-2 pl-3 border-l-2 border-solid border-gray-100 border-t-0 border-r-0 border-b-0',
						},
							createElement('span', { className: 'flex flex-col min-w-0' },
								createElement('span', {
									className: 'text-xs text-gray-700 truncate',
								}, inst.label),
								inst.due_date && createElement('span', {
									className: 'text-[11px] text-gray-400',
								}, `Due ${inst.due_date}`)
							),
							createElement('span', {
								className: 'text-xs font-medium text-gray-700 shrink-0',
							}, fmt(currency, inst.amount))
						))
					)
				);
			})
		)
	);
};

export default function OrderSummary({ snapshot, api, onSnapshotUpdate }) {
	const [busyCoupon, setBusyCoupon] = useState(null);
	const [error, setError] = useState('');

	if (!snapshot) return null;

	const { cart, totals } = snapshot;
	const currency = cart && cart.currency;
	const items = (cart && cart.items) || [];
	const itemCount = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
	const appliedCoupons = (snapshot.applied_coupons || []);
	const futurePayments = (snapshot.future_payments || []);
	// Installment carts re-base the summary on the full price so coupons show
	// their real value (matching the classic checkout), with the deposit broken
	// out as "Due today". Absent for non-installment carts.
	const inst = snapshot.installment_summary || null;

	const handleApply = async (code) => {
		if (!api || !api.applyCoupon) return;
		setError('');
		try {
			const res = await api.applyCoupon(code);
			if (res && res.snapshot && onSnapshotUpdate) onSnapshotUpdate(res.snapshot);
		} catch (e) {
			setError(e.message || 'Could not apply coupon.');
		}
	};

	const handleRemove = async (code) => {
		if (!api || !api.removeCoupon) return;
		setBusyCoupon(code);
		setError('');
		try {
			const res = await api.removeCoupon(code);
			if (res && res.snapshot && onSnapshotUpdate) onSnapshotUpdate(res.snapshot);
		} catch (e) {
			setError(e.message || 'Could not remove coupon.');
		} finally {
			setBusyCoupon(null);
		}
	};

	return createElement('div', {
		className: 'rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden',
	},
		// Header.
		createElement('div', {
			className: 'px-5 py-4 border-t-0 border-l-0 border-r-0 border-b border-solid border-[var(--storeengine-border-color)] flex items-center justify-between',
		},
			createElement('h3', { className: 'text-base font-semibold text-gray-900 m-0' }, 'Order summary'),
			itemCount > 0 && createElement('span', {
				className: 'text-xs text-gray-500',
			}, `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`)
		),

		// Line items.
		items.length > 0 && createElement('ul', {
			className: 'divide-y divide-gray-100 px-5',
		},
			...items.map((item, idx) => createElement(LineItem, {
				key: `${item.product_id || idx}-${item.price_id || ''}`,
				item,
				currency,
			}))
		),

		// Coupon section.
		api && createElement('div', {
			className: 'px-5 py-4 border-t border-gray-200 bg-gray-50/50',
		},
			appliedCoupons.length > 0 && createElement('div', {
				className: 'flex flex-wrap gap-2 mb-3',
			},
				...appliedCoupons.map((c) => createElement(AppliedCouponPill, {
					key: c.code,
					code: c.code,
					busy: busyCoupon === c.code,
					onRemove: () => handleRemove(c.code),
				}))
			),
			createElement(CouponForm, {
				onApply: handleApply,
				disabled: !!busyCoupon,
			}),
			error && createElement('p', {
				className: 'text-xs text-red-600 mt-2',
			}, error)
		),

		// Totals. Installment carts render a full-price breakdown (Subtotal =
		// full price, each coupon at its real value, Order total, then the deposit
		// as "Due today"); everything else uses the standard totals rows.
		createElement('dl', {
			className: 'px-5 pb-4 m-0',
		},
			...(inst
				? [
					createElement(TotalsRow, {
						key: 'sub',
						label: 'Subtotal',
						value: fmt(currency, inst.full_price),
					}),
					...((Array.isArray(inst.coupons) ? inst.coupons : [])
						.filter((c) => Number(c.discount) > 0)
						.map((c, i) => createElement(TotalsRow, {
							key: `inst-coupon-${i}`,
							label: `Coupon: ${c.code}`,
							value: `−${fmt(currency, c.discount)}`,
						}))),
					Number(inst.discount) > 0 && createElement(TotalsRow, {
						key: 'order-total',
						label: 'Order total',
						value: fmt(currency, inst.order_total),
					}),
					createElement('div', {
						key: 'due-today',
						className: 'border-b-0 border-l-0 border-r-0 border-t border-solid border-[var(--storeengine-border-color)] mt-3 pt-3',
					},
						createElement(TotalsRow, {
							label: inst.deposit_percent != null
								? `Due today (${inst.deposit_percent}%)`
								: 'Due today',
							value: fmt(currency, inst.deposit_due),
							emphasis: true,
						})
					),
				]
				: [
					createElement(TotalsRow, {
						key: 'sub',
						label: 'Subtotal',
						value: fmt(currency, totals.subtotal),
					}),
					cart.needs_shipping && createElement(TotalsRow, {
						key: 'shipping',
						label: 'Shipping',
						value: fmt(currency, totals.shipping),
					}),
					// EU/German VAT transparency: explicit net total + per-rate VAT,
					// falling back to the single aggregated tax line.
					totals.net_total != null && createElement(TotalsRow, {
						key: 'net',
						label: 'Net total (excl. VAT)',
						value: fmt(currency, totals.net_total),
					}),
					...(Array.isArray(totals.tax_lines) && totals.tax_lines.length
						? totals.tax_lines.map((t, i) => createElement(TotalsRow, {
							key: `vat-${i}`,
							label: t.label || 'VAT',
							value: fmt(currency, t.amount),
						}))
						: (Number(totals.tax) > 0
							? [createElement(TotalsRow, { key: 'tax', label: 'Tax', value: fmt(currency, totals.tax) })]
							: [])),
					Number(totals.discount) > 0 && createElement(TotalsRow, {
						key: 'discount',
						label: 'Discount',
						value: `−${fmt(currency, totals.discount)}`,
					}),
					createElement('div', {
						key: 'total',
						className: 'border-b-0 border-l-0 border-r-0 border-t border-solid border-[var(--storeengine-border-color)] mt-3 pt-3',
					},
						createElement(TotalsRow, {
							label: 'Total',
							value: fmt(currency, totals.total),
							emphasis: true,
						})
					),
				]),
		),

			// Future (installment) payments, when the cart holds an installment plan.
			futurePayments.length > 0 && createElement(FuturePayments, {
				groups: futurePayments,
				currency,
			})
	);
}
