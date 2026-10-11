import React, { useEffect, useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { API, namespace, isAddonActive } from '@Utils/helper';
import InputBox from '@Components/InputBox';
import { Scope, Select } from '@Components/ui';

/**
 * Inline per-variation reorder fields for the product editor's Inventory
 * panel. Saves to the variations table via a side-channel REST endpoint
 * on blur — same pattern as ReturnWindowField — so we don't need to plumb
 * three new fields through the main product save pipeline.
 *
 * For variable products the values broadcast across all variations of the
 * product when "variation_id" isn't given. This is fine for v1; per-variant
 * UI can come later if customers ask for it.
 */
const ReorderField = ( { productId } ) => {
	const [ form, setForm ] = useState( {
		reorder_point: '',
		reorder_qty: '',
		preferred_supplier_id: '',
	} );
	const [ suppliers, setSuppliers ] = useState( [] );
	const [ status, setStatus ] = useState( '' );

	useEffect( () => {
		if ( ! productId || ! isAddonActive( 'suppliers' ) ) return;
		API.get( `${ namespace }suppliers/products/${ productId }/reorder` )
			.then( ( res ) => {
				const v = res?.data?.variations?.[ 0 ];
				if ( v ) {
					setForm( {
						reorder_point: v.reorder_point ?? '',
						reorder_qty: v.reorder_qty ?? '',
						preferred_supplier_id: v.preferred_supplier_id ?? '',
					} );
				}
			} )
			.catch( () => {} );
		API.get( `${ namespace }suppliers`, { params: { active: 1 } } )
			.then( ( res ) => setSuppliers( res?.data || [] ) )
			.catch( () => {} );
	}, [ productId ] );

	const persist = useMemo(
		() => async ( next ) => {
			setStatus( __( 'Saving…', 'storeengine' ) );
			try {
				await API.post(
					`${ namespace }suppliers/products/${ productId }/reorder`,
					{
						reorder_point: Number( next.reorder_point ) || 0,
						reorder_qty: Number( next.reorder_qty ) || 0,
						preferred_supplier_id:
							Number( next.preferred_supplier_id ) || 0,
					}
				);
				setStatus( __( 'Saved', 'storeengine' ) );
				setTimeout( () => setStatus( '' ), 1500 );
			} catch ( e ) {
				setStatus( e?.response?.data?.message || e?.message || 'Failed' );
			}
		},
		[ productId ]
	);

	if ( ! productId || ! isAddonActive( 'suppliers' ) ) return null;

	return (
		<Scope as="div" className="storeengine-mt-6">
			<div className="text-xs font-semibold text-se-subtitle mb-2">
				{ __( 'Auto-reorder (Suppliers)', 'storeengine' ) }
			</div>
			<div className='storeengine-grid-3'>
				<InputBox label={ __( 'Reorder point', 'storeengine' ) }>
					<input
						type="number"
						min={ 0 }
						value={ form.reorder_point }
						onChange={ ( e ) =>
							setForm( { ...form, reorder_point: e.target.value } )
						}
						onBlur={ ( e ) =>
							persist( { ...form, reorder_point: e.target.value } )
						}
						className="storeengine-input"
					/>
				</InputBox>
				<InputBox label={ __( 'Reorder qty', 'storeengine' ) }>
					<input
						type="number"
						min={ 0 }
						value={ form.reorder_qty }
						onChange={ ( e ) =>
							setForm( { ...form, reorder_qty: e.target.value } )
						}
						onBlur={ ( e ) =>
							persist( { ...form, reorder_qty: e.target.value } )
						}
						className="storeengine-input"
					/>
				</InputBox>
				<InputBox label={ __( 'Preferred supplier', 'storeengine' ) }>
					<Select
						value={ form.preferred_supplier_id }
						onChange={ ( val ) => {
							const next = {
								...form,
								preferred_supplier_id: val,
							};
							setForm( next );
							persist( next );
						} }
						isClearable
						placeholder={ __( '— none —', 'storeengine' ) }
						options={ suppliers.map( ( s ) => ( {
							value: s.id,
							label: s.name,
						} ) ) }
					/>
				</InputBox>
			</div>
			<div className="mt-[6px] text-11 text-se-subtitle">
				{ status ||
					__(
						'Cron checks daily; drops a draft PO when stock <= reorder point.',
						'storeengine'
					) }
			</div>
		</Scope>
	);
};

export default ReorderField;
