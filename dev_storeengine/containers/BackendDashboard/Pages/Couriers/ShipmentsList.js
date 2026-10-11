import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import Button from '@Components/Button';
import { Button as PrimaryButton } from '@Components/ui';
import {
	cancelShipment,
	fetchProviders,
	fetchShipments,
	trackShipment,
} from '@Redux/Slices/couriersSlice/couriersSlice';
import CreateShipmentModal from './CreateShipmentModal';
import SubTopBar from '@Components/SubTopBar';
import CustomTableMessage from '@Components/Oops/CustomTableMessage';
import Preloader from '@Components/Loader/Preloader';

const STATUS_BADGE = ( status ) => {
	const s = ( status || '' ).toLowerCase();
	if ( s === 'delivered' ) return 'bg-se-success/10 text-se-success';
	if ( s === 'cancelled' || s === 'returned' )
		return 'bg-se-error/10 text-se-error';
	if ( s === 'created' ) return 'bg-se-bg text-se-subtitle';
	return 'bg-se-primary/10 text-se-primary';
};

const ShipmentsList = () => {
	const dispatch = useDispatch();
	const { shipments = [], shipmentsLoading, providers = [] } = useSelector(
		( s ) => s.couriers
	);
	const [ open, setOpen ] = useState( false );

	useEffect( () => {
		dispatch( fetchShipments() );
		if ( ! providers.length ) dispatch( fetchProviders() );
	}, [ dispatch ] ); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div>
			<SubTopBar heading={__( 'Shipments', 'storeengine' )}>
				{ /* Matches the "Add New Product" CTA (Products/index.js) — the
				    ui/ Button kit, not the older @Components/Button used below
				    for the per-row Track/Cancel actions. */ }
				<PrimaryButton preset="primary" onClick={ () => setOpen( true ) }>
					{ __( 'Create shipment', 'storeengine' ) }
				</PrimaryButton>
			</SubTopBar>

			<div className="bg-white border border-[var(--storeengine-border-color)] rounded overflow-x-auto p-6">
				<table className="w-full m-0">
					<thead className="bg-[#F7F7F8] text-[var(--storeengine-text-color)] tracking-wide">
						<tr>
							<th className="text-left text-[14px] font-medium leading-5 p-3">{ __( 'ID', 'storeengine' ) }</th>
							<th className="text-center text-[14px] font-medium leading-5 p-3">{ __( 'Order', 'storeengine' ) }</th>
							<th className="text-center text-[14px] font-medium leading-5 p-3">{ __( 'Provider', 'storeengine' ) }</th>
							<th className="text-center text-[14px] font-medium leading-5 p-3">{ __( 'Tracking', 'storeengine' ) }</th>
							<th className="text-center text-[14px] font-medium leading-5 p-3">{ __( 'Status', 'storeengine' ) }</th>
							<th className="text-center text-[14px] font-medium leading-5 p-3">{ __( 'Last sync', 'storeengine' ) }</th>
							<th className="text-right text-[14px] font-medium leading-5 p-3">{ __( 'Actions', 'storeengine' ) }</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-se-border">
						{ shipmentsLoading && ! shipments.length ? (
							<tr>
								<td colSpan={ 7 } className="px-3 py-3 text-se-subtitle">
									<Preloader />
								</td>
							</tr>
						) : null }
						{ ! shipmentsLoading && ! shipments.length ? (
							<tr>
								<td colSpan={ 7 } className="px-3 py-3 text-se-subtitle">
									<CustomTableMessage title={ __( 'No shipments yet', 'storeengine' ) } />
								</td>
							</tr>
						) : null }
						{ shipments.map( ( s ) => {
							const display = s.internal_status || s.status;
							return (
								<tr key={ s.id } className="hover:bg-se-bg/40 border-b border-l-0 border-r-0 border-t-0 border-solid border-[var(--storeengine-border-color)]">
									<td className="text-left text-[14px] font-medium leading-5 p-3">{ s.id }</td>
									<td className="text-center text-[14px] font-medium leading-5 p-3">#{ s.order_id }</td>
									<td className="text-center text-[14px] font-medium leading-5 p-3 capitalize">
										{ s.provider }
									</td>
									<td className="text-center text-[14px] font-medium leading-5 p-3">
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
									<td className="text-center text-[14px] font-medium leading-5 p-3">
										<span
											className={ `inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wide ${ STATUS_BADGE(
												display
											) }` }
										>
											{ display }
										</span>
										{ s.internal_status &&
										s.status &&
										s.internal_status !== s.status ? (
											<div className="font-mono text-[10px] text-se-subtitle mt-0.5">
												{ s.status }
											</div>
										) : null }
									</td>
									<td className="text-center text-[14px] font-medium leading-5 p-3 text-se-subtitle font-mono text-xs whitespace-nowrap">
										{ s.last_status_check
											? moment
													.utc( s.last_status_check )
													.local()
													.format( 'YYYY-MM-DD HH:mm' )
											: '—' }
									</td>
									<td className="text-center text-[14px] font-medium leading-5 p-3">
										<div className="flex justify-end gap-2">
											<Button
												label={ __( 'Track', 'storeengine' ) }
												size="sm"
												preset="gray"
												onClick={ () => dispatch( trackShipment( s.id ) ) }
											/>
											{ ! [ 'delivered', 'cancelled' ].includes(
												display
											) && (
												<Button
													label={ __( 'Cancel', 'storeengine' ) }
													size="sm"
													preset="error"
													onClick={ () =>
														dispatch( cancelShipment( s.id ) )
													}
												/>
											) }
										</div>
									</td>
								</tr>
							);
						} ) }
					</tbody>
				</table>
			</div>

			<CreateShipmentModal
				isOpen={ open }
				onRequestClose={ () => setOpen( false ) }
			/>
		</div>
	);
};

export default ShipmentsList;
