import React, { useEffect, useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { API } from '@Utils/helper';
import { Button, Select } from '@Components/ui';
import OptionMenu from '@Components/OptionMenu';
import Preloader from '@Components/Loader/Preloader';
import ReactModal from '@Components/Modal/ReactModal';
import './stock-adjustment.scss';
import InputBox from '@Components/InputBox';

const reasonOptionsByAction = {
	add: [
		{ value: 'received', label: __( 'Received shipment', 'storeengine' ) },
		{ value: 'return', label: __( 'Customer return', 'storeengine' ) },
		{ value: 'correction', label: __( 'Inventory correction', 'storeengine' ) },
		{ value: 'transfer_in', label: __( 'Transfer in', 'storeengine' ) },
		{ value: 'manual', label: __( 'Manual adjustment', 'storeengine' ) },
		{ value: 'other', label: __( 'Other', 'storeengine' ) },
	],
	remove: [
		{ value: 'damaged', label: __( 'Damaged / loss', 'storeengine' ) },
		{ value: 'theft', label: __( 'Theft / shrinkage', 'storeengine' ) },
		{ value: 'promotion', label: __( 'Sample / promotion', 'storeengine' ) },
		{ value: 'transfer_out', label: __( 'Transfer out', 'storeengine' ) },
		{ value: 'correction', label: __( 'Inventory correction', 'storeengine' ) },
		{ value: 'manual', label: __( 'Manual adjustment', 'storeengine' ) },
		{ value: 'other', label: __( 'Other', 'storeengine' ) },
	],
	set: [
		{ value: 'cycle_count', label: __( 'Inventory count', 'storeengine' ) },
		{ value: 'correction', label: __( 'Inventory correction', 'storeengine' ) },
		{ value: 'initial_stock', label: __( 'Initial stock', 'storeengine' ) },
		{ value: 'manual', label: __( 'Manual adjustment', 'storeengine' ) },
		{ value: 'other', label: __( 'Other', 'storeengine' ) },
	],
};

const formatDate = ( s ) => {
	if ( ! s ) return '';
	try {
		return new Date( s.replace( ' ', 'T' ) + 'Z' ).toLocaleString();
	} catch {
		return s;
	}
};

const thStyle = ( align ) => ( {
	textAlign: align,
	fontSize: '14px',
	fontWeight: 500,
	lineHeight: '20px',
	padding: '12px',
} );

const tdStyle = ( align ) => ( {
	textAlign: align,
	fontSize: '14px',
	fontWeight: 500,
	lineHeight: '20px',
	padding: '12px',
} );

const typeColor = ( type ) => {
	switch ( type ) {
		case 'sale':
			return '#dc2626';
		case 'restock':
		case 'received':
		case 'return':
			return '#16a34a';
		case 'damaged':
			return '#b91c1c';
		case 'correction':
		case 'manual':
			return '#0ea5e9';
		default:
			return '#475569';
	}
};

const AdjustModal = ( {
	productId,
	variationId,
	variants,
	onClose,
	onAdjusted,
} ) => {
	const [ action, setAction ] = useState( 'add' );
	const [ qty, setQty ] = useState( 1 );
	const [ reason, setReason ] = useState( reasonOptionsByAction.add[ 0 ].value );
	const [ note, setNote ] = useState( '' );

	const handleActionChange = ( nextAction ) => {
		setAction( nextAction );
		const next = reasonOptionsByAction[ nextAction ] || [];
		if ( next.length && ! next.some( ( o ) => o.value === reason ) ) {
			setReason( next[ 0 ].value );
		}
	};

	const reasonOptions = reasonOptionsByAction[ action ] || [];
	const [ targetVariation, setTargetVariation ] = useState(
		variationId || ( Array.isArray( variants ) && variants[ 0 ]?.id ) || 0
	);
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState( '' );

	const showVariantPicker =
		! variationId && Array.isArray( variants ) && variants.length > 0;
	const effectiveVariationId = variationId || parseInt( targetVariation, 10 ) || 0;

	const submit = async ( e ) => {
		if ( e ) {
			e.preventDefault();
			e.stopPropagation();
		}
		setError( '' );
		setSubmitting( true );
		try {
			const { data } = await API.post(
				`storeengine/v1/products/${ productId }/stock-adjust`,
				{
					variation_id: effectiveVariationId,
					action,
					quantity: parseInt( qty, 10 ) || 0,
					reason,
					note,
				}
			);
			if ( typeof onAdjusted === 'function' ) onAdjusted( data );
			onClose();
		} catch ( err ) {
			setError(
				err?.response?.data?.message ||
					__( 'Failed to adjust stock.', 'storeengine' )
			);
		} finally {
			setSubmitting( false );
		}
	};

	return (
		<ReactModal
			title={
				effectiveVariationId
					? __( 'Adjust variant stock', 'storeengine' )
					: __( 'Adjust stock', 'storeengine' )
			}
			isOpen={ true }
			onRequestClose={ onClose }
			isEnabledResizer={ false }
			size="small"
			suffix="stock-adjust"
		>
			<div className="se-admin-tw storeengine-stock-adjust">
				{ showVariantPicker ? (
					<div className="storeengine-stock-adjust__field">
						<label className="storeengine-stock-adjust__label">
							{ __( 'Variant', 'storeengine' ) }
						</label>
						<Select
							value={ targetVariation }
							onChange={ ( val ) =>
								setTargetVariation(
									parseInt( val, 10 ) || 0
								)
							}
							className="storeengine-stock-adjust__control"
							options={ variants.map( ( v ) => ( {
								value: v.id,
								label:
									[ v.name, v.stock, v.sku ]
										.filter( Boolean )
										.join( ' · ' ) || `#${ v.id }`,
							} ) ) }
						/>
					</div>
				) : null }

				<InputBox label={ __( 'Action', 'storeengine' ) }>
					<div className='flex gap-3'>
						{ [
							[ 'add', __( 'Add', 'storeengine' ) ],
							[ 'remove', __( 'Remove', 'storeengine' ) ],
							[ 'set', __( 'Set to', 'storeengine' ) ],
						].map( ( [ value, label ] ) => (
							<label
								className="storeengine-radio-option"
								key={ value }
							>
								<input
									type="radio"
									className='storeengine-radio'
									name="action"
									value={ value }
									checked={ action === value }
									onChange={ ( e ) =>
										handleActionChange( e.target.value )
									}
								/>
								<span className='storeengine-title'>{ label }</span>
							</label>
						) ) }
					</div>
				</InputBox>

				<InputBox label={ __( 'Quantity', 'storeengine' ) }>
					<input
						type="number"
						min="0"
						step="1"
						required
						value={ qty }
						onChange={ ( e ) => setQty( e.target.value ) }
						className="storeengine-input"
					/>
				</InputBox>

				<InputBox label={ __( 'Reason', 'storeengine' ) }>
					<Select
						value={ reason }
						onChange={ ( val ) => setReason( val ) }
						options={ reasonOptions }
					/>
				</InputBox>

				<InputBox label={ __( 'Note (optional)', 'storeengine' ) }>
					<textarea
						rows={ 2 }
						value={ note }
						onChange={ ( e ) => setNote( e.target.value ) }
						className="storeengine-textarea"
						placeholder={ __(
							'PO #, supplier, batch, etc.',
							'storeengine'
						) }
					/>
				</InputBox>

				{ error ? (
					<p className="storeengine-stock-adjust__error">
						{ error }
					</p>
				) : null }

				<div className="storeengine-stock-adjust__footer">
					<Button
						type="button"
						preset="outline"
						onClick={ onClose }
					>
						{ __( 'Cancel', 'storeengine' ) }
					</Button>
					<Button
						type="button"
						preset="primary"
						disabled={ submitting }
						onClick={ submit }
					>
						{ submitting
							? __( 'Saving…', 'storeengine' )
							: __( 'Save', 'storeengine' ) }
					</Button>
				</div>
			</div>
		</ReactModal>
	);
};

/**
 * Tiny inline trigger — used in places where there is no room for the
 * full history table (e.g. each variant row).
 */
export const StockAdjustmentInline = ( {
	productId,
	variationId = 0,
	variants,
	onAdjusted,
	label,
} ) => {
	const [ open, setOpen ] = useState( false );

	if ( ! productId ) return null;

	return (
		<>
			<Button
				type="button"
				onClick={ () => setOpen( true ) }
			>
				{ label || __( 'Adjust', 'storeengine' ) }
			</Button>
			{ open ? (
				<AdjustModal
					productId={ productId }
					variationId={ variationId }
					variants={ variants }
					onClose={ () => setOpen( false ) }
					onAdjusted={ onAdjusted }
				/>
			) : null }
		</>
	);
};

/**
 * Kebab (…) menu trigger for stock adjustment — used in tight rows (each
 * variant) where an always-visible "Adjust" button crowds the layout. Clicking
 * the … opens a dropdown; "Adjust stock" launches the same AdjustModal.
 *
 * `extraOptions` lets a caller append more row actions to the same menu.
 */
export const StockAdjustmentMenu = ( {
	productId,
	variationId = 0,
	variants,
	onAdjusted,
	label,
	extraOptions = [],
} ) => {
	const [ open, setOpen ] = useState( false );

	if ( ! productId ) return null;

	return (
		<>
			<OptionMenu
				suffix="variant-actions"
				options={ [
					{
						type: 'button',
						label: label || __( 'Adjust stock', 'storeengine' ),
						onClick: () => setOpen( true ),
					},
					...extraOptions,
				] }
			/>
			{ open ? (
				<AdjustModal
					productId={ productId }
					variationId={ variationId }
					variants={ variants }
					onClose={ () => setOpen( false ) }
					onAdjusted={ onAdjusted }
				/>
			) : null }
		</>
	);
};

export const StockAdjustment = ( {
	productId,
	variationId = 0,
	variants,
	onAdjusted,
	showHistory = true,
} ) => {
	const [ open, setOpen ] = useState( false );
	const [ history, setHistory ] = useState( [] );
	const [ loadingHistory, setLoadingHistory ] = useState( false );

	const loadHistory = useCallback( async () => {
		if ( ! productId || ! showHistory ) return;
		setLoadingHistory( true );
		try {
			const { data } = await API.get(
				`storeengine/v1/products/${ productId }/stock-movements`,
				{ params: { variation_id: variationId, per_page: 25 } }
			);
			setHistory( data?.items ?? [] );
		} catch {
			setHistory( [] );
		} finally {
			setLoadingHistory( false );
		}
	}, [ productId, variationId, showHistory ] );

	useEffect( () => {
		loadHistory();
	}, [ loadHistory ] );

	if ( ! productId ) return null;

	return (
		<>
			<div className="flex items-center justify-between pb-4 border-b border-se-border">
				<h3 className="m-0 text-lg font-medium text-se-text">
					{ __( 'Stock movements', 'storeengine' ) }
				</h3>
				<Button
					type="button"
					preset="primary"
					size="sm"
					onClick={ () => setOpen( true ) }
				>
					{ __( 'Adjust stock', 'storeengine' ) }
				</Button>
			</div>

			{ showHistory ? (
				<>
					{ loadingHistory ? (
						<div style={ { padding: '12px', fontSize: '12px', color: '#64748b' } }>
							<Preloader />
						</div>
					) : history.length === 0 ? (
						<div className="mt-6 rounded-se border border-dashed border-se-border bg-se-bg px-4 py-6 text-center text-sm text-se-subtitle">
							{ __( 'No movements yet.', 'storeengine' ) }
						</div>
					) : (
						<div className="storeengine-table-container mt-6 overflow-hidden rounded-se border border-se-border">
							<table className="storeengine-table">
								<thead>
									<tr>
										<th style={ thStyle( 'left' ) }>
											{ __( 'When', 'storeengine' ) }
										</th>

										<th style={ thStyle( 'center' ) }>
											{ __( 'Type', 'storeengine' ) }
										</th>

										<th style={ thStyle( 'center' ) }>
											{ __( 'Δ', 'storeengine' ) }
										</th>

										<th style={ thStyle( 'center' ) }>
											{ __( 'After', 'storeengine' ) }
										</th>

										<th style={ thStyle( 'center' ) }>
											{ __( 'Note', 'storeengine' ) }
										</th>
									</tr>
								</thead>

								<tbody>
									{ history.map( ( m ) => (
										<tr
											key={ m.id }
											style={ {
												borderBottom:
													'1px solid var(--storeengine-border-color)',
											} }
										>
											<td
												style={ {
													...tdStyle( 'left' ),
													color: 'var(--storeengine-subtitle-color)',
													whiteSpace: 'nowrap',
												} }
											>
												{ formatDate( m.created_at ) }
											</td>

											<td style={ tdStyle( 'center' ) }>
												<span
													style={ {
														fontWeight: 500,
														textTransform: 'capitalize',
														color: typeColor( m.type ),
													} }
												>
													{ m.type?.replace( '_', ' ' ) }
												</span>

												{ m.reason ? (
													<span
														style={ {
															color: 'var(--storeengine-subtitle-color)',
															marginLeft: '4px',
														} }
													>
														· { m.reason }
													</span>
												) : null }
											</td>

											<td
												style={ {
													...tdStyle( 'center' ),
													fontFamily: 'monospace',
													color:
														parseInt( m.qty_change, 10 ) >= 0
															? '#16a34a'
															: '#dc2626',
												} }
											>
												{ parseInt( m.qty_change, 10 ) > 0
													? '+'
													: '' }

												{ m.qty_change }
											</td>

											<td
												style={ {
													...tdStyle( 'center' ),
													fontFamily: 'monospace',
												} }
											>
												{ m.qty_after }
											</td>

											<td
												style={ {
													...tdStyle( 'center' ),
													color: 'var(--storeengine-subtitle-color)',
												} }
											>
												{ m.note || '—' }
											</td>
										</tr>
									) ) }
								</tbody>
							</table>
						</div>
					) }
				</>
			) : null }

			{ open ? (
				<AdjustModal
					productId={ productId }
					variationId={ variationId }
					variants={ variants }
					onClose={ () => setOpen( false ) }
					onAdjusted={ ( result ) => {
						loadHistory();
						if ( typeof onAdjusted === 'function' )
							onAdjusted( result );
					} }
				/>
			) : null }
		</>
	);
};

export default StockAdjustment;
