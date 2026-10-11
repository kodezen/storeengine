import { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { ajaxurl, storeengine_nonce } from '@Utils/helper';
import {
	Scope,
	Card,
	Heading,
	Button,
	Checkbox,
	Switch,
	Select,
	Table,
	THead,
	TH,
	TR,
	TD,
} from '@Components/ui';
import ReactModal from '@Components/Modal/ReactModal';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

import './styles.scss';

const ALWAYS_ON = [
	{ key: 'catalog', label: __( 'Products & catalog', 'storeengine' ) },
	{ key: 'orders', label: __( 'Orders & customers data', 'storeengine' ) },
	{ key: 'settings', label: __( 'Settings', 'storeengine' ) },
];

const Progress = ( { pct, msg } ) => (
	<div className="mt-4">
		<div className="h-3 bg-se-primary-light rounded-full overflow-hidden w-full">
			<span
				className="block h-full bg-se-primary rounded-full transition-[width] duration-500"
				style={ { width: `${ Math.max( 0, Math.min( 100, pct ) ) }%` } }
			/>
		</div>
		<p className="mt-2 text-sm text-se-subtitle">
			{ pct }% — { msg }
		</p>
	</div>
);

export default function Backup() {
	const dispatch = useDispatch();
	const exportEs = useRef( null );
	const importEs = useRef( null );

	// Export options.
	const [ opts, setOpts ] = useState( {
		licensing: true,
		deployments: false,
		users: false,
		logs: false,
		files: false,
	} );
	const [ exporting, setExporting ] = useState( false );
	const [ exportProg, setExportProg ] = useState( { percentage: 0, message: '' } );
	const [ download, setDownload ] = useState( null );
	const [ backups, setBackups ] = useState( [] );

	// Scheduled auto-backup + retention config.
	const [ schedule, setSchedule ] = useState( null );
	const [ savingSchedule, setSavingSchedule ] = useState( false );

	// Import state.
	const [ file, setFile ] = useState( null );
	const [ inspecting, setInspecting ] = useState( false );
	const [ preview, setPreview ] = useState( null );
	const [ uploadId, setUploadId ] = useState( '' );
	const [ confirmOpen, setConfirmOpen ] = useState( false );
	const [ safety, setSafety ] = useState( true );
	const [ restoring, setRestoring ] = useState( false );
	const [ importProg, setImportProg ] = useState( { percentage: 0, message: '' } );

	const notify = ( message, type = 'error' ) =>
		dispatch( showNotification( { message, isShow: true, type } ) );

	const toggle = ( key ) => setOpts( ( p ) => ( { ...p, [ key ]: ! p[ key ] } ) );

	const post = ( action, extra = {} ) => {
		const fd = new FormData();
		fd.append( 'action', `storeengine_backup/${ action }` );
		fd.append( 'security', storeengine_nonce );
		Object.entries( extra ).forEach( ( [ k, v ] ) => fd.append( k, v ) );
		return fetch( ajaxurl, { method: 'POST', credentials: 'same-origin', body: fd } ).then( ( r ) => r.json() );
	};

	const fileDownloadUrl = ( filename ) =>
		`${ ajaxurl }?action=storeengine_backup/download&file=${ encodeURIComponent(
			filename
		) }&security=${ storeengine_nonce }`;

	const fetchBackups = async () => {
		const res = await post( 'list' );
		if ( res.success ) {
			setBackups( res.data.backups || [] );
		}
	};

	const fetchSettings = async () => {
		const res = await post( 'settings' );
		if ( res.success ) {
			setSchedule( res.data.settings );
		}
	};

	useEffect( () => {
		fetchBackups();
		fetchSettings();
	}, [] );

	const setSched = ( patch ) => setSchedule( ( s ) => ( { ...s, ...patch } ) );
	const setSchedOpt = ( key, val ) =>
		setSchedule( ( s ) => ( { ...s, opts: { ...s.opts, [ key ]: val } } ) );

	const saveSchedule = async () => {
		setSavingSchedule( true );
		const res = await post( 'save_settings', {
			settings: JSON.stringify( schedule ),
		} );
		setSavingSchedule( false );
		if ( res.success ) {
			setSchedule( res.data.settings );
			notify( __( 'Backup schedule saved.', 'storeengine' ), 'success' );
		} else {
			notify( res.data?.message || __( 'Could not save schedule.', 'storeengine' ) );
		}
	};

	const deleteBackup = async ( filename ) => {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( __( 'Delete this backup file?', 'storeengine' ) ) ) {
			return;
		}
		const res = await post( 'delete', { file: filename } );
		if ( res.success ) {
			setBackups( res.data.backups || [] );
			notify( __( 'Backup deleted.', 'storeengine' ), 'success' );
		} else {
			notify( res.data?.message || res.data || __( 'Delete failed.', 'storeengine' ) );
		}
	};

	/* ------------------------------------------------------------ Export */

	const handleExport = () => {
		setExporting( true );
		setDownload( null );
		setExportProg( { percentage: 0, message: __( 'Starting…', 'storeengine' ) } );

		const params = new URLSearchParams( {
			action: 'storeengine_backup/export_stream',
			security: storeengine_nonce,
			licensing: opts.licensing ? '1' : '0',
			deployments: opts.deployments ? '1' : '0',
			users: opts.users ? '1' : '0',
			logs: opts.logs ? '1' : '0',
			files: opts.files ? '1' : '0',
		} );

		const es = new EventSource( `${ ajaxurl }?${ params.toString() }`, {
			withCredentials: true,
		} );
		exportEs.current = es;

		es.onmessage = ( event ) => {
			let msg;
			try {
				msg = JSON.parse( event.data );
			} catch ( e ) {
				return;
			}

			if ( msg.type === 'progress' ) {
				setExportProg( {
					percentage: parseInt( msg.percent, 10 ) || 0,
					message: msg.message || '',
				} );
			} else if ( msg.type === 'complete' ) {
				es.close();
				setExporting( false );
				setExportProg( { percentage: 100, message: msg.message } );
				setDownload( { filename: msg.filename, size: msg.size } );
				fetchBackups();
				notify( __( 'Backup created.', 'storeengine' ), 'success' );
			} else if ( msg.type === 'error' ) {
				es.close();
				setExporting( false );
				notify( msg.message || __( 'Export failed.', 'storeengine' ) );
			}
		};

		es.onerror = () => {
			es.close();
			setExporting( false );
		};
	};

	/* ------------------------------------------------------------ Import */

	const handleFile = async ( e ) => {
		const picked = e.target.files?.[ 0 ];
		setFile( picked || null );
		setPreview( null );
		setUploadId( '' );
		if ( ! picked ) {
			return;
		}

		setInspecting( true );
		try {
			// 1) Upload.
			const fd = new FormData();
			fd.append( 'action', 'storeengine_backup/upload' );
			fd.append( 'security', storeengine_nonce );
			fd.append( 'file', picked );
			const upRes = await fetch( ajaxurl, {
				method: 'POST',
				credentials: 'same-origin',
				body: fd,
			} ).then( ( r ) => r.json() );

			if ( ! upRes.success ) {
				throw new Error( upRes.data?.message || upRes.data || __( 'Upload failed.', 'storeengine' ) );
			}
			const id = upRes.data.upload_id;
			setUploadId( id );

			// 2) Inspect.
			const insFd = new FormData();
			insFd.append( 'action', 'storeengine_backup/start_import' );
			insFd.append( 'security', storeengine_nonce );
			insFd.append( 'upload_id', id );
			const insRes = await fetch( ajaxurl, {
				method: 'POST',
				credentials: 'same-origin',
				body: insFd,
			} ).then( ( r ) => r.json() );

			if ( ! insRes.success ) {
				throw new Error( insRes.data?.message || insRes.data || __( 'Could not read backup.', 'storeengine' ) );
			}
			setPreview( insRes.data );
		} catch ( err ) {
			notify( err.message );
			setFile( null );
		} finally {
			setInspecting( false );
		}
	};

	const startRestore = () => {
		setConfirmOpen( false );
		setRestoring( true );
		setImportProg( { percentage: 0, message: __( 'Starting…', 'storeengine' ) } );

		const params = new URLSearchParams( {
			action: 'storeengine_backup/import_stream',
			security: storeengine_nonce,
			upload_id: uploadId,
			safety: safety ? '1' : '0',
		} );
		const es = new EventSource( `${ ajaxurl }?${ params.toString() }`, {
			withCredentials: true,
		} );
		importEs.current = es;

		es.onmessage = ( event ) => {
			let msg;
			try {
				msg = JSON.parse( event.data );
			} catch ( e ) {
				return;
			}
			if ( msg.type === 'progress' ) {
				setImportProg( {
					percentage: parseInt( msg.percent, 10 ) || 0,
					message: msg.message || '',
				} );
			} else if ( msg.type === 'complete' ) {
				es.close();
				setRestoring( false );
				setImportProg( { percentage: 100, message: msg.message } );
				const skipped = msg.result?.skipped?.length || 0;
				notify(
					skipped
						? __( 'Restore complete (some addon tables were skipped).', 'storeengine' )
						: __( 'Restore complete.', 'storeengine' ),
					'success'
				);
				setPreview( null );
				setFile( null );
				fetchBackups();
			} else if ( msg.type === 'error' ) {
				es.close();
				setRestoring( false );
				notify( msg.message || __( 'Restore failed.', 'storeengine' ) );
			}
		};
		es.onerror = () => {
			es.close();
			setRestoring( false );
		};
	};

	/* ------------------------------------------------------------ Render */

	return (
		<Scope className="flex flex-col gap-6">
			{ /* EXPORT */ }
			<Card>
				<Heading as="h2">{ __( 'Create a backup', 'storeengine' ) }</Heading>
				<p className="text-sm text-se-subtitle">
					{ __(
						'Export all StoreEngine data into a single downloadable .zip you can keep as a manual backup or restore later.',
						'storeengine'
					) }
				</p>

				<div className="flex flex-col gap-2.5 my-4">
					{ ALWAYS_ON.map( ( g ) => (
						<Checkbox
							key={ g.key }
							checked
							disabled
							label={ g.label }
						/>
					) ) }
					<Checkbox
						checked={ opts.licensing }
						onChange={ () => toggle( 'licensing' ) }
						label={ __( 'Licensing (license keys & activations)', 'storeengine' ) }
					/>
					<Checkbox
						checked={ opts.deployments }
						onChange={ () => toggle( 'deployments' ) }
						label={
							<>
								{ __( 'Deployments', 'storeengine' ) }
								<em className="text-se-subtitle">{ __( ' (version records + package files — large)', 'storeengine' ) }</em>
							</>
						}
					/>
					<Checkbox
						checked={ opts.users }
						onChange={ () => toggle( 'users' ) }
						label={
							<>
								{ __( 'WP users & customers', 'storeengine' ) }
								<em className="text-se-subtitle">{ __( ' (overwrites users on restore)', 'storeengine' ) }</em>
							</>
						}
					/>
					<Checkbox
						checked={ opts.logs }
						onChange={ () => toggle( 'logs' ) }
						label={ __( 'Logs', 'storeengine' ) }
					/>
					<Checkbox
						checked={ opts.files }
						onChange={ () => toggle( 'files' ) }
						label={
							<>
								{ __( 'Uploaded files', 'storeengine' ) }
								<em className="text-se-subtitle">{ __( ' (downloads & other uploads)', 'storeengine' ) }</em>
							</>
						}
					/>
				</div>

				{ exporting && (
					<Progress pct={ exportProg.percentage } msg={ exportProg.message } />
				) }

				{ download ? (
					<div className="flex flex-wrap items-center gap-3 mt-4">
						<Button
							as="a"
							preset="primary"
							icon="storeengine-icon--download"
							href={ fileDownloadUrl( download.filename ) }
						>
							{ __( 'Download', 'storeengine' ) } ({ download.size })
						</Button>
						<Button
							preset="outline"
							onClick={ () => setDownload( null ) }
						>
							{ __( 'Create another', 'storeengine' ) }
						</Button>
					</div>
				) : (
					<Button
						preset="primary"
						isLoading={ exporting }
						onClick={ handleExport }
					>
						{ exporting
							? __( 'Creating backup…', 'storeengine' )
							: __( 'Create Backup', 'storeengine' ) }
					</Button>
				) }
			</Card>

			{ /* SCHEDULE + RETENTION */ }
			{ schedule && (
				<Card>
					<Heading as="h2">{ __( 'Scheduled backups', 'storeengine' ) }</Heading>
					<p className="text-sm text-se-subtitle">
						{ __(
							'Automatically create a backup on a recurring schedule, and optionally prune old ones.',
							'storeengine'
						) }
					</p>

					<div className="flex items-center gap-2 my-4">
						<Switch
							checked={ !! schedule.enabled }
							onChange={ ( v ) => setSched( { enabled: v } ) }
							aria-label={ __( 'Enable automatic backups', 'storeengine' ) }
						/>
						<span className="text-sm text-se-text">
							{ __( 'Enable automatic backups', 'storeengine' ) }
						</span>
					</div>

					{ schedule.enabled && (
						<>
							<div className="max-w-xs mb-4">
								<p className="text-sm font-medium text-se-text mb-1">
									{ __( 'Frequency', 'storeengine' ) }
								</p>
								<Select
									value={ schedule.frequency }
									onChange={ ( v ) => setSched( { frequency: v } ) }
									options={ [
										{ value: 'daily', label: __( 'Daily', 'storeengine' ) },
										{ value: 'weekly', label: __( 'Weekly', 'storeengine' ) },
										{ value: 'monthly', label: __( 'Monthly', 'storeengine' ) },
									] }
								/>
							</div>

							<p className="text-sm font-medium text-se-text mb-2">
								{ __( 'Include in the scheduled backup', 'storeengine' ) }
							</p>
							<div className="flex flex-col gap-2.5 mb-4">
								<Checkbox
									checked
									disabled
									label={ __( 'Products, orders & settings (always included)', 'storeengine' ) }
								/>
								<Checkbox
									checked={ !! schedule.opts?.licensing }
									onChange={ ( v ) => setSchedOpt( 'licensing', v ) }
									label={ __( 'Licensing (license keys & activations)', 'storeengine' ) }
								/>
								<Checkbox
									checked={ !! schedule.opts?.deployments }
									onChange={ ( v ) => setSchedOpt( 'deployments', v ) }
									label={ __( 'Deployments (version records + package files — large)', 'storeengine' ) }
								/>
								<Checkbox
									checked={ !! schedule.opts?.users }
									onChange={ ( v ) => setSchedOpt( 'users', v ) }
									label={ __( 'WP users & customers', 'storeengine' ) }
								/>
								<Checkbox
									checked={ !! schedule.opts?.logs }
									onChange={ ( v ) => setSchedOpt( 'logs', v ) }
									label={ __( 'Logs', 'storeengine' ) }
								/>
								<Checkbox
									checked={ !! schedule.opts?.files }
									onChange={ ( v ) => setSchedOpt( 'files', v ) }
									label={ __( 'Uploaded files', 'storeengine' ) }
								/>
							</div>
						</>
					) }

					<div className="pt-4 mt-2 border-t border-se-border">
						<div className="flex items-center gap-2 mb-3">
							<Switch
								checked={ !! schedule.retention_enabled }
								onChange={ ( v ) => setSched( { retention_enabled: v } ) }
								aria-label={ __( 'Automatically delete old backups', 'storeengine' ) }
							/>
							<span className="text-sm text-se-text">
								{ __( 'Automatically delete old backups', 'storeengine' ) }
							</span>
						</div>
						{ schedule.retention_enabled && (
							<div className="max-w-xs">
								<p className="text-sm font-medium text-se-text mb-1">
									{ __( 'Keep the latest', 'storeengine' ) }
								</p>
								<input
									type="number"
									min={ 1 }
									className="storeengine-input"
									value={ schedule.retention_keep }
									onChange={ ( e ) =>
										setSched( {
											retention_keep: Math.max(
												1,
												parseInt( e.target.value, 10 ) || 1
											),
										} )
									}
								/>
								<p className="text-xs text-se-subtitle mt-1">
									{ __(
										'Backups beyond this count are removed after each new backup. Safety (pre-restore) backups are never auto-deleted.',
										'storeengine'
									) }
								</p>
							</div>
						) }
					</div>

					<Button
						preset="primary"
						className="mt-4"
						isLoading={ savingSchedule }
						onClick={ saveSchedule }
					>
						{ __( 'Save schedule', 'storeengine' ) }
					</Button>
				</Card>
			) }

			{ /* EXISTING BACKUPS */ }
			<Card>
				<Heading as="h2">{ __( 'Existing backups', 'storeengine' ) }</Heading>
				<p className="text-sm text-se-subtitle">
					{ __(
						'Backups are stored privately on your server (wp-content/uploads/storeengine_uploads/backups) and kept until you delete them.',
						'storeengine'
					) }
				</p>
				{ backups.length === 0 ? (
					<p className="text-sm text-se-subtitle">
						{ __( 'No backups yet.', 'storeengine' ) }
					</p>
				) : (
					<Table className="mt-4">
						<THead>
							<TR className="border-none">
								<TH>{ __( 'File', 'storeengine' ) }</TH>
								<TH>{ __( 'Created (UTC)', 'storeengine' ) }</TH>
								<TH>{ __( 'Size', 'storeengine' ) }</TH>
								<TH />
							</TR>
						</THead>
						<tbody>
							{ backups.map( ( b ) => (
								<TR key={ b.filename }>
									<TD>
										{ b.filename }
										{ b.is_safety && (
											<span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-se-primary-light text-se-primary">
												{ __( 'safety', 'storeengine' ) }
											</span>
										) }
									</TD>
									<TD className="whitespace-nowrap">{ b.created }</TD>
									<TD className="whitespace-nowrap">{ b.size }</TD>
									<TD className="whitespace-nowrap">
										<div className="flex items-center gap-2 justify-end">
											<Button
												as="a"
												preset="primary"
												size="xs"
												href={ fileDownloadUrl( b.filename ) }
											>
												{ __( 'Download', 'storeengine' ) }
											</Button>
											<Button
												preset="danger"
												size="xs"
												onClick={ () => deleteBackup( b.filename ) }
											>
												{ __( 'Delete', 'storeengine' ) }
											</Button>
										</div>
									</TD>
								</TR>
							) ) }
						</tbody>
					</Table>
				) }
			</Card>

			{ /* IMPORT */ }
			<Card>
				<Heading as="h2">{ __( 'Restore a backup', 'storeengine' ) }</Heading>
				<p className="text-sm text-se-error">
					{ __(
						'Restoring REPLACES all current StoreEngine data with the backup. A safety backup is taken automatically before restore.',
						'storeengine'
					) }
				</p>

				<input
					type="file"
					accept=".zip"
					onChange={ handleFile }
					disabled={ inspecting || restoring }
					className="mt-3 text-sm text-se-text"
				/>

				{ inspecting && (
					<p className="mt-3 text-sm text-se-subtitle">
						{ __( 'Reading backup…', 'storeengine' ) }
					</p>
				) }

				{ preview && (
					<div className="mt-4 flex flex-col gap-2 text-sm text-se-text">
						<p>
							{ __( 'From', 'storeengine' ) }: <strong>{ preview.site_url }</strong>{ ' ' }
							({ preview.plugin_version }) — { preview.generated_at }
						</p>
						<p>
							{ preview.tables?.length || 0 }{ ' ' }
							{ __( 'tables', 'storeengine' ) }
							{ preview.missing_tables?.length
								? `, ${ preview.missing_tables.length } ${ __(
										'will be skipped (addon not installed)',
										'storeengine'
								  ) }`
								: '' }
						</p>
						{ preview.prefix_mismatch && (
							<p className="text-se-error">
								{ __(
									'Different table prefix — restoring on this site will remap the prefix. URLs in settings may need a search-replace.',
									'storeengine'
								) }
							</p>
						) }

						{ restoring ? (
							<Progress pct={ importProg.percentage } msg={ importProg.message } />
						) : (
							<Button
								preset="danger"
								className="self-start"
								onClick={ () => setConfirmOpen( true ) }
							>
								{ __( 'Restore this backup', 'storeengine' ) }
							</Button>
						) }
					</div>
				) }
			</Card>

			{ confirmOpen && (
				<ReactModal
					title={ __( 'Confirm restore', 'storeengine' ) }
					isOpen={ confirmOpen }
					onRequestClose={ () => setConfirmOpen( false ) }
					size="small"
					suffix="backup-confirm"
					overlayClose
				>
					<Scope className="flex flex-col gap-4">
						<p className="text-sm text-se-error m-0">
							{ __(
								'This will permanently REPLACE all current StoreEngine data with the uploaded backup. This cannot be undone (except by restoring the safety backup).',
								'storeengine'
							) }
						</p>
						<Checkbox
							checked={ safety }
							onChange={ () => setSafety( ( s ) => ! s ) }
							label={ __( 'Create a safety backup first (recommended)', 'storeengine' ) }
						/>
						<div className="flex justify-end gap-3">
							<Button
								preset="outline"
								onClick={ () => setConfirmOpen( false ) }
							>
								{ __( 'Cancel', 'storeengine' ) }
							</Button>
							<Button
								preset="danger"
								onClick={ startRestore }
							>
								{ __( 'Restore now', 'storeengine' ) }
							</Button>
						</div>
					</Scope>
				</ReactModal>
			) }
		</Scope>
	);
}
