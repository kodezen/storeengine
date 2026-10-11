import React, { useCallback, useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import { API, namespace } from '@Utils/helper';
import debounce from 'just-debounce-it';
import { __ } from '@wordpress/i18n';
import Tooltip from '@Components/Tooltip';
import { Scope, Heading } from '@Components/ui';

const defaultMessage = [
	{
		label: __( 'Enter your Keyword to search product', 'storeengine' ),
		value: 'none',
		isDisabled: true,
	},
];

const LinkedProducts = () => {
	const { values, setFieldValue } = useFormikContext();
	const {
		meta: { _storeengine_crosssell_ids, _storeengine_upsell_ids },
	} = values;
	const [ products, setProducts ] = useState( defaultMessage );
	const [ upSellProducts, setUpSellProducts ] = useState( [] );
	const [ crossSellProducts, setCrossSellProducts ] = useState( [] );
	const [ searchLoading, setSearchLoading ] = useState( false );

	const fetchSavedProducts = async ( ids ) => {
		setSearchLoading( true );
		return await API.get(
			`${ namespace }storeengine_product?include=${ ids }`
		).then( ( { data } ) => {
			setSearchLoading( false );
			return data.map( ( product ) => ( {
				label: product.title.rendered,
				value: product.id,
			} ) );
		} );
	};
	useEffect( () => {
		if ( _storeengine_crosssell_ids?.length > 0 ) {
			fetchSavedProducts( _storeengine_crosssell_ids ).then( ( res ) =>
				setCrossSellProducts( res )
			);
		}
		if ( _storeengine_upsell_ids?.length > 0 ) {
			fetchSavedProducts( _storeengine_upsell_ids ).then( ( res ) =>
				setUpSellProducts( res )
			);
		}
	}, [] );

	const handleProductSearch = async ( keyword ) => {
		if ( keyword ) {
			setSearchLoading( true );
			await API.get(
				`${ namespace }storeengine_product?search=${ keyword }`
			).then( ( { data } ) => {
				setProducts(
					data.map( ( product ) => ( {
						label: product.title.rendered,
						value: product.id,
					} ) )
				);
				setSearchLoading( false );
			} );
		} else {
			setProducts( defaultMessage );
		}
	};

	const debouncedAPICall = useCallback(
		debounce( ( keyword ) => {
			handleProductSearch( keyword );
		}, 1000 ),
		[ handleProductSearch ]
	);

	return (
		<Scope as="div" className="storeengine-content-section">
			<Heading as="p">
				{ __( 'Linked Product', 'storeengine' ) }
			</Heading>
			<div className="flex flex-col gap-6">
			<div className="storeengine-flex storeengine-flex-column storeengine-flex-gap-8 storeengine-flex-align-start">
				<p className="storeengine-title-subtitle flex-row items-center">
					<span className="storeengine-title">
						{ __( 'Up Sell', 'storeengine' ) }
					</span>
					<Tooltip>
						{ __( 'Select the products Up Sell', 'storeengine' ) }
					</Tooltip>
				</p>

				<Select
					options={ products }
					name="_storeengine_upsell_ids"
					wrapperClass="w-full"
					placeholder={ __( 'Search product', 'storeengine' ) }
					value={ upSellProducts }
					onInputChange={ ( key ) => debouncedAPICall( key ) }
					isMulti
					isLoading={ searchLoading }
					onChange={ ( options ) => {
						setUpSellProducts( options );
						setFieldValue(
							'meta._storeengine_upsell_ids',
							options.map( ( option ) => option.value )
						);
					} }
				/>
			</div>

			<div className="storeengine-flex storeengine-flex-column storeengine-flex-gap-8 storeengine-flex-align-start">
				<p className="storeengine-title-subtitle flex-row items-center">
					<span className="storeengine-title">
						{ __( 'Cross Sell', 'storeengine' ) }
					</span>
					<Tooltip>
						{ __(
							'Select the products Cross Sell',
							'storeengine'
						) }
					</Tooltip>
				</p>

				<Select
					options={ products }
					name="_storeengine_crosssell_ids"
					wrapperClass="w-full"
					placeholder={ __( 'Search product', 'storeengine' ) }
					value={ crossSellProducts }
					onInputChange={ ( key ) => debouncedAPICall( key ) }
					isMulti
					isLoading={ searchLoading }
					onChange={ ( options ) => {
						setCrossSellProducts( options );
						setFieldValue(
							'meta._storeengine_crosssell_ids',
							options.map( ( option ) => option.value )
						);
					} }
				/>
			</div>
			</div>
		</Scope>
	);
};

export default LinkedProducts;
