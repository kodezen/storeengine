import React, { useEffect, useState } from 'react';
import { sprintf, __ } from '@wordpress/i18n';
import { Select } from '@Components/ui/Select';
import Number from '@Components/Formik/Number';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSettings } from '@Redux/Slices/settingsSlice/settingsSlice';
import { fetchAllAffiliates } from '@Redux/Slices/affiliatesSlice/affiliatesSlice';
import { Field, useFormikContext } from 'formik';
import { makeRequest2, renderCurrencyWithPrice } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import Currency from '@Components/Currency';
import Gravatar from '@Components/Gravatar';

import './styles.scss';

const ModalFormInner = () => {
	//const settings = useSelector( ( state ) => state.settings );
	const affiliates = useSelector( ( state ) => state.affiliates );
	const { setFieldValue, values } = useFormikContext();
	const dispatch = useDispatch();

	const [ settingsLoading, setSettingsLoading ] = useState( false );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const [ affiliateBalance, setAffiliateBalance ] = useState( null );

	const fetchAffiliateBalance = async ( affiliate_id ) => {
		try {
			const currentBalance = await makeRequest2(
				'get_affiliates_current_balance',
				{ affiliate_id }
			);
			setAffiliateBalance( currentBalance );
			setFieldValue( 'affiliate_balance', currentBalance );
		} catch ( e ) {
			dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'error',
				} )
			);
		}
	};

	useEffect( () => {
		setSettingsLoading( true );
		setDataFetchingStatus( true );
		// dispatch setting & affiliates
		dispatch( fetchSettings() ).then( () => {
			setSettingsLoading( false );
			dispatch( fetchAllAffiliates( {} ) ).then( () => {
				setDataFetchingStatus( false );
			} );
		} );

		//    fetch affiliates balance
		if ( values.affiliate_id ) {
			fetchAffiliateBalance( values.affiliate_id );
		}
	}, [ dispatch, values.affiliate_id ] );

	let renderError = false;
	if ( values.payout_amount ) {
		if ( null === affiliateBalance ) {
			renderError = __(
				'Please select affiliate user first.',
				'storeengine'
			);
		} else if (
			parseFloat( values.payout_amount ) > parseFloat( affiliateBalance )
		) {
			renderError = sprintf(
				// translators: %s. Current balance amount
				__(
					'Current balance (%s) for selected affiliate is not insufficient.',
					'storeengine'
				),
				renderCurrencyWithPrice( affiliateBalance )
			);
		}
	}

	const affiliateUserOptions = affiliates?.data?.map( ( affiliate ) => ( {
		value: affiliate.affiliate_id,
		label: (
			<div className="storeengine-d-flex affiliate-user">
				<div className="user-avatar">
					<Gravatar
						hash={ affiliate.email_hash }
						size={ 30 }
						alt={ affiliate.display_name }
					/>
				</div>
				<div className="user-info">
					<h4 className="storeengine-title">
						{ affiliate.display_name }{ ' ' }
						<span className="storeengine-subtitle">
							({ affiliate.user_email })
						</span>
					</h4>
					<div className="balance">
						<span>{ __( 'Balance:', 'storeengine' ) }</span>
						<Currency value={ affiliate.current_balance || 0 } />
					</div>
				</div>
			</div>
		),
	} ) );

	const paymentMethodOptions = [
		{
			label: __( 'PayPal', 'storeengine' ),
			value: 'PayPal',
		},
		{
			label: __( 'Bank Transfer', 'storeengine' ),
			value: 'Bank Transfer',
		},
		{
			label: __( 'Stripe', 'storeengine' ),
			value: 'Stripe',
		},
		{
			label: __( 'Check Payment', 'storeengine' ),
			value: 'Check Payment',
		},
		{
			label: __( 'E-Check', 'storeengine' ),
			value: 'E-Check',
		},
	];

	return (
		<>
			<div className="storeengine-mb-6">
				<label htmlFor="affiliate_id" className="storeengine-title">
					{ __( 'Select Affiliate User', 'storeengine' ) }
				</label>
				<Select
					name="affiliate_id"
					className="storeengine-select storeengine-select--payouts storeengine-mt-2"
					classNamePrefix="storeengine-react-select"
					onChange={ ( option ) =>
						setFieldValue( 'affiliate_id', option.value )
					}
					options={ affiliateUserOptions }
				/>
			</div>
			<div className="" style={ { position: 'relative' } }>
				<Number
					title={ __( 'Payout Amount', 'storeengine' ) }
					name={ 'payout_amount' }
					placeholder={ 'Enter Amount' }
				/>
				{ renderError && (
					<span
						className="storeengine-payouts-error"
						style={ {
							display: 'block',
							position: 'absolute',
							bottom: 0,
							right: 0,
						} }
					>
						<strong
							dangerouslySetInnerHTML={ { __html: renderError } }
						/>
					</span>
				) }
			</div>
			<label htmlFor="payments_method" className="storeengine-title">
				{ __( 'Payment Method', 'storeengine' ) }
			</label>
			<Select
				name="payment_method"
				onChange={ ( option ) =>
					setFieldValue( 'payment_method', option.value )
				}
				className="storeengine-select storeengine-select--payouts storeengine-mt-2"
				classNamePrefix="storeengine-react-select"
				options={ paymentMethodOptions }
			/>
			<Field type="hidden" name="affiliate_balance" />
		</>
	);
};

export default ModalFormInner;
