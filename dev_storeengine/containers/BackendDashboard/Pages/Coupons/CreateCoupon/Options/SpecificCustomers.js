import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import {
	fetchAllCustomers,
	fetchIncludedCustomers,
} from '@Redux/Slices/customersSlice/customersSLice';
import { useDispatch } from 'react-redux';
import debounce from 'just-debounce-it';

const SpecificCustomers = () => {
	const { values, setFieldValue } = useFormikContext();
	const [ customerOptions, setCustomerOptions ] = useState( [] );
	const [ selectedCustomers, setSelectedCustomers ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const dispatch = useDispatch();

	const nonExistingCustomer = useMemo( () => {
		return customerOptions.filter(
			( item ) =>
				! values.meta?._storeengine_coupon_valid_customers?.includes(
					item.value
				)
		);
	}, [ customerOptions, values.meta?._storeengine_coupon_valid_customers ] );

	const fetchCustomerAndPrepareData = async ( searchKey = '' ) => {
		setLoading( true );
		try {
			const {
				payload: { data },
			} = await dispatch( fetchAllCustomers( { search: searchKey } ) );

			const customerData = data.map( ( item ) => ( {
				label: item.email,
				value: item.id,
			} ) );

			setCustomerOptions( ( prev ) => {
				const merged = [ ...prev, ...customerData ];

				return merged.filter(
					( item, index, arr ) =>
						arr.findIndex( ( x ) => x.value === item.value ) ===
						index
				);
			} );
		} finally {
			setLoading( false );
		}
	};

	// ui/Select's `onInputChange` calls back with just the typed string (no
	// react-select-style `actionMeta` second argument) — it only fires for
	// genuine keystrokes, so no action-type check is needed here.
	const handleInputChange = ( inputValue ) => {
		debouncedAPICall( inputValue );
	};

	const debouncedAPICall = useCallback(
		debounce( ( keyword ) => {
			fetchCustomerAndPrepareData( keyword );
		}, 1000 ),
		[ fetchCustomerAndPrepareData ]
	);

	useEffect( () => {
		( async () => {
			const data = await fetchCustomerAndPrepareData();
		} )();
	}, [] );

	useEffect( () => {
		if (
			customerOptions &&
			!! values.meta?._storeengine_coupon_valid_customers.length
		) {
			setLoading( true );
			const existingCustomer = customerOptions.filter( ( item ) =>
				values.meta?._storeengine_coupon_valid_customers?.includes(
					item.value
				)
			);
			setSelectedCustomers( existingCustomer );
			setTimeout( () => {
				setLoading( false );
			}, 1000 );
		}
	}, [ customerOptions, values.meta?._storeengine_coupon_valid_customers ] );

	useEffect( () => {
		( async () => {
			if (
				!!! customerOptions.length &&
				values?.meta?._storeengine_coupon_who_can_use ===
					'specificCustomer' &&
				!! nonExistingCustomer.length
			) {
				if ( !! nonExistingCustomer.length ) {
					const { payload } = await dispatch(
						fetchIncludedCustomers(
							nonExistingCustomer.map( ( item ) => item.value )
						)
					);
					setSelectedCustomers( ( prev ) => [
						...prev,
						...payload.map( ( item ) => ( {
							label: item.email,
							value: item.id,
						} ) ),
					] );
				}
			}
		} )();
	}, [
		customerOptions,
		values?.meta?._storeengine_coupon_who_can_use,
		nonExistingCustomer,
	] );
	return (
		<Select
			key={ selectedCustomers.length }
			id="meta._storeengine_coupon_valid_customers"
			name="meta._storeengine_coupon_valid_customers"
			options={ customerOptions }
			className="storeengine-select storeengine-select__width-full storeengine-mt-4"
			classNamePrefix="storeengine-react-select"
			placeholder={
				loading
					? __( 'Searching…', 'storeengine' )
					: __( 'Select customer', 'storeengine' )
			}
			isLoading={ loading }
			value={ selectedCustomers }
			isSearchable
			isMulti={ true }
			onInputChange={ handleInputChange }
			menuPosition="fixed"
			menuPlacement="auto"
			onChange={ ( options ) => {
				const safeOptions = options || [];
				setSelectedCustomers( safeOptions );
				setFieldValue(
					'meta._storeengine_coupon_valid_customers',
					safeOptions.map( ( item ) => item.value )
				);
			} }
		/>
	);
};

export default SpecificCustomers;
