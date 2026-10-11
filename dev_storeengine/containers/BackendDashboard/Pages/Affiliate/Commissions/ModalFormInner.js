import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Select } from '@Components/ui/Select';
import { useSelector, useDispatch } from 'react-redux';
import { makeRequest } from '@Utils/helper';
import { useFormikContext } from 'formik';
import { fetchAllAffiliates } from '@Redux/Slices/affiliatesSlice/affiliatesSlice';

import './styles.scss';

const ModalFormInner = () => {
	const affiliates = useSelector( ( state ) => state.affiliates );
	const [ dataFetchingStatus, setDataFetchingStatus ] = useState( false );
	const { setFieldValue, values } = useFormikContext();
	const [ orderIdOptions, setOrderIdOptions ] = useState( [] );

	const dispatch = useDispatch();

	useEffect( () => {
		setDataFetchingStatus( true );
		dispatch( fetchAllAffiliates( {} ) ).finally( () =>
			setDataFetchingStatus( false )
		);

		const fetchOrderIds = async () => {
			try {
				const {
					data: { data },
				} = await makeRequest( 'get_all_order_ids' );
				if ( Array.isArray( data ) ) {
					setOrderIdOptions(
						data.map( ( order ) => ( {
							label: `Order ID: ${ order.order_id }`,
							value: order.order_id,
						} ) )
					);
				} else {
					console.error( 'Expected an array but got:', data );
				}
			} catch ( error ) {
				console.error( 'Error fetching order IDs:', error );
			}
		};
		fetchOrderIds();
	}, [ dispatch ] );

	const affiliateIdOptions = affiliates?.data?.map( ( affiliate ) => ( {
		value: affiliate.affiliate_id,
		label: `Affiliate ID: ${ affiliate.affiliate_id }`,
	} ) );

	// The ui/Select is fully controlled — without a `value` prop it snaps back
	// to the placeholder the moment the menu closes, so a click reads as "can't
	// select". Mirror Formik's stored value back into each Select as the matching
	// option object. Compare as strings since option values may be numeric.
	const selectedAffiliate =
		affiliateIdOptions?.find(
			( option ) =>
				String( option.value ) === String( values.affiliate_id )
		) ?? null;
	const selectedOrder =
		orderIdOptions.find(
			( option ) => String( option.value ) === String( values.order_id )
		) ?? null;

	return (
		<>
			<div className="storeengine-mb-6">
				<label htmlFor="commission" className="storeengine-title">
					{ __( 'Affiliate ID', 'storeengine' ) }
				</label>
				<Select
					name="affiliate_id"
					className="storeengine-select storeengine-select--commission storeengine-mt-2"
					classNamePrefix="storeengine-react-select"
					value={ selectedAffiliate }
					onChange={ ( option ) =>
						setFieldValue( 'affiliate_id', option?.value ?? '' )
					}
					options={ affiliateIdOptions }
				/>
			</div>
			<label htmlFor="commission" className="storeengine-title">
				{ __( 'Order ID', 'storeengine' ) }
			</label>
			<Select
				name="order_id"
				className="storeengine-select storeengine-select--commission storeengine-mt-2"
				classNamePrefix="storeengine-react-select"
				value={ selectedOrder }
				onChange={ ( option ) =>
					setFieldValue( 'order_id', option?.value ?? '' )
				}
				options={ orderIdOptions }
			/>
		</>
	);
};

export default ModalFormInner;
