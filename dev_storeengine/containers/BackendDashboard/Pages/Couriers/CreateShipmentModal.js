import React, { useEffect, useMemo, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@Components/Button';
import ReactModal from '@Components/Modal/ReactModal';
import {
	createShipment,
	fetchPathaoCities,
	fetchPathaoZones,
	fetchProviders,
	fetchShipmentDefaults,
	fetchSettings,
} from '@Redux/Slices/couriersSlice/couriersSlice';
import InputBox from '@Components/InputBox';
import { Select } from '@Components/ui/Select';

const inputCx =
	'px-2 py-1.5 border border-se-border rounded text-sm text-se-input bg-white focus:outline-none focus:ring-2 focus:ring-se-primary/30';
const labelCx = 'flex flex-col gap-1 text-[14px] text-se-subtitle';

const blank = ( orderId = '', provider = '' ) => ( {
	order_id: orderId,
	provider,
	customer_name: '',
	customer_phone: '',
	customer_address: '',
	city: '',
	state: '',
	postcode: '',
	country: '',
	cod_amount: 0,
	weight_kg: 0.5,
	item_description: '',
	city_id: '',
	zone_id: '',
} );

const CreateShipmentModal = ( {
	isOpen,
	onRequestClose,
	initialOrderId = '',
	initialProvider = '',
	onCreated,
} ) => {
	const dispatch = useDispatch();
	const {
		providers = [],
		settings = {},
		pathaoCities = [],
		pathaoZonesByCity = {},
	} = useSelector( ( s ) => s.couriers );

	const defaultProvider =
		initialProvider || settings?.auto_push?.provider || '';

	const [ form, setForm ] = useState( () =>
		blank( initialOrderId, defaultProvider )
	);
	const [ touched, setTouched ] = useState( {} );
	const [ meta, setMeta ] = useState( null );
	const [ submitting, setSubmitting ] = useState( false );
	const lastLoadedOrderId = useRef( null );

	useEffect( () => {
		if ( ! providers.length ) dispatch( fetchProviders() );
		if ( ! settings || ! Object.keys( settings ).length ) {
			dispatch( fetchSettings() );
		}
	}, [ dispatch ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		if ( ! isOpen ) return;
		setForm( ( prev ) => ( {
			...blank( initialOrderId, defaultProvider ),
			...( initialOrderId ? { order_id: initialOrderId } : {} ),
		} ) );
		setTouched( {} );
		setMeta( null );
		lastLoadedOrderId.current = null;
	}, [ isOpen, initialOrderId, defaultProvider ] );

	const loadDefaultsFor = async ( orderId ) => {
		if ( ! orderId || lastLoadedOrderId.current === orderId ) return;
		lastLoadedOrderId.current = orderId;
		const action = await dispatch( fetchShipmentDefaults( orderId ) );
		if ( action?.payload && ! action.error ) {
			const { _meta, ...defaults } = action.payload;
			setMeta( _meta || null );
			setForm( ( prev ) => {
				const next = { ...prev };
				Object.keys( defaults ).forEach( ( k ) => {
					if ( ! touched[ k ] ) next[ k ] = defaults[ k ];
				} );
				return next;
			} );
		}
	};

	useEffect( () => {
		if ( ! isOpen ) return;
		if ( initialOrderId ) loadDefaultsFor( initialOrderId );
	}, [ isOpen, initialOrderId ] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		if ( form.provider === 'pathao' && ! pathaoCities.length ) {
			dispatch( fetchPathaoCities() );
		}
	}, [ form.provider, pathaoCities.length, dispatch ] );

	useEffect( () => {
		if (
			form.provider === 'pathao' &&
			form.city_id &&
			! pathaoZonesByCity[ form.city_id ]
		) {
			dispatch( fetchPathaoZones( form.city_id ) );
		}
	}, [ form.provider, form.city_id, pathaoZonesByCity, dispatch ] );

	const setField = ( key, value ) => {
		setForm( ( prev ) => ( { ...prev, [ key ]: value } ) );
		setTouched( ( prev ) => ( { ...prev, [ key ]: true } ) );
	};

	const isPathao = form.provider === 'pathao';
	const isShiprocket = form.provider === 'shiprocket';

	const providerOptions = useMemo(
		() => providers.map( ( p ) => ( { value: p.id, label: p.label } ) ),
		[ providers ]
	);

	const cityOptions = useMemo(
		() =>
			pathaoCities.map( ( c ) => ( {
				value: c.city_id ?? c.id,
				label: c.city_name ?? c.name,
			} ) ),
		[ pathaoCities ]
	);

	const zoneOptions = useMemo( () => {
		const list = pathaoZonesByCity[ form.city_id ] || [];
		return list.map( ( z ) => ( {
			value: z.zone_id ?? z.id,
			label: z.zone_name ?? z.name,
		} ) );
	}, [ pathaoZonesByCity, form.city_id ] );

	const submit = async () => {
		if ( ! form.order_id || ! form.provider || submitting ) return;
		setSubmitting( true );
		const payload = {
			...form,
			order_id: Number( form.order_id ),
			cod_amount: Number( form.cod_amount || 0 ),
			weight_kg: Number( form.weight_kg || 0 ),
		};
		if ( isPathao ) {
			payload.city_id = Number( form.city_id || 0 );
			payload.zone_id = Number( form.zone_id || 0 );
		} else {
			delete payload.city_id;
			delete payload.zone_id;
		}
		const action = await dispatch( createShipment( payload ) );
		setSubmitting( false );
		if ( ! action.error ) {
			onCreated && onCreated( action.payload );
			onRequestClose();
		}
	};

	return (
		<ReactModal
			title={ __( 'Create shipment', 'storeengine' ) }
			isOpen={ isOpen }
			onRequestClose={ onRequestClose }
			size="medium"
			suffix="couriers-create"
		>
			<div className="se-admin-tw font-se">
				<div className="storeengine-grid-2 storeengine-mb-4">
					<InputBox label={ __( 'Provider', 'storeengine' ) }>
						<Select
							options={ providerOptions }
							value={
								providerOptions.find(
									( o ) => o.value === form.provider
								) ?? null
							}
							onChange={ ( option ) =>
								setField( 'provider', option?.value ?? '' )
							}
							isSearchable={ false }
							placeholder={ __( 'Select provider', 'storeengine' ) }
						/>
					</InputBox>
					<InputBox label={ __( 'Order ID', 'storeengine' ) }>
						<input
							type="number"
							min={ 1 }
							value={ form.order_id }
							onChange={ ( e ) => setField( 'order_id', e.target.value ) }
							onBlur={ ( e ) => loadDefaultsFor( e.target.value ) }
							disabled={ !! initialOrderId }
							placeholder={ __( 'e.g. 1024', 'storeengine' ) }
							className="storeengine-input"
						/>
					</InputBox>
					<InputBox label={ __( 'Customer name', 'storeengine' ) }>
						<input
							type="text"
							value={ form.customer_name }
							onChange={ ( e ) =>
								setField( 'customer_name', e.target.value )
							}
							placeholder={ __( 'e.g. Jane Doe', 'storeengine' ) }
							className="storeengine-input"
						/>
					</InputBox>
					<InputBox label={ __( 'Customer phone', 'storeengine' ) }>
						<input
							type="text"
							value={ form.customer_phone }
							onChange={ ( e ) =>
								setField( 'customer_phone', e.target.value )
							}
							placeholder={ __( 'e.g. +8801700000000', 'storeengine' ) }
							className="storeengine-input"
						/>
					</InputBox>
				</div>

				<InputBox label={ __( 'Customer address', 'storeengine' ) }>
					<input
						type="text"
						value={ form.customer_address }
						onChange={ ( e ) =>
							setField( 'customer_address', e.target.value )
						}
						placeholder={ __( 'House, road, area', 'storeengine' ) }
						className="storeengine-input"
					/>
				</InputBox>

				<div className="storeengine-grid-2 storeengine-mt-4 storeengine-mb-4">
					{ isPathao ? (
						<>
							<InputBox label={ __( 'City (Pathao)', 'storeengine' ) }>
								<Select
									options={ cityOptions }
									value={
										cityOptions.find(
											( c ) =>
												String( c.value ) ===
												String( form.city_id || '' )
										) ?? null
									}
									onChange={ ( option ) => {
										setField( 'city_id', option?.value ?? '' );
										setField( 'zone_id', '' );
									} }
									placeholder={
										cityOptions.length
											? __( 'Select…', 'storeengine' )
											: __(
													'No cities loaded — check Pathao credentials',
													'storeengine'
											  )
									}
								/>
							</InputBox>
							<InputBox label={ __( 'Zone (Pathao)', 'storeengine' ) }>
								<Select
									options={ zoneOptions }
									value={
										zoneOptions.find(
											( z ) =>
												String( z.value ) ===
												String( form.zone_id || '' )
										) ?? null
									}
									onChange={ ( option ) =>
										setField( 'zone_id', option?.value ?? '' )
									}
									isDisabled={ ! form.city_id }
									placeholder={ __( 'Select zone', 'storeengine' ) }
								/>
							</InputBox>
						</>
					) : (
						<>
							<InputBox label={ __( 'City', 'storeengine' ) }>
								<input
									type="text"
									value={ form.city }
									onChange={ ( e ) => setField( 'city', e.target.value ) }
									placeholder={ __( 'e.g. Dhaka', 'storeengine' ) }
									className="storeengine-input"
								/>
							</InputBox>
							<InputBox label={ __( 'State', 'storeengine' ) }>
								<input
									type="text"
									value={ form.state }
									onChange={ ( e ) =>
										setField( 'state', e.target.value )
									}
									placeholder={ __( 'e.g. Dhaka Division', 'storeengine' ) }
									className="storeengine-input"
								/>
							</InputBox>
						</>
					) }
					<InputBox label={ __( 'Postcode', 'storeengine' ) }>
						<input
							type="text"
							value={ form.postcode }
							onChange={ ( e ) => setField( 'postcode', e.target.value ) }
							placeholder={ __( 'e.g. 1207', 'storeengine' ) }
							className="storeengine-input"
						/>
					</InputBox>
					<InputBox label={ __( 'Country', 'storeengine' ) }>
						<input
							type="text"
							value={ form.country }
							onChange={ ( e ) => setField( 'country', e.target.value ) }
							placeholder={ __( 'e.g. BD', 'storeengine' ) }
							className="storeengine-input"
						/>
					</InputBox>
					<InputBox label={ __( 'COD amount', 'storeengine' ) }>
						<input
							type="number"
							step="0.01"
							value={ form.cod_amount }
							onChange={ ( e ) =>
								setField( 'cod_amount', e.target.value )
							}
							placeholder={ __( '0.00', 'storeengine' ) }
							className="storeengine-input"
						/>
					</InputBox>
					<InputBox label={ __( 'Weight (kg)', 'storeengine' ) }>
						<input
							type="number"
							step="0.1"
							value={ form.weight_kg }
							onChange={ ( e ) =>
								setField( 'weight_kg', e.target.value )
							}
							placeholder={ __( 'e.g. 0.5', 'storeengine' ) }
							className="storeengine-input"
						/>
					</InputBox>
				</div>

				<InputBox label={ __( 'Item description', 'storeengine' ) }>
					<textarea
						rows={ 3 }
						value={ form.item_description }
						onChange={ ( e ) =>
							setField( 'item_description', e.target.value )
						}
						placeholder={ __( 'e.g. 1 x Blue t shirt', 'storeengine' ) }
						className="storeengine-textarea"
					/>
				</InputBox>

				{ isShiprocket && meta?.line_item_count ? (
					<div className="text-xs text-se-subtitle bg-se-bg/40 border border-se-border rounded p-2 mb-2">
						{ meta.line_item_count }{ ' ' }
						{ __( 'items, subtotal', 'storeengine' ) }{ ' ' }
						{ meta.currency || '' } { Number( meta.subtotal || 0 ).toFixed( 2 ) }
						{ ' — ' }
						{ __(
							'line items will be sent to Shiprocket automatically.',
							'storeengine'
						) }
					</div>
				) : null }

				<div className="storeengine-flex-actions storeengine-mt-4">
					<Button
						label={ __( 'Cancel', 'storeengine' ) }
						preset="gray"
						onClick={ onRequestClose }
					/>
					<Button
						label={ __( 'Push to courier', 'storeengine' ) }
						preset="blue"
						onClick={ submit }
						isLoading={ submitting }
					/>
				</div>
			</div>
		</ReactModal>
	);
};

export default CreateShipmentModal;
