import React, { useEffect, useState, useMemo } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { makeRequest2 } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import {
	Scope,
	Card,
	Heading,
	Button,
	Table,
	THead,
	TH,
	TR,
	TD,
	Switch,
} from '@Components/ui';
import Preloader from '@Components/Loader/Preloader';

const ActionScheduler = () => {
	const dispatch = useDispatch();
	const [ rows, setRows ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ selected, setSelected ] = useState( [] );
	const [ includeLogs, setIncludeLogs ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isFetching, setIsFetching ] = useState( false );
	const [ cleanupTools, setCleanupTools ] = useState( [] );
	const [ runningTool, setRunningTool ] = useState( null );

	const fetchData = async () => {
		setIsFetching( true );
		try {
			const data = await makeRequest2(
				'fetch_storeengine_scheduled_actions'
			);
			setRows( data?.rows || [] );
			setTotal( data?.total || 0 );
			setCleanupTools( data?.data_cleanup_tools || [] );
		} catch ( e ) {
			dispatch(
				showNotification( {
					message:
						e?.response?.data?.message ||
						e?.message ||
						__(
							'Failed to load scheduled actions.',
							'storeengine'
						),
					isShow: true,
					type: 'error',
				} )
			);
		}
		setIsFetching( false );
	};

	useEffect( () => {
		fetchData();
	}, [] );

	const allSelected = useMemo(
		() => rows.length > 0 && selected.length === rows.length,
		[ rows, selected ]
	);

	const toggleAll = () => {
		setSelected( allSelected ? [] : rows.map( ( r ) => r.hook ) );
	};

	const toggleRow = ( hook ) => {
		setSelected( ( prev ) =>
			prev.includes( hook )
				? prev.filter( ( h ) => h !== hook )
				: [ ...prev, hook ]
		);
	};

	const runReset = async ( hooks ) => {
		if ( ! hooks.length ) {
			dispatch(
				showNotification( {
					message: __(
						'Select at least one hook to cancel.',
						'storeengine'
					),
					isShow: true,
					type: 'warning',
				} )
			);
			return;
		}

		const confirmMsg = sprintf(
			// translators: %d: count of hooks
			__(
				'Cancel pending actions for %d selected hook(s)? This cannot be undone.',
				'storeengine'
			),
			hooks.length
		);
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( confirmMsg ) ) {
			return;
		}

		setIsLoading( true );
		try {
			const data = await makeRequest2(
				'reset_storeengine_scheduled_actions',
				{
					hooks: hooks.join( ',' ),
					include_logs: includeLogs ? '1' : '0',
				}
			);
			setRows( data?.rows || [] );
			setTotal(
				( data?.rows || [] ).reduce(
					( sum, r ) => sum + ( r.pending || 0 ),
					0
				)
			);
			setSelected( [] );
			dispatch(
				showNotification( {
					message: sprintf(
						// translators: %d: count of cancelled actions.
						__(
							'Cancelled %d scheduled action(s).',
							'storeengine'
						),
						data?.cancelled || 0
					),
					isShow: true,
					type: 'success',
				} )
			);
		} catch ( e ) {
			dispatch(
				showNotification( {
					message:
						e?.response?.data?.message ||
						e?.message ||
						__( 'Reset failed.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		}
		setIsLoading( false );
	};

	const runCleanupTool = async ( tool ) => {
		const confirmMsg =
			tool.confirm ||
			sprintf(
				// translators: %s: tool label
				__( 'Run "%s"? This cannot be undone.', 'storeengine' ),
				tool.label
			);
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( confirmMsg ) ) {
			return;
		}

		setRunningTool( tool.id );
		try {
			const data = await makeRequest2(
				'reset_storeengine_scheduled_actions',
				{ cleanup_tools: tool.id }
			);

			if ( data?.rows ) {
				setRows( data.rows );
				setTotal(
					data.rows.reduce(
						( sum, r ) => sum + ( r.pending || 0 ),
						0
					)
				);
			}

			dispatch(
				showNotification( {
					message:
						data?.tool_results?.[ tool.id ]?.message ||
						sprintf(
							// translators: %s: tool label
							__( '"%s" completed.', 'storeengine' ),
							tool.label
						),
					isShow: true,
					type: 'success',
				} )
			);
		} catch ( e ) {
			dispatch(
				showNotification( {
					message:
						e?.response?.data?.message ||
						e?.message ||
						__( 'Cleanup tool failed.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		}
		setRunningTool( null );
	};

	return (
		<Scope>
			<Card>
				<Heading>{ __( 'Action Scheduler', 'storeengine' ) }</Heading>

				<div className="flex items-start gap-2 rounded-se border border-se-primary bg-se-primary-light p-3">
					<span className="storeengine-icon storeengine-icon--info-primary text-se-primary" />
					<span className="text-sm text-se-text">
						{ __(
							'Cancel pending background jobs queued by StoreEngine. Only StoreEngine-owned hooks are listed. Cancelling subscription billing hooks may interrupt customer renewals — review carefully before cancelling.',
							'storeengine'
						) }
					</span>
				</div>

				<p className="my-3 text-sm text-se-text">
					<strong>
						{ __(
							'Total pending across StoreEngine hooks:',
							'storeengine'
						) }
					</strong>{ ' ' }
					<code>{ total.toLocaleString() }</code>
				</p>

				<div className="max-w-[900px]">
					<Table>
						<THead>
							<TR className="border-none">
								<TH className="w-9">
									<input
										type="checkbox"
										className="storeengine-input-check m-0 mt-0.5"
										checked={ allSelected }
										onChange={ toggleAll }
										aria-label={ __(
											'Select all hooks',
											'storeengine'
										) }
									/>
								</TH>
								<TH>{ __( 'Hook', 'storeengine' ) }</TH>
								<TH className="w-[120px] text-center">
									{ __( 'Pending', 'storeengine' ) }
								</TH>
								<TH className="w-[120px] text-center">
									{ __( 'Failed', 'storeengine' ) }
								</TH>
							</TR>
						</THead>
						<tbody>
							{ isFetching && (
								<TR>
									<TD colSpan={ 4 }>
										<Preloader />
									</TD>
								</TR>
							) }
							{ ! isFetching && rows.length === 0 && (
								<TR>
									<TD colSpan={ 4 } className="text-se-subtitle">
										{ __(
											'No StoreEngine hooks found.',
											'storeengine'
										) }
									</TD>
								</TR>
							) }
							{ ! isFetching &&
								rows.map( ( row ) => (
									<TR key={ row.hook }>
										<TD>
											<input
												type="checkbox"
												className="storeengine-input-check m-0"
												checked={ selected.includes(
													row.hook
												) }
												onChange={ () =>
													toggleRow( row.hook )
												}
												aria-label={ row.hook }
											/>
										</TD>
										<TD>
											<code>{ row.hook }</code>
										</TD>
										<TD className="text-center">
											{ (
												row.pending || 0
											).toLocaleString() }
										</TD>
										<TD className="text-center">
											{ ( row.failed || 0 ).toLocaleString() }
										</TD>
									</TR>
								) ) }
						</tbody>
					</Table>
				</div>

				<p className="mt-4">
					<label className="flex items-center gap-2 text-sm text-se-text cursor-pointer">
						<Switch
							checked={ includeLogs }
							onChange={ ( next ) =>
								setIncludeLogs( next )
							}
						/>
						{ __(
							'Also truncate Action Scheduler logs (wp_actionscheduler_logs).',
							'storeengine'
						) }
					</label>
				</p>

				<div className="flex gap-3 flex-wrap mt-2">
					<Button
						preset="primary"
						isLoading={ isLoading }
						onClick={ () => runReset( selected ) }
					>
						{ __( 'Cancel Selected', 'storeengine' ) }
					</Button>
					<Button
						preset="outline"
						isLoading={ isLoading }
						onClick={ () =>
							runReset( rows.map( ( r ) => r.hook ) )
						}
					>
						{ __(
							'Cancel All StoreEngine Actions',
							'storeengine'
						) }
					</Button>
					<Button preset="outline" onClick={ fetchData }>
						{ __( 'Refresh', 'storeengine' ) }
					</Button>
				</div>

				{ cleanupTools.length > 0 && (
					<div className="mt-6">
						<Heading as="h4">
							{ __( 'Data cleanup tools', 'storeengine' ) }
						</Heading>
						<p className="mt-1 mb-3 text-sm text-se-subtitle">
							{ __(
								'These tools delete addon-owned data in addition to cancelling pending jobs. Use to recover from runaway record growth.',
								'storeengine'
							) }
						</p>
						<div className="flex flex-col gap-3">
							{ cleanupTools.map( ( tool ) => (
								<div
									key={ tool.id }
									className="border border-solid border-se-border rounded-se py-3 px-3.5 flex flex-wrap gap-3 items-center justify-between"
								>
									<div className="flex-[1_1_320px]">
										<strong className="text-se-text">
											{ tool.label }
										</strong>
										{ tool.description && (
											<div className="text-xs text-se-subtitle mt-1">
												{ tool.description }
											</div>
										) }
									</div>
									<Button
										preset="outline"
										isLoading={ runningTool === tool.id }
										onClick={ () => runCleanupTool( tool ) }
									>
										{ __( 'Run', 'storeengine' ) }
									</Button>
								</div>
							) ) }
						</div>
					</div>
				) }
			</Card>
		</Scope>
	);
};

export default ActionScheduler;
