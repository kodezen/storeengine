import { Scope, Card, Heading, Button } from '@Components/ui';
import {
	ajaxurl,
	getAddonActiveStatus,
	storeengine_nonce,
} from '@Utils/helper';
import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FileUpload from '@Components/BulkImportModal/FileUpload';

import './styles.scss';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import ProgressBar from '@Components/ProgressBar';
import ReactModal from '@Components/Modal/ReactModal';

const rcpExportOptions = [
	{
		label: __( 'Membership Levels', 'storeengine' ),
		value: 'membership_levels',
	},
	{ label: __( 'Payments', 'storeengine' ), value: 'payments' },
	{ label: __( 'Customers', 'storeengine' ), value: 'customers' },
	{ label: __( 'Memberships', 'storeengine' ), value: ' memberships' },
];

const FormInner = () => {
	const allAddons = useSelector( ( state ) => state.addons );
	const { values, setFieldValue } = useFormikContext();
	const eventSourceRef = useRef( null );
	const [ uploadedFile, setUploadedFile ] = useState( null );
	const [ exportFileName, setExportFileName ] = useState( '' );
	const [ showProgressModal, setShowProgressModal ] = useState( false );
	const [ openImportModal, setOpenImportModal ] = useState( false );
	const prevExportType = useRef( null );
	const prevImportType = useRef( null );
	const [ downloadProgress, setDownloadProgress ] = useState( {
		message: null,
		percentage: 0,
		isComplete: false,
	} );
	const dispatch = useDispatch();
	const isRcpEnabled = window.StoreEngineGlobal.csv?.rcp_activated;

	const subscriptionOption = getAddonActiveStatus( allAddons, 'subscription' )
		? [
				{
					label: __( 'Subscriptions', 'storeengine' ),
					value: 'subscriptions',
				},
		  ]
		: [];
	const accessGroupOption = getAddonActiveStatus( allAddons, 'membership' )
		? [
				{
					label: __( 'Access Groups', 'storeengine' ),
					value: 'access_groups',
				},
		  ]
		: [];

	const exportImportOptions = [
		{ label: __( 'Customers', 'storeengine' ), value: 'customers' },
		{ label: __( 'Products', 'storeengine' ), value: 'products' },
		{ label: __( 'Orders', 'storeengine' ), value: 'orders' },
		...accessGroupOption,
		...subscriptionOption,
	];

	const handleEventsStream = ( url ) => {
		eventSourceRef.current = new EventSource( url, {
			withCredentials: true,
		} );

		eventSourceRef.current.onmessage = ( event ) => {
			const message = JSON.parse( event.data );

			if ( message.type === 'filename' ) {
				setDownloadProgress( {
					message: null,
					percentage: 100,
					isComplete: true,
				} );
				setExportFileName( message.message );
			}
			if ( message.type === 'error' ) {
				dispatch(
					showNotification( {
						message: message?.message,
						isShow: true,
						type: 'error',
					} )
				);
			}

			if ( message.type === 'complete' || message.type === 'completed' ) {
				eventSourceRef.current?.close();
				dispatch(
					showNotification( {
						message: message?.message,
						isShow: true,
						type: 'success',
					} )
				);
				setDownloadProgress( {
					message: message.message,
					percentage: 100,
					isComplete: true,
				} );

				return {
					message: message.message,
					percentage: 100,
					isComplete: true,
				};
			}

			setDownloadProgress( ( prev ) => {
				if ( prev.isComplete ) {
					return prev;
				}
				if ( message.type === 'progress' || 'percentage' ) {
					return {
						...prev,
						message: `${ message.percentage }% completed`,
						percentage: parseInt( message.percentage ),
					};
				}

				return prev;
			} );
		};

		eventSourceRef.current.onerror = () => {
			eventSourceRef.current?.close();
		};
	};

	const handleExport = () => {
		const type = values.export_type;
		if ( type == '' ) {
			dispatch(
				showNotification( {
					message: __(
						'Please, select a type first!',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);
			return;
		}
		if ( type !== prevExportType.current ) {
			setDownloadProgress( {
				message: null,
				percentage: 0,
				isComplete: false,
			} );
			prevExportType.current = type;
		}
		setShowProgressModal( true );
		const url = `${ ajaxurl }?action=storeengine_csv/export&security=${ storeengine_nonce }&type=${ type }`;
		handleEventsStream( url );
	};
	const handleRcpExport = () => {
		const type = values.rcp_export_type;
		if ( type == '' ) {
			dispatch(
				showNotification( {
					message: __(
						'Please, select a type first!',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);
			return;
		}
		if ( type !== prevExportType.current ) {
			setDownloadProgress( {
				message: null,
				percentage: 0,
				isComplete: false,
			} );
			prevExportType.current = type;
		}
		setShowProgressModal( true );
		const url = `${ ajaxurl }?action=storeengine_csv/rcp_export&security=${ storeengine_nonce }&type=${ type }`;
		handleEventsStream( url );
	};

	const handleImport = async () => {
		setExportFileName( '' );
		if ( ! uploadedFile ) {
			dispatch(
				showNotification( {
					message: __( 'First upload a file', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			return;
		}

		const formData = new FormData();
		formData.append( 'action', 'storeengine_csv/import' );
		formData.append( 'security', storeengine_nonce );
		formData.append( 'file', uploadedFile );
		formData.append( 'type', values.import_type );

		try {
			const response = await fetch( ajaxurl, {
				method: 'POST',
				body: formData,
				credentials: 'include',
			} );

			const result = await response.json();
			const type = values.import_type;
			if ( ! result.success ) {
				dispatch(
					showNotification( {
						message: result.data,
						isShow: true,
						type: 'error',
					} )
				);
				return;
			}

			if ( type == '' ) {
				dispatch(
					showNotification( {
						message: __(
							'Please, select a type first!',
							'storeengine'
						),
						isShow: true,
						type: 'error',
					} )
				);
				return;
			}

			if ( type !== prevImportType.current ) {
				setDownloadProgress( {
					message: null,
					percentage: 0,
					isComplete: false,
				} );
				prevImportType.current = type;
			}
			setOpenImportModal( false );
			setShowProgressModal( true );

			let total = 0;
			let index = 0;

			const url = `${ ajaxurl }?action=storeengine_csv/import_process&security=${ storeengine_nonce }&filename=${ encodeURIComponent(
				result?.data?.filename
			) }&type=${ encodeURIComponent( type ) }`;

			const startInitialEventSource = () => {
				eventSourceRef.current = new EventSource( url, {
					withCredentials: true,
				} );

				eventSourceRef.current.onmessage = ( event ) => {
					const message = JSON.parse( event.data );
					if ( message.type === 'chunk-completed' ) {
						total = message.total;
					}

					if ( message.type === 'error' ) {
						dispatch(
							showNotification( {
								message: message?.message,
								isShow: true,
								type: 'error',
							} )
						);
					}
				};
				eventSourceRef.current.onerror = () => {
					eventSourceRef.current?.close();
					startChunkProcessing();
				};
			};
			const startChunkProcessing = () => {
				if ( index >= total ) {
					dispatch(
						showNotification( {
							message: __(
								'Import Successfully Done',
								'storeengine'
							),
							isShow: true,
							type: 'success',
						} )
					);
					setDownloadProgress( {
						message: __(
							'Import Successfully Done',
							'storeengine'
						),
						percentage: 100,
						isComplete: true,
					} );
					return;
				}

				const chunkUrl = `${ ajaxurl }?action=storeengine_csv/import_process&type=${ encodeURIComponent(
					type
				) }&filename=${ encodeURIComponent(
					result?.data?.filename
				) }&index=${ index }&security=${ storeengine_nonce }`;

				const chunkSource = new EventSource( chunkUrl, {
					withCredentials: true,
				} );

				chunkSource.onmessage = ( event ) => {
					const message = JSON.parse( event.data );
					if ( message.type === 'error' ) {
						dispatch(
							showNotification( {
								message: message?.message,
								isShow: true,
								type: 'error',
							} )
						);
					}

					if (
						message.type === 'progress' ||
						message.type === 'percentage'
					) {
						setDownloadProgress( ( prev ) => ( {
							...prev,
							message: `${ message.percentage }% completed`,
							percentage: parseInt( message.percentage ),
						} ) );
					}
				};
				chunkSource.onerror = () => {
					chunkSource.close();
					index++;
					startChunkProcessing();
				};
			};
			startInitialEventSource();
		} catch ( error ) {
			dispatch(
				showNotification( {
					message:
						error.message ||
						__( 'Unexpected error occurred.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		}
	};

	const handleOpenFileUploaderModal = () => {
		const type = values.import_type;
		if ( type == '' ) {
			dispatch(
				showNotification( {
					message: __(
						'Please, select a type first!',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);
			return;
		}
		if ( type !== prevImportType.current ) {
			setDownloadProgress( {
				message: null,
				percentage: 0,
				isComplete: false,
			} );
			prevImportType.current = type;
		}
		setOpenImportModal( true );
	};

	useEffect( () => {
		if ( ! openImportModal ) {
			setFieldValue( 'import_type', '' );
			setFieldValue( 'storeengine_import_file', '' );
			setUploadedFile( null );
		}
	}, [ openImportModal, setFieldValue, uploadedFile ] );

	const downloadUrl = `${ ajaxurl }?action=storeengine_csv/file_download&filename=${ exportFileName }&security=${ storeengine_nonce }`;
	const isDownloadFileName =
		typeof exportFileName === 'string' &&
		exportFileName.trim().endsWith( '.csv' );
	const sampleFileUrl = useMemo(
		() =>
			`${ ajaxurl }?action=storeengine_csv/download_sample_file&security=${ storeengine_nonce }&type=${ values.import_type }`,
		[ values.import_type ]
	);

	return (
		<Scope className="flex flex-col gap-6">
			<Card>
				<div className="mb-6">
					<Heading as="h5">{ __( 'Export', 'storeengine' ) }</Heading>
					<span className="text-xs text-se-subtitle">
						{ __(
							'Export your data in CSV format.',
							'storeengine'
						) }
					</span>
				</div>

				<div className="flex flex-wrap gap-4 mb-6">
					{ exportImportOptions.map( ( item, index ) => (
						<label
							key={ index }
							htmlFor={ `export-${ index }` }
							className="flex items-center gap-2 cursor-pointer text-sm text-se-text"
						>
							<Field
								id={ `export-${ index }` }
								type="radio"
								name="export_type"
								value={ item.value }
								checked={ values.export_type === item.value }
								onChange={ () =>
									setFieldValue( 'export_type', item.value )
								}
							/>
							<span>{ item.label }</span>
						</label>
					) ) }
				</div>

				<Button
					type="submit"
					preset="primary"
					onClick={ handleExport }
				>
					{ __( 'Export', 'storeengine' ) }
				</Button>
			</Card>

			<Card>
				<div className="mb-6">
					<Heading as="h5">{ __( 'Import', 'storeengine' ) }</Heading>
					<span className="text-xs text-se-subtitle">
						{ __(
							'Import your data from CSV format. You can import data from the same format you exported it in.',
							'storeengine'
						) }
					</span>
				</div>

				<div className="flex flex-wrap gap-4 mb-6">
					{ exportImportOptions.map( ( item, index ) => (
						<label
							key={ index }
							htmlFor={ `import-${ index }` }
							className="flex items-center gap-2 cursor-pointer text-sm text-se-text"
						>
							<Field
								id={ `import-${ index }` }
								type="radio"
								name="import_type"
								value={ item.value }
								checked={ values.import_type === item.value }
								onChange={ () =>
									setFieldValue( 'import_type', item.value )
								}
							/>
							<span>{ item.label }</span>
						</label>
					) ) }
				</div>
				<Button
					type="submit"
					preset="primary"
					onClick={ handleOpenFileUploaderModal }
				>
					{ __( 'Upload File', 'storeengine' ) }
				</Button>
				<ReactModal
					isOpen={ openImportModal }
					onRequestClose={ () => setOpenImportModal( false ) }
					title={ __( 'Import from CSV', 'storeengine' ) }
					suffix="import-csv"
					size="small"
				>
					<Scope>
						<div className="storeengine-import">
							<FileUpload
								setUploadFileHandler={ ( file ) =>
									setUploadedFile( file )
								}
								name="storeengine_import_file"
								icon="storeengine-icon storeengine-icon--upload"
							/>
						</div>
						<div className="flex items-center justify-between gap-3 my-4 text-sm px-5">
							<div className="flex items-center gap-2 text-se-text">
								<span className="storeengine-icon storeengine-icon--message-question"></span>
								<span> { __( 'Reference value', 'storeengine' ) }</span>
							</div>
							<a
								href={ sampleFileUrl }
								target="_blank"
								rel="noreferrer"
								className="text-se-primary"
							>
								{ __( 'Download an example .csv template', 'storeengine' ) }
							</a>
						</div>
						<div className="flex justify-end gap-3 px-5">
							<Button
								type="submit"
								preset="outline"
								onClick={ () => setOpenImportModal( false ) }
							>
								{ __( 'Cancel', 'storeengine' ) }
							</Button>
							<Button
								type="submit"
								preset="primary"
								onClick={ handleImport }
							>
								{ __( 'Import', 'storeengine' ) }
							</Button>
						</div>
					</Scope>
				</ReactModal>
			</Card>

			{ isRcpEnabled && (
				<Card>
					<div className="mb-6">
						<div className="text-sm font-medium text-se-text">
							{ __( 'Rcp Export', 'storeengine' ) }
						</div>
						<span className="text-xs text-se-subtitle">
							{ __(
								'Export your Restrict content Pro payments, memberships, membership levels, and customers in CSV(StoreEngine equivalent) format.',
								'storeengine'
							) }
						</span>
					</div>

					<div className="flex flex-wrap gap-4 mb-6">
						{ rcpExportOptions.map( ( item, index ) => (
							<label
								key={ index }
								htmlFor={ `rcp_export-${ index }` }
								className="flex items-center gap-2 cursor-pointer text-sm text-se-text"
							>
								<Field
									id={ `rcp_export-${ index }` }
									type="radio"
									name="rcp_export_type"
									value={ item.value }
									checked={
										values.rcp_export_type === item.value
									}
									onChange={ () =>
										setFieldValue(
											'rcp_export_type',
											item.value
										)
									}
								/>
								<span>{ item.label }</span>
							</label>
						) ) }
					</div>

					<Button
						type="submit"
						preset="primary"
						onClick={ handleRcpExport }
					>
						{ __( 'Rcp Export', 'storeengine' ) }
					</Button>
				</Card>
			) }

			<ProgressBar
				show={ showProgressModal }
				progress={ downloadProgress?.percentage ?? 0 }
				isComplete={ downloadProgress?.isComplete ?? false }
				title={ __( 'Export/Import in Progress!', 'storeengine' ) }
				progressMessage={ downloadProgress?.message }
				isDownload={ isDownloadFileName }
				downloadUrl={ downloadUrl }
				successTitle={ __(
					isDownloadFileName
						? 'Successfully Export Done!'
						: 'Successfully Import Done!',
					'storeengine'
				) }
				successMessage={ __(
					isDownloadFileName
						? 'Your Export is successfully done—and your file is ready to download!'
						: 'Your Import is successfully done.',
					'storeengine'
				) }
				close={ () => {
					if ( eventSourceRef.current ) {
						eventSourceRef.current.close();
					}
					setShowProgressModal( false );
				} }
			/>
		</Scope>
	);
};

export default FormInner;
