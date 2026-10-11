import { createElement, useEffect, useState } from '@wordpress/element';
import COUNTRIES from '@Utils/countries';

const Field = ({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }) =>
	createElement('label', { className: 'se-embedded-app__label' },
		createElement('span', null, required ? `${label} *` : label),
		createElement('input', {
			type,
			required,
			value: value || '',
			placeholder,
			onChange: (e) => onChange({ [name]: e.target.value }),
		})
	);

const fmtMoney = (value, currency) => {
	const n = Number(value || 0);
	try {
		return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n);
	} catch (e) {
		return `${currency || 'USD'} ${n.toFixed(2)}`;
	}
};

/**
 * Shipping-method selector. Rates come from the /state + /update snapshot
 * (snapshot.shipping_rates). Picking one writes fields.shipping_method, which
 * the debounced sync in CheckoutApp pushes to /update → recalculated totals.
 * Falls back to the server's chosen rate when the local selection isn't (yet)
 * one of the available rates — e.g. right after the address changed.
 */
const ShippingMethods = ({ rates, chosen, selected, currency, onChange }) => {
	const validSelected = rates.some((r) => r.id === selected) ? selected : chosen;
	return createElement('div', { className: 'se-embedded-app__shipping-methods' },
		createElement('h3', { className: 'se-embedded-app__section-title' }, 'Shipping method'),
		...rates.map((rate) => createElement('label', {
			key: rate.id,
			className: 'se-embedded-app__inline',
		},
			createElement('input', {
				type: 'radio',
				name: 'shipping_method',
				checked: validSelected === rate.id,
				onChange: () => onChange({ shipping_method: rate.id }),
			}),
			createElement('span', null, `${rate.label} — ${Number(rate.cost) > 0 ? fmtMoney(rate.cost, currency) : 'Free'}`)
		))
	);
};

/**
 * Build a quick lookup: { settings_id: { enabled, required, payload_key } }
 * from the snapshot's checkout_fields array. Falls back to "shown & required"
 * if the snapshot doesn't carry it (older sites, or boot before /state).
 */
function indexFields(rawList) {
	const map = {};
	(rawList || []).forEach((f) => {
		if (!f || !f.id) return;
		map[f.id] = {
			enabled: !!f.enabled,
			required: !!f.required,
			system: !!f.system,
			payloadKey: f.payload_key || f.id,
		};
	});
	return map;
}

function fieldRule(map, id, fallback = { enabled: true, required: true }) {
	return map[id] || fallback;
}

export default function BillingShipping({ fields, onChange, needsShipping, api, snapshot }) {
	const [statesByCountry, setStatesByCountry] = useState({});
	const cf = indexFields(snapshot && snapshot.checkout_fields);

	const CountrySelect = ({ name, value, required }) =>
		createElement('label', { className: 'se-embedded-app__label' },
			createElement('span', null, required ? 'Country *' : 'Country'),
			createElement('select', {
				required,
				value: value || '',
				onChange: (e) => onChange({ [name]: e.target.value }),
			},
				createElement('option', { value: '' }, '— Select country —'),
				...COUNTRIES.map((c) =>
					createElement('option', { key: c.value, value: c.value }, c.label)
				)
			)
		);

	const loadStates = async (countryCode) => {
		if (!countryCode || statesByCountry[countryCode]) return;
		try {
			const res = await api.getStates(countryCode);
			setStatesByCountry((s) => ({ ...s, [countryCode]: res }));
		} catch (e) { /* noop */ }
	};

	useEffect(() => { loadStates(fields.billing_country); }, [fields.billing_country]);
	useEffect(() => { if (needsShipping) loadStates(fields.shipping_country); }, [fields.shipping_country, needsShipping]);

	const StateSelector = ({ name, country, value, required }) => {
		const meta = statesByCountry[country];
		if (!meta || !meta.states || Object.keys(meta.states).length === 0) {
			return Field({ label: 'State / Region', name, value, onChange, required });
		}
		const isReq = required || !!meta.required;
		return createElement('label', { className: 'se-embedded-app__label' },
			createElement('span', null, isReq ? `${meta.label || 'State'} *` : (meta.label || 'State')),
			createElement('select', {
				value: value || '',
				onChange: (e) => onChange({ [name]: e.target.value }),
				required: isReq,
			},
				createElement('option', { value: '' }, '— Select —'),
				...Object.entries(meta.states).map(([code, label]) =>
					createElement('option', { key: code, value: code }, label)
				)
			)
		);
	};

	// Convenience accessors for billing fields.
	const f = (id, fb) => fieldRule(cf, id, fb);
	const billing_first   = f('billing_first_name');
	const billing_last    = f('billing_last_name');
	const billing_addr1   = f('billing_address_line');
	const billing_addr2   = f('billing_address_line_2', { enabled: true, required: false });
	const billing_apt     = f('billing_apt',            { enabled: false, required: false });
	const billing_country = f('billing_country');
	const billing_city    = f('billing_city');
	const billing_state   = f('billing_state',          { enabled: true,  required: false });
	const billing_post    = f('billing_post_code');
	const billing_phone   = f('billing_phone',          { enabled: true,  required: false });

	const shipping_first   = f('shipping_first_name');
	const shipping_last    = f('shipping_last_name');
	const shipping_addr1   = f('shipping_address_line');
	const shipping_addr2   = f('shipping_address_line_2', { enabled: true, required: false });
	const shipping_apt     = f('shipping_apt',            { enabled: false, required: false });
	const shipping_country = f('shipping_country');
	const shipping_city    = f('shipping_city');
	const shipping_state   = f('shipping_state',          { enabled: true,  required: false });
	const shipping_post    = f('shipping_post_code');
	const shipping_phone   = f('shipping_phone',          { enabled: true,  required: false });

	return createElement('div', { className: 'se-embedded-app__section' },
		createElement('h3', { className: 'se-embedded-app__section-title' }, 'Billing details'),
		createElement('div', { className: 'se-embedded-app__row' },
			billing_first.enabled && Field({ label: 'First name',  name: 'billing_first_name', value: fields.billing_first_name, onChange, required: billing_first.required }),
			billing_last.enabled  && Field({ label: 'Last name',   name: 'billing_last_name',  value: fields.billing_last_name,  onChange, required: billing_last.required })
		),
		createElement('div', { className: 'se-embedded-app__row' },
			billing_addr1.enabled && Field({ label: 'Address',         name: 'billing_address_1',  value: fields.billing_address_1,  onChange, required: billing_addr1.required }),
			billing_addr2.enabled && Field({ label: 'Address line 2',  name: 'billing_address_2',  value: fields.billing_address_2,  onChange, required: billing_addr2.required }),
			billing_apt.enabled   && Field({ label: 'Apt / Suite',     name: 'billing_apt',        value: fields.billing_apt,        onChange, required: billing_apt.required }),
		),
		createElement('div', { className: 'se-embedded-app__row' },
			billing_country.enabled && createElement(CountrySelect, { name: 'billing_country', value: fields.billing_country, required: billing_country.required }),
			billing_state.enabled   && createElement(StateSelector, { name: 'billing_state', country: fields.billing_country, value: fields.billing_state, required: billing_state.required })
		),
		createElement('div', { className: 'se-embedded-app__row' },
			billing_city.enabled && Field({ label: 'City',         name: 'billing_city',       value: fields.billing_city,       onChange, required: billing_city.required }),
			billing_post.enabled && Field({ label: 'Postcode',     name: 'billing_postcode',   value: fields.billing_postcode,   onChange, required: billing_post.required })
		),
		billing_phone.enabled && Field({ label: 'Phone',           name: 'billing_phone',      value: fields.billing_phone,      onChange, required: billing_phone.required }),

		needsShipping && createElement('div', { className: 'se-embedded-app__shipping' },
			createElement('h3', { className: 'se-embedded-app__section-title' }, 'Shipping address'),
			createElement('label', { className: 'se-embedded-app__inline' },
				createElement('input', {
					type: 'checkbox',
					checked: !!fields.same_as_shipping,
					onChange: (e) => onChange({ same_as_shipping: e.target.checked }),
				}),
				createElement('span', null, 'Ship to billing address')
			),
			!fields.same_as_shipping && createElement('div', null,
				createElement('div', { className: 'se-embedded-app__row' },
					shipping_first.enabled && Field({ label: 'First name', name: 'shipping_first_name', value: fields.shipping_first_name, onChange, required: shipping_first.required }),
					shipping_last.enabled  && Field({ label: 'Last name',  name: 'shipping_last_name',  value: fields.shipping_last_name,  onChange, required: shipping_last.required })
				),
				shipping_addr1.enabled && Field({ label: 'Address',        name: 'shipping_address_1',   value: fields.shipping_address_1,   onChange, required: shipping_addr1.required }),
				shipping_addr2.enabled && Field({ label: 'Address line 2', name: 'shipping_address_2',   value: fields.shipping_address_2,   onChange, required: shipping_addr2.required }),
				shipping_apt.enabled   && Field({ label: 'Apt / Suite',    name: 'shipping_apt',         value: fields.shipping_apt,         onChange, required: shipping_apt.required }),
				createElement('div', { className: 'se-embedded-app__row' },
					shipping_country.enabled && createElement(CountrySelect, { name: 'shipping_country', value: fields.shipping_country, required: shipping_country.required }),
					shipping_state.enabled   && createElement(StateSelector, { name: 'shipping_state', country: fields.shipping_country, value: fields.shipping_state, required: shipping_state.required })
				),
				createElement('div', { className: 'se-embedded-app__row' },
					shipping_city.enabled && Field({ label: 'City',         name: 'shipping_city',        value: fields.shipping_city,        onChange, required: shipping_city.required }),
					shipping_post.enabled && Field({ label: 'Postcode',     name: 'shipping_postal_code', value: fields.shipping_postal_code, onChange, required: shipping_post.required })
				),
				shipping_phone.enabled && Field({ label: 'Phone',          name: 'shipping_phone',       value: fields.shipping_phone,       onChange, required: shipping_phone.required })
			),
			// Shipping-method selector — only when the server quoted rates for the
			// current address. Lets the shopper choose between methods instead of
			// silently getting the first one.
			Array.isArray(snapshot && snapshot.shipping_rates) && snapshot.shipping_rates.length > 0 && createElement(ShippingMethods, {
				rates: snapshot.shipping_rates,
				chosen: snapshot.chosen_shipping_method,
				selected: fields.shipping_method,
				currency: snapshot.cart && snapshot.cart.currency,
				onChange,
			})
		)
	);
}
