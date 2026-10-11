import { useState, useContext } from 'react';
import { __ } from '@wordpress/i18n';
import { plugin_root_url, ablocks_status, makeRequest2 } from '@Utils/helper';
import { Button } from '@Components/ui';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import FormikWizardContext from '../Context/FormikWizardContext';
import { useNavigate } from 'react-router-dom';

import './styles.scss';

const installPlugin = ( slug ) =>
	new Promise( ( success, error ) => {
		if ( ! window.pagenow ) {
			window.pagenow = 'storeengine_setup';
		}

		if (
			wp.updates.shouldRequestFilesystemCredentials &&
			! wp.updates.ajaxLocked
		) {
			wp.updates.requestFilesystemCredentials();
		}
		// noinspection JSCheckFunctionSignatures
		wp.updates.installPlugin( {
			slug,
			clear_destination: true,
			success,
			error,
		} );
	} );
const activatePlugin = ( slug, name, plugin ) =>
	makeRequest2( 'setup/activate_plugin', { slug, name, plugin } );

//When we will work for update then we will use this function
const updatePlugin = ( slug ) =>
	new Promise( ( success, error ) => {
		if ( ! window.pagenow ) {
			window.pagenow = 'storeengine_setup';
		}

		if (
			wp.updates.shouldRequestFilesystemCredentials &&
			! wp.updates.ajaxLocked
		) {
			wp.updates.requestFilesystemCredentials();
		}
		// noinspection JSCheckFunctionSignatures
		wp.updates.updatePlugin( { slug, success, error } );
		// wp.updates.updatePlugin encountered error "Cannot read properties of undefined (reading 'html')"
		// This happens as $message is not set (else [see updateTheme $notice)
		// @TODO extend/override wp.updates.updatePlugin
	} );

const PluginInstall = ( { pluginName = 'ablocks' } ) => {
	const { handleNext, resetForm } = useContext( FormikWizardContext );
	const dispatch = useDispatch();
	const [ installLoading, setInstallLoading ] = useState( false );
	const [ isChecked, setIsChecked ] = useState( {
		[ `${ pluginName }` ]: true,
	} );
	const navigate = useNavigate();

	const handleNextClick = async () => {
		if ( ablocks_status === 'active' ) {
			return;
		}
		if ( ablocks_status === 'not-installed' ) {
			setInstallLoading( true );

			try {
				await installPlugin( 'ablocks' );
			} catch ( e ) {
				dispatch(
					showNotification( {
						message:
							e?.errorCode ||
							__(
								'Failed to install aBlocks plugin.',
								'storeengine'
							),
						isShow: true,
						type: 'error',
					} )
				);
				setInstallLoading( false );
			}

			try {
				await activatePlugin(
					'ablocks',
					__( 'aBlocks', 'storeengine' ),
					'ablocks/ablocks.php'
				);
			} catch ( e ) {
				console.error( e );
			}
			dispatch(
				showNotification( {
					message: __(
						'aBlocks plugin installed and activated successfully.',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
			setTimeout( () => window.location.reload(), 1000 );
			return;
		}
		if ( ablocks_status === 'not-active' ) {
			setInstallLoading( true );
			try {
				await activatePlugin(
					'ablocks',
					__( 'aBlocks', 'storeengine' ),
					'ablocks/ablocks.php'
				);
				dispatch(
					showNotification( {
						message: __(
							'aBlocks plugin activated successfully.',
							'storeengine'
						),
						isShow: true,
						type: 'success',
					} )
				);
			} catch ( e ) {
				setInstallLoading( false );
				dispatch(
					showNotification( {
						message:
							e?.errorCode ||
							__(
								'Failed to activate aBlocks plugin.',
								'storeengine'
							),
						isShow: true,
						type: 'error',
					} )
				);
				console.error( e );
			}
			setTimeout( () => window.location.reload(), 1000 );
			return;
		}
		handleNext();
	};

	const isInstalledAndActive = ablocks_status === 'active';
	const btnLabel = ! isInstalledAndActive
		? __( 'Install aBlocks to Use', 'storeengine' )
		: __( 'Next', 'storeengine' );
	const nextBtnLabel = isChecked.aBlocks
		? btnLabel
		: __( 'Finish', 'storeengine' );

	return (
		<div className="storeengine-install-plugin">
			<div className="storeengine-install-plugin__ablocks-preview">
				<img
					src={ `${ plugin_root_url }assets/images/setup/ablocks-templates-preview.png` }
					alt="ablocks-templates-preview"
				/>
				<div className="storeengine-install-plugin__ablocks-preview-content">
					<div className="storeengine-install-plugin__ablocks-preview-icon storeengine-mb-4">
						<span className="storeengine-icon storeengine-icon--lock" />
					</div>
					<div className="storeengine-flex-column storeengine-flex-align-center">
						<h2>{ __( 'Unlock Theme Library', 'storeengine' ) }</h2>
						<p>
							{ __(
								'Want to use prebuilt themes? Install the aBlocks plugin to unlock the theme library.',
								'storeengine'
							) }
						</p>
						<div className="storeengine-flex-column storeengine-flex-align-center storeengine-flex-gap-16 storeengine-mt-10">
							<Button
								preset="primary"
								onClick={ handleNextClick }
								isLoading={ installLoading }
							>
								{ nextBtnLabel }
							</Button>
							<Button
								preset="outline"
								onClick={ () => {
									navigate( '/congratulation' );
								} }
							>
								{ __( 'Skip this Step', 'storeengine' ) }
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PluginInstall;
