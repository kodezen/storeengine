import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import moment from 'moment';
import Button from '@Components/Button';
import OptionMenu from '@Components/OptionMenu';
import { API, namespace, isAddonActive } from '@Utils/helper';
import {
	cancelShipment,
	trackShipment,
} from '@Redux/Slices/couriersSlice/couriersSlice';
import CreateShipmentModal from './CreateShipmentModal';

const STATUS_BADGE = ( status ) => {
	const s = ( status || '' ).toLowerCase();
	if ( s === 'delivered' ) return 'bg-se-success/10 text-se-success';
	if ( s === 'cancelled' || s === 'returned' )
		return 'bg-se-error/10 text-se-error';
	if ( s === 'created' ) return 'bg-se-bg text-se-subtitle';
	return 'bg-se-primary/10 text-se-primary';
};

const OrderShipments = ( { orderId } ) => {
	const dispatch = useDispatch();
	const [ rows, setRows ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ open, setOpen ] = useState( false );

	const load = async () => {
		if ( ! orderId ) return;
		setLoading( true );
		try {
			const res = await API.get( `${ namespace }couriers/shipments`, {
				params: { order_id: orderId },
			} );
			setRows( Array.isArray( res.data ) ? res.data : [] );
		} catch ( e ) {
			setRows( [] );
		}
		setLoading( false );
	};

	useEffect( () => {
		load();
	}, [ orderId ] ); // eslint-disable-line react-hooks/exhaustive-deps

	if ( ! isAddonActive( 'couriers' ) ) return null;

	const onTrack = async ( id ) => {
		const action = await dispatch( trackShipment( id ) );
		if ( action?.payload ) {
			setRows( ( prev ) =>
				prev.map( ( r ) =>
					Number( r.id ) === Number( action.payload.id ) ? action.payload : r
				)
			);
		}
	};

	const onCancel = async ( id ) => {
		const action = await dispatch( cancelShipment( id ) );
		if ( action?.payload ) {
			setRows( ( prev ) =>
				prev.map( ( r ) =>
					Number( r.id ) === Number( action.payload.id ) ? action.payload : r
				)
			);
		}
	};

	return (
		<div className="storeengine-content-section">
			<div className="storeengine-content-section-heading">
				<h3 className="storeengine-content-section--title">
					{ __( 'Courier Shipments', 'storeengine' ) }
				</h3>
				<OptionMenu
					options={ [
						{
							type: 'button',
							label: (
								<span>
									{ __( 'Create Shipment', 'storeengine' ) }
								</span>
							),
							icon: (
								<span
									className="storeengine-icon storeengine-icon--shipping"
									aria-hidden={ true }
								/>
							),
							onClick: () => setOpen( true ),
						},
					] }
				/>
			</div>

			<div className="se-admin-tw font-se">
				{ loading && ! rows.length ? (
					<div className="text-xs text-se-subtitle py-2">
						{ __( 'Loading shipments…', 'storeengine' ) }
					</div>
				) : null }
				{ ! loading && ! rows.length ? (
					<div className="text-xs text-se-subtitle py-2">
						{ __(
							'No shipments yet for this order.',
							'storeengine'
						) }
					</div>
				) : null }
				{ rows.length ? (
					<table className="w-full text-sm">
						<thead className="text-xs uppercase text-se-subtitle">
							<tr>
								<th className="text-left py-1">
									{ __( 'Provider', 'storeengine' ) }
								</th>
								<th className="text-left py-1">
									{ __( 'Tracking', 'storeengine' ) }
								</th>
								<th className="text-left py-1">
									{ __( 'Status', 'storeengine' ) }
								</th>
								<th className="text-left py-1">
									{ __( 'Last sync', 'storeengine' ) }
								</th>
								<th className="py-1"></th>
							</tr>
						</thead>
						<tbody className="divide-y divide-se-border">
							{ rows.map( ( s ) => {
								const display = s.internal_status || s.status;
								return (
									<tr key={ s.id }>
										<td className="py-2 capitalize text-se-text">
											{ s.provider }
										</td>
										<td className="py-2">
											{ s.tracking_url ? (
												<a
													href={ s.tracking_url }
													target="_blank"
													rel="noreferrer noopener"
													className="text-se-primary hover:underline font-mono text-xs"
												>
													{ s.tracking_id || '—' }
												</a>
											) : (
												<span className="font-mono text-xs text-se-subtitle">
													{ s.tracking_id || '—' }
												</span>
											) }
										</td>
										<td className="py-2">
											<span
												className={ `inline-block px-2 py-0.5 rounded text-xs uppercase ${ STATUS_BADGE(
													display
												) }` }
											>
												{ display }
											</span>
										</td>
										<td className="py-2 text-se-subtitle font-mono text-xs whitespace-nowrap">
											{ s.last_status_check
												? moment
														.utc( s.last_status_check )
														.local()
														.format( 'YYYY-MM-DD HH:mm' )
												: '—' }
										</td>
										<td className="py-2 text-right">
											<div className="flex justify-end gap-1">
												<Button
													label={ __( 'Track', 'storeengine' ) }
													size="sm"
													preset="gray"
													onClick={ () => onTrack( s.id ) }
												/>
												{ ! [ 'delivered', 'cancelled' ].includes(
													display
												) && (
													<Button
														label={ __( 'Cancel', 'storeengine' ) }
														size="sm"
														preset="error"
														onClick={ () => onCancel( s.id ) }
													/>
												) }
											</div>
										</td>
									</tr>
								);
							} ) }
						</tbody>
					</table>
				) : null }
			</div>

			<CreateShipmentModal
				isOpen={ open }
				onRequestClose={ () => setOpen( false ) }
				initialOrderId={ orderId }
				onCreated={ () => load() }
			/>
		</div>
	);
};

export default OrderShipments;
