import React, { useCallback, useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import TopBar from '@Components/TopBar';
import {
	Scope,
	Card,
	Button,
	Table,
	THead,
	TH,
	TR,
	TD,
	cx,
} from '@Components/ui';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import CustomTableMessage from '@Components/Oops/CustomTableMessage';
import Preloader from '@Components/Loader/Preloader';
import ReactModalFormik from '@Components/Modal/ReactModalFormik';
import VendorPayoutModalInner from './VendorPayoutModalInner';

import './styles.scss';

const STATUSES = [
	{ key: '', label: __( 'All', 'storeengine' ) },
	{ key: 'pending', label: __( 'Pending', 'storeengine' ) },
	{ key: 'approved', label: __( 'Approved', 'storeengine' ) },
	{ key: 'paid', label: __( 'Paid', 'storeengine' ) },
	{ key: 'rejected', label: __( 'Rejected', 'storeengine' ) },
];

const TAB_BASE =
	'bg-transparent border-0 border-b-2 border-solid px-4 py-2.5 text-sm cursor-pointer inline-flex items-center';
const TAB_ACTIVE = 'text-se-text border-se-primary font-semibold';
const TAB_IDLE = 'text-se-subtitle border-transparent';
const TAB_COUNT =
	'bg-se-bg text-se-subtitle px-2 py-0.5 rounded-full text-xs font-medium ml-2';

const STATUS_PILL_BASE =
	'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize';
const STATUS_PILL = {
	approved: 'bg-se-success-light text-se-success',
	paid: 'bg-se-success-light text-se-success',
	pending: 'bg-se-warning-light text-se-warning',
	rejected: 'bg-se-error-light text-se-error',
};

export default function VendorWithdrawals() {
	const dispatch = useDispatch();
	const [ status, setStatus ] = useState( 'pending' );
	const [ items, setItems ] = useState( [] );
	const [ counts, setCounts ] = useState( {
		'': 0,
		pending: 0,
		approved: 0,
		paid: 0,
		rejected: 0,
	} );
	const [ loading, setLoading ] = useState( true );
	const [ working, setWorking ] = useState( {} );

	// Admin-initiated custom payout modal.
	const [ payoutOpen, setPayoutOpen ] = useState( false );

	const load = useCallback( async () => {
		setLoading( true );
		try {
			const res = await API.get( `${ namespace }withdrawals`, {
				params: { status, per_page: 50 },
			} );
			setItems( res?.data?.items ?? [] );
			const totals = await Promise.all(
				STATUSES.map( async ( s ) => {
					if ( s.key === status ) {
						return [ s.key, res?.data?.total ?? 0 ];
					}

					const countRes = await API.get(
						`${ namespace }withdrawals`,
						{
							params: {
								status: s.key,
								page: 1,
								per_page: 1,
							},
						}
					);

					return [ s.key, countRes?.data?.total ?? 0 ];
				} )
			);
			setCounts( Object.fromEntries( totals ) );
		} catch ( e ) {
			dispatch(
				showNotification( {
					message:
						e?.response?.data?.message ??
						__( 'Failed to load withdrawals.', 'storeengine' ),
					type: 'error',
					isShow: true,
				} )
			);
		} finally {
			setLoading( false );
		}
	}, [ status ] );

	useEffect( () => {
		load();
	}, [ load ] );

	const update = async ( id, nextStatus ) => {
		const note =
			nextStatus === 'rejected'
				? window.prompt( __( 'Optional admin note', 'storeengine' ), '' )
				: '';
		setWorking( ( w ) => ( { ...w, [ id ]: nextStatus } ) );
		try {
			await API.post( `${ namespace }withdrawals/${ id }`, {
				status: nextStatus,
				admin_note: note || '',
			} );
			dispatch(
				showNotification( {
					message: __( 'Withdrawal updated.', 'storeengine' ),
					type: 'success',
					isShow: true,
				} )
			);
			load();
		} catch ( e ) {
			dispatch(
				showNotification( {
					message:
						e?.response?.data?.message ??
						__( 'Update failed.', 'storeengine' ),
					type: 'error',
					isShow: true,
				} )
			);
		} finally {
			setWorking( ( w ) => {
				const { [ id ]: _drop, ...rest } = w;
				return rest;
			} );
		}
	};

	const onSubmitPayout = ( values, actions ) => {
		const amount = parseFloat( values.payout_amount );
		const balance = parseFloat( values.vendor_balance );

		if ( ! values.vendor_id ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __( 'Please select a vendor.', 'storeengine' ),
					type: 'error',
					isShow: true,
				} )
			);
			return;
		}
		if ( ! isFinite( amount ) || amount <= 0 ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __(
						'Enter an amount greater than zero.',
						'storeengine'
					),
					type: 'error',
					isShow: true,
				} )
			);
			return;
		}
		if ( isFinite( balance ) && amount > balance ) {
			actions.setSubmitting( false );
			dispatch(
				showNotification( {
					message: __(
						'Amount exceeds the vendor’s available balance.',
						'storeengine'
					),
					type: 'error',
					isShow: true,
				} )
			);
			return;
		}

		API.post( `${ namespace }withdrawals/pay`, {
			vendor_id: parseInt( values.vendor_id, 10 ),
			amount,
			admin_note: values.admin_note || '',
		} )
			.then( () => {
				dispatch(
					showNotification( {
						message: __( 'Payout recorded.', 'storeengine' ),
						type: 'success',
						isShow: true,
					} )
				);
				setPayoutOpen( false );
				load();
			} )
			.catch( ( e ) =>
				dispatch(
					showNotification( {
						message:
							e?.response?.data?.message ??
							__( 'Payout failed.', 'storeengine' ),
						type: 'error',
						isShow: true,
					} )
				)
			)
			.finally( () => actions.setSubmitting( false ) );
	};

	const fmt = ( n ) => Number( n || 0 ).toFixed( 2 );

	return (
		<Scope>
			<TopBar
				title={ __( 'Vendor Withdrawals', 'storeengine' ) }
				render={ () => (
					<Button
						preset="primary"
						type="button"
						onClick={ () => setPayoutOpen( true ) }
					>
						{ __( 'Add Payout', 'storeengine' ) }
					</Button>
				) }
			/>

			<div className="storeengine-page-content">
				<Card>
					<div className="flex gap-1 mb-3 border-0 border-b border-solid border-se-border">
						{ STATUSES.map( ( s ) => (
							<button
								key={ s.key || 'all' }
								type="button"
								className={ cx(
									TAB_BASE,
									s.key === status ? TAB_ACTIVE : TAB_IDLE
								) }
								onClick={ () => {
									setStatus( s.key );
								} }
							>
								{ s.label }
								<span className={ TAB_COUNT }>
									{ counts?.[ s.key ] ?? 0 }
								</span>
							</button>
						) ) }
					</div>

					<Table>
						<THead>
							<TR className="border-none">
								<TH>{ __( 'Vendor', 'storeengine' ) }</TH>
								<TH className="text-center">{ __( 'Amount', 'storeengine' ) }</TH>
								<TH className="text-center">{ __( 'Method', 'storeengine' ) }</TH>
								<TH className="text-center">{ __( 'Details', 'storeengine' ) }</TH>
								<TH className="text-center">{ __( 'Status', 'storeengine' ) }</TH>
								<TH className="text-center">{ __( 'Requested', 'storeengine' ) }</TH>
								<TH className="text-center">{ __( 'Actions', 'storeengine' ) }</TH>
							</TR>
						</THead>
						<tbody>
							{ loading && (
								<TR>
									<TD colSpan={ 7 } className="text-se-subtitle">
										<Preloader />
									</TD>
								</TR>
							) }
							{ ! loading && items.length === 0 && (
								<TR>
									<TD colSpan={ 7 } className="text-se-subtitle">
										<CustomTableMessage title={ __( 'No withdrawal requests in this status.', 'storeengine' ) } />
									</TD>
								</TR>
							) }
							{ items.map( ( w ) => {
								const busy = !! working[ w.id ];
								return (
									<TR key={ w.id } className="hover:bg-se-bg">
										<TD>
											<strong>{ w.display_name || w.user_login }</strong>
											<br />
											<small>{ w.user_email }</small>
										</TD>
										<TD className="text-center">{ fmt( w.amount ) }</TD>
										<TD className="text-center">{ w.payment_method }</TD>
										<TD className="text-center">
											<pre className="m-0 text-[11px] bg-se-bg p-1.5 rounded-se max-w-[240px] overflow-auto">
												{ JSON.stringify( w.payment_data ?? {}, null, 2 ) }
											</pre>
											{ w.vendor_note && (
												<small>
													<em>{ w.vendor_note }</em>
												</small>
											) }
										</TD>
										<TD className="text-center">
											<span
												className={ cx(
													STATUS_PILL_BASE,
													STATUS_PILL[ w.status ] ||
														'bg-se-bg text-se-subtitle'
												) }
											>
												{ w.status }
											</span>
											{ w.admin_note && (
												<>
													<br />
													<small>
														{ w.admin_note }
													</small>
												</>
											) }
										</TD>
										<TD className="text-center whitespace-nowrap">{ w.requested_at }</TD>
										<TD className="text-center">
											<div className="flex items-center justify-center gap-1.5 flex-wrap">
												{ w.status === 'pending' && (
													<>
														<Button
															preset="primary"
															size="sm"
															disabled={ busy }
															onClick={ () =>
																update(
																	w.id,
																	'approved'
																)
															}
														>
															{ busy === 'approved'
																? __(
																		'Approving…',
																		'storeengine'
																  )
																: __(
																		'Approve',
																		'storeengine'
																  ) }
														</Button>
														<Button
															size="sm"
															preset="danger"
															disabled={ busy }
															onClick={ () =>
																update(
																	w.id,
																	'rejected'
																)
															}
														>
															{ __(
																'Reject',
																'storeengine'
															) }
														</Button>
													</>
												) }
												{ ( w.status === 'pending' ||
													w.status === 'approved' ) && (
													<Button
														preset="primary"
														size="sm"
														disabled={ busy }
														onClick={ () =>
															update( w.id, 'paid' )
														}
													>
														{ busy === 'paid'
															? __(
																	'Marking…',
																	'storeengine'
															  )
															: __(
																	'Mark paid',
																	'storeengine'
															  ) }
													</Button>
												) }
											</div>
										</TD>
									</TR>
								);
							} ) }
						</tbody>
					</Table>
				</Card>
			</div>

			<ReactModalFormik
				title={ __( 'Pay a Vendor', 'storeengine' ) }
				isOpen={ payoutOpen }
				onRequestClose={ () => setPayoutOpen( false ) }
				submitButtonLabel={ __( 'Pay Vendor', 'storeengine' ) }
				size="small"
				suffix="payouts"
				formik={ {
					enableReinitialize: true,
					initialValues: {
						vendor_id: '',
						payout_amount: '',
						admin_note: '',
						vendor_balance: '',
					},
					onSubmit: onSubmitPayout,
				} }
			>
				<VendorPayoutModalInner />
			</ReactModalFormik>
		</Scope>
	);
}
