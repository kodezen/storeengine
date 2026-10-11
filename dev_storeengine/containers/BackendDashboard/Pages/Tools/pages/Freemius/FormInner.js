import { Scope, Button } from '@Components/ui';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	ajaxurl,
	getAddonActiveStatus,
	storeengine_nonce,
} from '@Utils/helper';
import axios from 'axios';
import { Select } from '@Components/ui/Select';
import Label from '@Components/Formik/Label';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import FreemiusProgressBar from './ProgressBar';
import Text from '@Components/Formik/Text';
import Number from '@Components/Formik/Number';
import FileUpload from '@Components/BulkImportModal/FileUpload';
import ProgressBar from '@Components/ProgressBar';
import ReactModal from '@Components/Modal/ReactModal';

import './styles.scss';

const FormInner = () => {
	const allAddons = useSelector( ( state ) => state.addons );
	const { values, setFieldValue } = useFormikContext();
	const eventSourceRef = useRef( null );
	const [ showProgressModal, setShowProgressModal ] = useState( false );
	const [ openImportModal, setOpenImportModal ] = useState( false );
	const [ showImportProgressModal, setShowImportProgressModal ] =
		useState( false );
	const [ productsOptions, setProductsOptions ] = useState( [] );
	const [ uploadedFile, setUploadedFile ] = useState( null );
	const isActiveAffiliateAddons = getAddonActiveStatus(
		allAddons,
		'affiliate'
	);
	const [ downloadProgress, setDownloadProgress ] = useState( {
		message: null,
		isComplete: false,
		hasError: false,
		percentage: 0,
	} );
	const dispatch = useDispatch();

	const productLoadOptions = async ( inputValue ) => {
		try {
			const formData = new FormData();
			formData.append( 'action', 'se-pro-license/available_products' );
			formData.append( 'security', storeengine_nonce );
			if ( inputValue ) {
				formData.append( 'q', inputValue );
			}
			const {
				data: { data },
			} = await axios.post( ajaxurl, formData );
			const options = ( data || [] ).map( ( item ) => ( {
				value: item.id,
				label: item.title,
				...item,
			} ) );
			if ( ! inputValue ) {
				setProductsOptions( options );
			}
			return options;
		} catch ( error ) {
			console.error( 'Error fetching product options:', error );
			return [];
		}
	};

	const handleImport = () => {
		let stackRunning = true;
		let importType = 'users';
		let importCount = 0;

		const requiredFields = [
			{ key: 'import_api_key', msg: 'Please enter your api key' },
			{
				key: 'freemius_product_id',
				msg: 'Please enter your freemius product id',
			},
			{ key: 'product_id', msg: 'Please Select a product' },
		];

		for ( const field of requiredFields ) {
			if ( ! values?.[ field.key ] ) {
				dispatch(
					showNotification( {
						message: __( field.msg, 'storeengine' ),
						isShow: true,
						type: 'error',
					} )
				);
				return;
			}
		}
		const freshUrl = `${ ajaxurl }?action=se-pro-license/import&api_key=${ values?.import_api_key }&freemius_product_id=${ values?.freemius_product_id }&product_id=${ values?.product_id }&fresh=true&security=${ storeengine_nonce }`;

		const normalUrl = `${ ajaxurl }?action=se-pro-license/import&api_key=${ values?.import_api_key }&freemius_product_id=${ values?.freemius_product_id }&product_id=${ values?.product_id }&security=${ storeengine_nonce }`;

		const startFreshImport = () => {
			setShowProgressModal( true );
			const eventSource = new EventSource( freshUrl, {
				withCredentials: true,
			} );
			eventSourceRef.current = eventSource;

			eventSource.onmessage = ( event ) => {
				const json = JSON.parse( event.data );

				if ( json.type === 'stack_progress' ) {
					importCount = json?.message || 0;
					setDownloadProgress( {
						message: __(
							`Importing ${ importType } ${ importCount }`,
							'storeengine'
						),
						isComplete: false,
					} );
				} else if ( json.type === 'completed' ) {
					stackRunning = false;
				} else if ( json.type === 'stack_progress_completed' ) {
					eventSource.close();
					startNormalImport();
				} else if ( json.type === 'stack_completed' ) {
					importType = json?.message?.next_stack || '';
					importCount = 0;
					setDownloadProgress( {
						message: __(
							`${ json?.message?.message }. Next stack: ${ importType }`,
							'storeengine'
						),
						isComplete: false,
					} );
					eventSource.close();
					startNormalImport();
				} else if ( json.type === 'error' ) {
					stackRunning = false;
					eventSource.close();
					setDownloadProgress( {
						message: __(
							'Import failed. Please retry.',
							'storeengine'
						),
						isComplete: false,
						hasError: true,
					} );
				}
			};

			eventSource.onerror = () => {
				console.warn( '⚠️ Error occurred or connection closed.' );
				eventSource.close();
				setDownloadProgress( {
					message: __(
						'Import failed. Please retry.',
						'storeengine'
					),
					isComplete: false,
					hasError: true,
				} );
				if ( stackRunning ) {
					startFreshImport();
				}
			};
		};

		const startNormalImport = () => {
			if ( ! stackRunning ) {
				setDownloadProgress( {
					message: __(
						'Successfully Freemius Imports Completed',
						'storeengine'
					),
					isComplete: true,
				} );
				return;
			}

			const eventSource = new EventSource( normalUrl, {
				withCredentials: true,
			} );
			eventSourceRef.current = eventSource;

			eventSource.onmessage = ( event ) => {
				const json = JSON.parse( event.data );

				if ( json.type === 'stack_progress' ) {
					importCount = json?.message || 0;
					setDownloadProgress( {
						message: __(
							`Importing ${ importType } ${ importCount }`,
							'storeengine'
						),
						isComplete: false,
					} );
				} else if ( json.type === 'stack_progress_completed' ) {
					eventSource.close();
					startNormalImport();
				} else if ( json.type === 'stack_completed' ) {
					importType = json?.message?.next_stack || '';
					importCount = 0;
					setDownloadProgress( {
						message: __(
							`${ json?.message?.message }. Next stack: ${ importType }`,
							'storeengine'
						),
						isComplete: false,
					} );
					eventSource.close();
					startNormalImport();
				} else if ( json.type === 'completed' ) {
					stackRunning = false;
					eventSource.close();
					setDownloadProgress( {
						message: __( `${ json.message }`, 'storeengine' ),
						isComplete: true,
					} );
				} else if ( json.type === 'error' ) {
					stackRunning = false;
					eventSource.close();
					setDownloadProgress( {
						message: __(
							'Import failed. Please retry.',
							'storeengine'
						),
						isComplete: false,
						hasError: true,
					} );
				}
			};

			eventSource.onerror = () => {
				setDownloadProgress( {
					message: __(
						'Import failed. Please retry.',
						'storeengine'
					),
					isComplete: false,
					hasError: true,
				} );
				eventSource.close();
				if ( stackRunning ) {
					startNormalImport();
				}
			};
		};
		startFreshImport();
	};

	const handleImportAffiliateUsers = async () => {
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
		formData.append( 'action', 'se-pro-license/import_csv' );
		formData.append( 'file', uploadedFile );
		formData.append( 'security', storeengine_nonce );

		try {
			const response = await fetch( ajaxurl, {
				method: 'POST',
				body: formData,
				credentials: 'include',
			} );

			const result = await response.json();
			setOpenImportModal( false );
			setShowImportProgressModal( true );

			let total = 0;
			let index = 0;

			const url = `${ ajaxurl }?action=se-pro-license/import_process&security=${ storeengine_nonce }&filename=${ encodeURIComponent(
				result?.data?.filename
			) }&type=affiliate_users`;

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
								'Affiliate Users Import Successfully Done',
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

				const chunkUrl = `${ ajaxurl }?action=se-pro-license/import_process&type=affiliate_users&filename=${ encodeURIComponent(
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

	useEffect( () => {
		if ( ! showProgressModal ) {
			setFieldValue( 'import_api_key', '' );
			setFieldValue( 'freemius_product_id', '' );
			setFieldValue( 'product_id', '' );
		}
	}, [ showProgressModal, setFieldValue ] );

	return (
		<div className="flex flex-col gap-8">
			<div>
				<div className="mb-6">
					<div className="text-sm font-medium text-se-text">
						{ __( 'Import', 'storeengine' ) }
					</div>
					<span className="text-xs text-se-subtitle">
						{ __(
							'Import data from freemius exported csv.',
							'storeengine'
						) }
					</span>
				</div>
				<Text
					title={ __( 'Freemius API key', 'storeengine' ) }
					placeholder="Enter Freemius API key"
					name="import_api_key"
				/>
				<Number
					title={ __( 'Freemius Product ID', 'storeengine' ) }
					placeholder="Enter Freemius Product ID"
					name="freemius_product_id"
				/>
				<div className="mb-6">
					<Label
						className="storeengine-title storeengine-mb-2"
						title={ __( 'Select Product', 'storeengine' ) }
						isRequired={ true }
					/>
					<Select
						defaultOptions
						loadOptions={ productLoadOptions }
						isRequired={ ! values.product_id }
						className="storeengine-select"
						value={
							productsOptions.find(
								( option ) => option.value === values.product_id
							) || null
						}
						onChange={ ( option ) =>
							setFieldValue( 'product_id', option?.id )
						}
					/>
				</div>

				<Button
					type="submit"
					preset="primary"
					onClick={ handleImport }
				>
					{ __( 'Import', 'storeengine' ) }
				</Button>
			</div>
			{ isActiveAffiliateAddons && (
				<div>
					<div className="mb-6">
						<div className="text-sm font-medium text-se-text">
							{ __( 'Import Affiliate Users', 'storeengine' ) }
						</div>
						<span className="text-xs text-se-subtitle">
							{ __(
								'Import affiliate users from freemius exported csv.',
								'storeengine'
							) }
						</span>
					</div>

					<Button
						type="submit"
						preset="primary"
						onClick={ () => setOpenImportModal( true ) }
					>
						{ __( 'Upload', 'storeengine' ) }
					</Button>
				</div>
			) }
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
					<div className="flex justify-end gap-3 mt-4">
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
							onClick={ handleImportAffiliateUsers }
						>
							{ __( 'Import', 'storeengine' ) }
						</Button>
					</div>
				</Scope>
			</ReactModal>

			<FreemiusProgressBar
				show={ showProgressModal }
				isComplete={ downloadProgress?.isComplete ?? false }
				hasError={ downloadProgress?.hasError ?? false }
				title={ __( 'Freemius Import in Progress!', 'storeengine' ) }
				progressMessage={ downloadProgress?.message }
				successTitle={ __(
					'Freemius data successfully migrated!',
					'storeengine'
				) }
				successMessage={ __(
					'Your Freemius Import is successfully done.',
					'storeengine'
				) }
				close={ () => {
					if ( eventSourceRef.current ) {
						eventSourceRef.current.close();
					}
					setShowProgressModal( false );
				} }
				onRetry={ () => {
					setDownloadProgress( {
						message: null,
						isComplete: false,
						hasError: false,
					} );
					handleImport();
				} }
			/>
			<ProgressBar
				show={ showImportProgressModal }
				progress={ downloadProgress?.percentage ?? 0 }
				isComplete={ downloadProgress?.isComplete ?? false }
				title={ __(
					'Affiliate Import Users in Progress!',
					'storeengine'
				) }
				progressMessage={ downloadProgress?.message }
				successTitle={ __(
					'Successfully Affiliate Users Import Done!',
					'storeengine'
				) }
				successMessage={ __(
					'Your Affiliate Users Import is successfully done.',
					'storeengine'
				) }
				close={ () => {
					if ( eventSourceRef.current ) {
						eventSourceRef.current.close();
					}
					setShowImportProgressModal( false );
				} }
			/>
		</div>
	);
};

export default FormInner;
