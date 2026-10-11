import React from 'react';
import { TabContent } from '../../Layouts';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Switch } from '@Components/ui';
import './styles.scss';

/**
 * Checkout Fields settings tab.
 *
 * Mirrors the schema in StoreEngine\Utils\CheckoutFields::schema(). Every
 * toggle writes into values.checkout_fields[id].{enabled,required}, which is
 * persisted to the `checkout_fields` setting and consumed by both the
 * traditional /checkout/ page and the React embedded checkout.
 *
 * System fields cannot be disabled; their checkboxes are locked.
 */
const SCHEMA = {
	contact: [
		{ id: 'email', label: __( 'Email', 'storeengine' ), system: true },
	],
	billing: [
		{ id: 'billing_first_name', label: __( 'First name', 'storeengine' ) },
		{ id: 'billing_last_name', label: __( 'Last name', 'storeengine' ) },
		{
			id: 'billing_address_line',
			label: __( 'Address line', 'storeengine' ),
		},
		{
			id: 'billing_address_line_2',
			label: __( 'Address line 2', 'storeengine' ),
		},
		{ id: 'billing_country', label: __( 'Country', 'storeengine' ) },
		{ id: 'billing_city', label: __( 'City', 'storeengine' ) },
		{ id: 'billing_state', label: __( 'State / Region', 'storeengine' ) },
		{ id: 'billing_apt', label: __( 'Apt / Suite', 'storeengine' ) },
		{ id: 'billing_post_code', label: __( 'Postcode', 'storeengine' ) },
		{ id: 'billing_phone', label: __( 'Phone', 'storeengine' ) },
	],
	shipping: [
		{
			id: 'shipping_first_name',
			label: __( 'First name', 'storeengine' ),
			system: true,
		},
		{
			id: 'shipping_last_name',
			label: __( 'Last name', 'storeengine' ),
			system: true,
		},
		{
			id: 'shipping_address_line',
			label: __( 'Address line', 'storeengine' ),
		},
		{
			id: 'shipping_address_line_2',
			label: __( 'Address line 2', 'storeengine' ),
		},
		{ id: 'shipping_country', label: __( 'Country', 'storeengine' ) },
		{ id: 'shipping_city', label: __( 'City', 'storeengine' ) },
		{ id: 'shipping_state', label: __( 'State / Region', 'storeengine' ) },
		{ id: 'shipping_apt', label: __( 'Apt / Suite', 'storeengine' ) },
		{ id: 'shipping_post_code', label: __( 'Postcode', 'storeengine' ) },
		{ id: 'shipping_phone', label: __( 'Phone', 'storeengine' ) },
	],
};

const FieldRow = ( { item } ) => {
	const { values, setFieldValue } = useFormikContext();
	const fields = values.checkout_fields || {};
	const current = fields[ item.id ] || {};

	const enabled = item.system ? true : !! current.enabled;
	const required = item.system ? true : !! current.required;

	const set = ( key, val ) => {
		const next = {
			...fields,
			[ item.id ]: { ...current, [ key ]: !! val },
		};
		// Disabling a field also clears its required flag.
		if ( 'enabled' === key && ! val ) {
			next[ item.id ].required = false;
		}
		// Marking a field required forces it to be enabled.
		if ( 'required' === key && val ) {
			next[ item.id ].enabled = true;
		}
		setFieldValue( 'checkout_fields', next );
	};

	return (
		<tr className={ enabled ? '' : 'storeengine-cf-row--disabled' }>
			<td className="text-left text-[14px] font-medium leading-5 p-3">
				<span className="storeengine-cf-text">{ item.label }</span>
			</td>
			<td className="text-center text-[14px] leading-5 p-3">
				{ item.system ? (
					<span className="storeengine-settings-tag">
						{ __( 'System', 'storeengine' ) }
					</span>
				) : "--"}
			</td>
			<td className="text-center p-3">
				<Switch
					checked={ enabled }
					disabled={ !! item.system }
					onChange={ ( val ) => set( 'enabled', val ) }
					aria-label={ __( 'Enabled', 'storeengine' ) }
				/>
			</td>
			<td className="text-center p-3">
				<Switch
					checked={ required }
					disabled={ !! item.system || ! enabled }
					onChange={ ( val ) => set( 'required', val ) }
					aria-label={ __( 'Required', 'storeengine' ) }
				/>
			</td>
		</tr>
	);
};

const FieldTable = ( { label, items, footer } ) => (
	<div className="storeengine-content-section">
		<h3 className="storeengine-heading">{ label }</h3>

		<div className='mt-6 border border-solid border-[var(--storeengine-border-color)] rounded'>
			<table className="w-full m-0 bg-white">
				<thead className="bg-[#F7F7F8] text-[var(--storeengine-text-color)] tracking-wide">
					<tr>
						<th className="text-left text-[14px] font-medium leading-5 p-3 capitalize">
							{ __( 'Field', 'storeengine' ) }
						</th>
						<th className="text-center text-[14px] font-medium leading-5 p-3 capitalize">
							{ __( 'Source', 'storeengine' ) }
						</th>
						<th className="text-center text-[14px] font-medium leading-5 p-3 capitalize">
							{ __( 'Enabled', 'storeengine' ) }
						</th>
						<th className="text-center text-[14px] font-medium leading-5 p-3 capitalize">
							{ __( 'Required', 'storeengine' ) }
						</th>
					</tr>
				</thead>
				<tbody>
					{ items.map( ( item ) => (
						<FieldRow key={ item.id } item={ item } />
					) ) }
				</tbody>
			</table>
		</div>

		{ footer && (
			<p className="py-3 m-0 text-[12px] text-se-subtitle">
				{ footer }
			</p>
		) }
	</div>
);

const CheckoutFields = () => {
	return (
		<TabContent>
			<FieldTable
				label={ __( 'Contact', 'storeengine' ) }
				items={ SCHEMA.contact }
			/>
			<FieldTable
				label={ __( 'Billing Address', 'storeengine' ) }
				items={ SCHEMA.billing }
				footer={ __(
					'If you have tax rates that match by postcode/ZIP, keep the Postcode field required — otherwise those rates cannot be matched and tax may be calculated incorrectly.',
					'storeengine'
				) }
			/>
			<FieldTable
				label={ __( 'Shipping Address', 'storeengine' ) }
				items={ SCHEMA.shipping }
				footer={ __(
					'Shipping fields only render when the cart contains a product that needs shipping. If your shipping or tax rates match by postcode/ZIP, keep the Postcode field required — otherwise those rates cannot be matched and shipping or tax may be missing or incorrect.',
					'storeengine'
				) }
			/>
		</TabContent>
	);
};

export default CheckoutFields;
