import React, { useEffect, useState } from 'react';
import { sprintf, __ } from '@wordpress/i18n';
import { Select } from '@Components/ui/Select';
import Number from '@Components/Formik/Number';
import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';
import { API, namespace, renderCurrencyWithPrice } from '@Utils/helper';
import Currency from '@Components/Currency';
import { Scope, Textarea } from '@Components/ui';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

/**
 * Body of the "Pay a Vendor" modal — mirrors the affiliate payout modal
 * (react-select + Formik Number field) so the two look and behave the same.
 * Data comes from the multi-vendor REST API rather than a redux slice.
 */
const VendorPayoutModalInner = () => {
	const { setFieldValue, values } = useFormikContext();
	const dispatch = useDispatch();

	const [ vendors, setVendors ] = useState( [] );
	const [ balance, setBalance ] = useState( null );

	useEffect( () => {
		let active = true;
		API.get( `${ namespace }vendors`, {
			params: { status: 'approved', per_page: 100 },
		} )
			.then( ( res ) => {
				if ( active ) {
					setVendors( res?.data?.items ?? [] );
				}
			} )
			.catch( ( e ) =>
				dispatch(
					showNotification( {
						message:
							e?.response?.data?.message ??
							__( 'Failed to load vendors.', 'storeengine' ),
						type: 'error',
						isShow: true,
					} )
				)
			);
		return () => {
			active = false;
		};
	}, [] );

	const onSelectVendor = async ( option ) => {
		const vendorId = option?.value ?? '';
		setFieldValue( 'vendor_id', vendorId );
		setFieldValue( 'vendor_balance', '' );
		setBalance( null );
		if ( ! vendorId ) {
			return;
		}
		try {
			const res = await API.get(
				`${ namespace }withdrawals/vendor-balance`,
				{ params: { vendor_id: vendorId } }
			);
			const bal = parseFloat( res?.data?.balance ?? 0 );
			setBalance( bal );
			setFieldValue( 'vendor_balance', bal );
		} catch ( e ) {
			dispatch(
				showNotification( {
					message:
						e?.response?.data?.message ??
						__( 'Failed to load balance.', 'storeengine' ),
					type: 'error',
					isShow: true,
				} )
			);
		}
	};

	const vendorOptions = vendors.map( ( v ) => ( {
		value: v.user_id,
		label: (
			<div className="storeengine-vendor-payout__option">
				<div className="storeengine-vendor-payout__option-info">
					<h4 className="storeengine-title">
						{ v.store_name || v.display_name || v.user_login }{ ' ' }
						<span className="storeengine-subtitle">
							({ v.user_email })
						</span>
					</h4>
					<div className="storeengine-vendor-payout__option-balance">
						<span>{ __( 'Balance:', 'storeengine' ) }</span>{ ' ' }
						<Currency value={ v.current_balance || 0 } />
					</div>
				</div>
			</div>
		),
	} ) );

	let renderError = false;
	if ( values.payout_amount ) {
		if ( null === balance ) {
			renderError = __( 'Please select a vendor first.', 'storeengine' );
		} else if ( parseFloat( values.payout_amount ) > parseFloat( balance ) ) {
			renderError = sprintf(
				// translators: %s: available balance amount.
				__(
					'Amount exceeds the vendor’s available balance (%s).',
					'storeengine'
				),
				renderCurrencyWithPrice( balance )
			);
		}
	}

	return (
		<Scope>
			<div className="mb-6">
				<label htmlFor="vendor_id" className="text-sm font-medium text-se-text">
					{ __( 'Select Vendor', 'storeengine' ) }
				</label>
				<Select
					name="vendor_id"
					className="storeengine-select storeengine-select--payouts mt-2"
					classNamePrefix="storeengine-react-select"
					placeholder={ __( 'Select a vendor…', 'storeengine' ) }
					onChange={ onSelectVendor }
					options={ vendorOptions }
				/>
			</div>

			{ null !== balance && (
				<div className="mb-4 text-sm text-se-subtitle">
					{ __( 'Available balance:', 'storeengine' ) }{ ' ' }
					<strong>
						<Currency value={ balance } />
					</strong>
				</div>
			) }

			<div className="relative">
				<Number
					title={ __( 'Payout Amount', 'storeengine' ) }
					name="payout_amount"
					placeholder={ __( 'Enter amount', 'storeengine' ) }
				/>
				{ renderError && (
					<span className="block absolute bottom-0 right-0 text-xs text-se-error">
						<strong
							dangerouslySetInnerHTML={ { __html: renderError } }
						/>
					</span>
				) }
			</div>

			<label htmlFor="admin_note" className="text-sm font-medium text-se-text">
				{ __( 'Note (optional)', 'storeengine' ) }
			</label>
			<Textarea
				name="admin_note"
				className="mt-2"
				rows={ 2 }
				value={ values.admin_note || '' }
				onChange={ ( e ) =>
					setFieldValue( 'admin_note', e.target.value )
				}
			/>
		</Scope>
	);
};

export default VendorPayoutModalInner;
