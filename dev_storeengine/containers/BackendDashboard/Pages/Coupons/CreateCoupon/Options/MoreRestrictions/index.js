import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';
import { Select } from '@Components/ui/Select';
import debounce from 'just-debounce-it';
import Checkbox from '@Components/Formik/Checkbox';
import { API, namespace } from '@Utils/helper';
import { fetchAllProducts } from '@Redux/Slices/productsSlice/productsSlice';
import ProLock from '../ProLock';
import { Scope, Heading } from '@Components/ui';

/**
 * Multi-select bound to a Formik field that holds an array of integer IDs.
 * `loadByIds` hydrates labels for ids already saved on the coupon and
 * `loadBySearch` powers the type-ahead. Both return [{ label, value }].
 */
const IdMultiSelect = ( {
	name,
	label,
	placeholder,
	loadBySearch,
	loadByIds,
	disabledIds = [],
} ) => {
	const { values, setFieldValue } = useFormikContext();
	const selectedIds = useMemo( () => {
		// Read the (possibly nested) field value from Formik values.
		return name
			.split( '.' )
			.reduce( ( acc, key ) => acc?.[ key ], values ) ?? [];
	}, [ values, name ] );

	const [ options, setOptions ] = useState( [] );
	const [ searching, setSearching ] = useState( false );

	const mergeOptions = useCallback( ( incoming = [] ) => {
		setOptions( ( prev ) => {
			const map = new Map( prev.map( ( o ) => [ o.value, o ] ) );
			incoming.forEach( ( o ) => map.set( o.value, o ) );
			return Array.from( map.values() );
		} );
	}, [] );

	const search = useCallback(
		async ( keyword = '' ) => {
			setSearching( true );
			try {
				const data = await loadBySearch( keyword );
				mergeOptions( data );
			} finally {
				setSearching( false );
			}
		},
		[ loadBySearch, mergeOptions ]
	);

	const debouncedSearch = useMemo(
		() => debounce( ( keyword ) => search( keyword ), 500 ),
		[ search ]
	);

	useEffect( () => {
		search();
		// Hydrate labels for already-selected ids in a single request.
		const missing = selectedIds.filter(
			( id ) => ! options.some( ( o ) => Number( o.value ) === Number( id ) )
		);
		if ( missing.length ) {
			loadByIds( missing ).then( mergeOptions );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const value = options.filter( ( o ) =>
		selectedIds.some( ( id ) => Number( id ) === Number( o.value ) )
	);

	// Hide options already chosen in the opposite (include/exclude) list so a
	// category can't be in both at once.
	const availableOptions = options.filter(
		( o ) =>
			! disabledIds.some( ( id ) => Number( id ) === Number( o.value ) )
	);

	return (
		<div className="storeengine-flex storeengine-flex-column storeengine-flex-gap-8 storeengine-width-full">
			<span className="storeengine-title">{ label }</span>
			<Select
				options={ availableOptions }
				value={ value }
				isMulti={ true }
				className="storeengine-select storeengine-select__width-full"
				placeholder={
					searching
						? __( 'Searching…', 'storeengine' )
						: placeholder
				}
				isLoading={ searching }
				onInputChange={ ( input ) => {
					if ( input ) {
						debouncedSearch( input );
					}
				} }
				onChange={ ( selected ) =>
					setFieldValue(
						name,
						( selected ?? [] ).map( ( o ) => o.value )
					)
				}
				menuPlacement="auto"
			/>
		</div>
	);
};

const MoreRestrictions = () => {
	const { values, setFieldValue } = useFormikContext();
	const dispatch = useDispatch();

	// ---- Category loaders (WP terms REST) ----
	const loadCategoriesBySearch = useCallback( async ( keyword = '' ) => {
		const params = { per_page: 50 };
		if ( keyword ) {
			params.search = keyword;
		}
		const res = await API.get(
			namespace + 'storeengine_product_category',
			{ params }
		);
		return ( res?.data ?? [] ).map( ( term ) => ( {
			label: term.name,
			value: term.id,
		} ) );
	}, [] );

	const loadCategoriesByIds = useCallback( async ( ids = [] ) => {
		if ( ! ids.length ) {
			return [];
		}
		const res = await API.get(
			namespace + 'storeengine_product_category',
			{ params: { include: ids, per_page: ids.length } }
		);
		return ( res?.data ?? [] ).map( ( term ) => ( {
			label: term.name,
			value: term.id,
		} ) );
	}, [] );

	// ---- Product loaders (reuse products slice) ----
	const mapProduct = ( item ) => ( {
		label: item?.title?.raw ?? item?.title?.rendered ?? '',
		value: item.id,
	} );

	// Only published products are eligible for a coupon restriction, so this
	// never needs the `edit_storeengine_products` capability that `status=any`
	// would require — a coupon-only staffer can browse products here too.
	const loadProductsBySearch = useCallback(
		async ( keyword = '' ) => {
			const { payload } = await dispatch(
				fetchAllProducts( { search: keyword, status: 'publish' } )
			);
			return ( payload?.data ?? [] ).map( mapProduct );
		},
		[ dispatch ]
	);

	const loadProductsByIds = useCallback(
		async ( ids = [] ) => {
			if ( ! ids.length ) {
				return [];
			}
			const { payload } = await dispatch(
				fetchAllProducts( { include: ids, status: 'publish' } )
			);
			return ( payload?.data ?? [] ).map( mapProduct );
		},
		[ dispatch ]
	);

	// Products already chosen in the "Select Products" section
	// (_storeengine_coupon_valid_prices) — hidden from the exclude list so a
	// product can't be both included and excluded.
	const includedProductIds = ( values.meta?._storeengine_coupon_valid_prices ?? [] )
		.map( ( item ) => item?.product_id )
		.filter( Boolean );

	// ---- Allowed emails (free-form creatable) ----
	const emailValues = (
		values.meta?._storeengine_email_restrictions ?? []
	).map( ( email ) => ( { label: email, value: email } ) );

	return (
		<Scope
			as="div"
			className="storeengine-content-section storeengine-content-section__specific-product"
		>
			<Heading as="p">
				{ __( 'Product & Usage Restrictions', 'storeengine' ) }
			</Heading>

			<div className="storeengine-flex storeengine-flex-column storeengine-flex-gap-16">
				<IdMultiSelect
					name="meta._storeengine_product_categories"
					label={ __( 'Include categories', 'storeengine' ) }
					placeholder={ __(
						'Apply only to these categories',
						'storeengine'
					) }
					loadBySearch={ loadCategoriesBySearch }
					loadByIds={ loadCategoriesByIds }
					disabledIds={
						values.meta
							?._storeengine_excluded_product_categories ?? []
					}
				/>
				<IdMultiSelect
					name="meta._storeengine_excluded_product_categories"
					label={ __( 'Exclude categories', 'storeengine' ) }
					placeholder={ __(
						'Never apply to these categories',
						'storeengine'
					) }
					loadBySearch={ loadCategoriesBySearch }
					loadByIds={ loadCategoriesByIds }
					disabledIds={
						values.meta?._storeengine_product_categories ?? []
					}
				/>
				<IdMultiSelect
					name="meta._storeengine_excluded_product_ids"
					label={ __( 'Exclude products', 'storeengine' ) }
					placeholder={ __(
						'Never apply to these products',
						'storeengine'
					) }
					loadBySearch={ loadProductsBySearch }
					loadByIds={ loadProductsByIds }
					disabledIds={ includedProductIds }
				/>

				<Checkbox
					title={ __( 'Exclude sale items', 'storeengine' ) }
					subtitle={ __(
						'Prevent this coupon from applying to items already on sale.',
						'storeengine'
					) }
					name="meta._storeengine_exclude_sale_items"
					suffix="coupon-restriction"
				/>

				<ProLock
					label={ __(
						'Restrict a coupon to specific customer emails.',
						'storeengine'
					) }
				>
					<div className="storeengine-flex storeengine-flex-column storeengine-flex-gap-8 storeengine-width-full">
						<span className="storeengine-title-subtitle">
							{ __( 'Allowed emails', 'storeengine' ) }
						</span>
						<Select
							isMulti={ true }
							isCreatable={ true }
							value={ emailValues }
							placeholder={ __(
								'e.g. user@example.com or *@example.com',
								'storeengine'
							) }
							className="storeengine-select storeengine-select__width-full"
							formatCreateLabel={ ( input ) =>
								`${ __( 'Add', 'storeengine' ) } "${ input }"`
							}
							onChange={ ( selected ) =>
								setFieldValue(
									'meta._storeengine_email_restrictions',
									( selected ?? [] ).map( ( o ) =>
										o.value.trim().toLowerCase()
									)
								)
							}
							menuPlacement="auto"
						/>
					</div>
				</ProLock>
			</div>
		</Scope>
	);
};

export default MoreRestrictions;
