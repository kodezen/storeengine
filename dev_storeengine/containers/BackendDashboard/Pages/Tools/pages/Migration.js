import React, { useState, useEffect, useRef } from 'react';
import { Scope, Card, Heading, Button, cx } from '@Components/ui';
import { __, sprintf } from '@wordpress/i18n';
import {
	makeRequest2,
	plugin_root_url,
	ajaxurl,
	storeengine_nonce,
} from '@Utils/helper';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
//import {fetchSettings} from '@Redux/Slices/settingsSlice/settingsSlice';

const tabs = [
	{
		label: __( 'WooCommerce', 'storeengine' ),
		value: 'woocommerce',
	},
];

const TAB_BASE =
	'bg-transparent border-0 border-b-2 border-solid pb-2 text-sm cursor-pointer';
const TAB_ACTIVE = 'text-se-primary border-se-primary';
const TAB_IDLE = 'text-se-subtitle border-transparent';

const OVERLAY =
	'fixed inset-0 z-[99999] flex items-center justify-center border-0 p-0 w-full h-full bg-[rgba(3,3,3,0.44)]';

const Confirm = ( {
	show = false,
	proceed,
	icon = 'notify-warning',
	title,
	confirmation,
	confirmLabel = null,
	confirmIcon = null,
	cancelLabel = null,
	cancelIcon = null,
} ) => {
	useEffect( () => {
		const handleEsc = ( event ) => {
			if ( event.key === 'Escape' ) {
				proceed?.( false ); // call the callback
			}
		};

		if ( show ) {
			document.body.classList.add( 'storeengine-confirm--open' );
			window.addEventListener( 'keydown', handleEsc );
		}

		return () => {
			window.removeEventListener( 'keydown', handleEsc );
			document.body.classList.remove( 'storeengine-confirm--open' );
		};
	}, [ show, proceed ] );

	return (
		show && (
			<Scope
				as="dialog"
				className={ OVERLAY }
				open={ show }
				role="alertdialog"
				aria-modal={ true }
				aria-live="polite"
				aria-atomic={ true }
			>
				<div className="flex flex-col gap-6 p-5 bg-se-white rounded-se w-[480px] max-h-full overflow-y-auto text-center shadow-se-pop">
					<h3 className="flex justify-center items-center gap-1.5 m-0 text-2xl font-medium text-se-warning">
						{ icon && (
							<span
								className={ `storeengine-icon storeengine-icon--${ icon } text-se-warning` }
								aria-hidden={ true }
							/>
						) }
						<span>
							{ title ?? __( 'Warning!', 'storeengine' ) }
						</span>
					</h3>

					<div>
						<p className="text-xs text-se-subtitle m-0">
							{ confirmation ??
								__(
									'Are you sure you want to do this?',
									'storeengine'
								) }
						</p>
					</div>

					<div className="flex flex-col gap-3 justify-center items-center m-0">
						<Button
							preset="primary"
							icon={
								confirmIcon
									? `storeengine-icon--${ confirmIcon }`
									: undefined
							}
							onClick={ () => proceed?.( true ) }
							className="w-full"
						>
							{ confirmLabel ?? __( 'Confirm', 'storeengine' ) }
						</Button>
						<Button
							preset="outline"
							icon={
								cancelIcon
									? `storeengine-icon--${ cancelIcon }`
									: undefined
							}
							onClick={ () => proceed?.( false ) }
							className="w-full"
						>
							{ cancelLabel ?? __( 'Cancel', 'storeengine' ) }
						</Button>
					</div>
				</div>
			</Scope>
		)
	);
};

const ProgressBar = ( {
	show = false,
	close,
	progress = 0,
	isComplete = false,
	title,
	progressMessage,
	successTitle,
	successMessage,
} ) => {
	useEffect( () => {
		if ( show ) {
			document.body.classList.add( 'storeengine-progress-modal--open' );
			if ( progress && progress !== 100 ) {
				window.onbeforeunload = function () {
					return __( 'Process is not complete.', 'storeengine' );
				};
			}
		}

		return () => {
			document.body.classList.remove(
				'storeengine-progress-modal--open'
			);
			window.onbeforeunload = null;
		};
	}, [ show, progress ] );

	return (
		show && (
			<Scope
				as="dialog"
				className={ OVERLAY }
				open={ show }
				role="alertdialog"
				aria-modal={ true }
				aria-live="polite"
			>
				<div className="px-[60px] py-10 bg-se-white rounded-se w-[480px] min-h-[160px] text-center shadow-se-pop">
					{ isComplete === true && progress === 100 ? (
						<>
							<img
								src={
									plugin_root_url +
									'assets/images/checkmark-badge.png'
								}
								alt={ __( 'Congratulations', 'storeengine' ) }
							/>
							<p className="text-2xl font-medium text-se-text mt-4 mb-2">
								{ successTitle }
							</p>
							<p className="text-sm text-se-subtitle">
								{ successMessage }
							</p>
							<div className="flex justify-center mt-6">
								<Button
									preset="outline"
									onClick={ close }
									className="w-1/2"
								>
									{ __( 'Close', 'storeengine' ) }
								</Button>
							</div>
						</>
					) : (
						<>
							<h3 id="progressbar_title">{ title }</h3>
							<p
								id="progressbar_status"
								className="text-sm text-se-subtitle"
							>
								{ progressMessage }
							</p>
							<div className="flex items-center gap-2">
								<div
									className="h-3 bg-se-primary-light rounded-full overflow-hidden w-full"
									role="progressbar"
									aria-labelledby="progressbar_title"
									aria-describedby="progressbar_status"
									aria-busy="true"
									aria-valuenow={ progress }
									aria-valuemin={ 0 }
									aria-valuemax={ 100 }
								>
									<div
										className="h-full bg-se-primary rounded-full transition-[width] duration-500"
										style={ { width: `${ progress }%` } }
									/>
								</div>
								<p aria-hidden={ true }>{ progress }%</p>
							</div>
							<div className="flex justify-center mt-6">
								<Button
									preset="outline"
									onClick={ close }
									className="w-1/2"
								>
									{ __( 'Cancel Migration', 'storeengine' ) }
								</Button>
							</div>
						</>
					) }
				</div>
			</Scope>
		)
	);
};

const Migration = () => {
	const [ activeTab, isActiveTab ] = useState( tabs[ 0 ] );
	const [ showConfirmModal, setShowConfirmModal ] = useState( false );
	const [ showProgressModal, setShowProgressModal ] = useState( false );
	const [ migrationProgress, setMigrationProgress ] = useState( {
		migrated: 0,
		left: 0,
		message: null,
		percentage: 0,
		isComplete: false,
	} );
	const dispatch = useDispatch();
	const sseRef = useRef( null );

	const runMigration = async ( plugin_name ) => {
		try {
			await makeRequest2( 'migration-tool/check-plugin', {
				plugin_name,
			} );
			startMigration( plugin_name );
		} catch ( e ) {
			dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'error',
				} )
			);
		}
	};

	const closeSSEConnection = () => {
		if ( sseRef.current ) {
			sseRef.current.close();
			sseRef.current = null;
		}
	};

	const closeProgressModal = () => {
		setShowProgressModal( false );
		setMigrationProgress( {
			migrated: 0,
			left: 0,
			percentage: 0,
			isComplete: false,
		} );

		closeSSEConnection();
		//dispatch(fetchSettings());
	};

	const cancelMigration = () => {
		closeProgressModal();

		dispatch(
			showNotification( {
				message: __( 'Migration cancelled', 'storeengine' ),
				isShow: true,
				type: 'success',
			} )
		);
	};

	const handleMigrationComplete = async () => {
		if ( sseRef.current ) {
			sseRef.current.close();
			sseRef.current = null;
		}

		setMigrationProgress( ( prev ) => ( { ...prev, percentage: 100 } ) );

		setTimeout( () => {
			setMigrationProgress( ( prev ) => ( {
				...prev,
				isComplete: true,
				migrated: prev.migrated + prev.left,
				left: 0,
			} ) );
		}, 1000 );
	};

	const startMigration = ( plugin_name ) => {
		setShowConfirmModal( false );
		setShowProgressModal( true );

		setMigrationProgress( ( prev ) => ( {
			...prev,
			message: __( 'Preparing…', 'storeengine' ),
		} ) );

		sseRef.current = new EventSource(
			`${ ajaxurl }?security=${ storeengine_nonce }&action=storeengine/migration-tool/start-migration&plugin_name=${ plugin_name }`,
			{ withCredentials: true }
		);

		sseRef.current.onmessage = ( e ) => {
			try {
				if ( ! e?.data?.trim() ) {
					return;
				}

				const data = JSON.parse( e?.data );

				if ( 'message' === data.type ) {
					setMigrationProgress( ( prev ) => ( {
						...prev,
						message: data.message,
					} ) );
				} else if ( 'progress' === data.type ) {
					const { left = 0, migrated = 0, message = null } = data;
					const total = left + migrated;
					const percentage =
						total > 0
							? Math.round( ( migrated / total ) * 100 )
							: 0;

					setMigrationProgress( {
						migrated,
						message,
						left: total,
						percentage,
						isComplete: false,
					} );
				} else if ( 'complete' === data.type ) {
					setTimeout( handleMigrationComplete, 2000 );
				} else if ( 'end' === data.type ) {
					// Connection end by server.
					if ( data.message ) {
						dispatch(
							showNotification( {
								message: data?.message,
								isShow: true,
								type: 'info',
							} )
						);
					}
					closeProgressModal();
				} else if ( data.type === 'error' ) {
					if ( data.continue ) {
						setMigrationProgress( ( prev ) => ( {
							...prev,
							message: data?.message,
						} ) );
					} else {
						dispatch(
							showNotification( {
								message:
									data?.message ??
									__( 'Migration failed!', 'storeengine' ),
								isShow: true,
								type: 'error',
							} )
						);
						closeProgressModal();
					}
				}
			} catch ( error ) {
				closeProgressModal();
				console.error( 'Event Source error:', error );
				dispatch(
					showNotification( {
						message: error,
						isShow: true,
						type: 'error',
					} )
				);
			}
		};

		sseRef.current.onerror = ( event ) => {
			if (
				sseRef.current.readyState === EventSource.CONNECTING ||
				sseRef.current.readyState === EventSource.CLOSED
			) {
				return;
			}

			closeProgressModal();

			let message = event?.data;
			if (
				message &&
				message.includes( '{' ) &&
				message.includes( '}' ) &&
				message.includes( 'message' )
			) {
				try {
					const data = JSON.parse( message );
					message = data.message;
				} catch ( e ) {}
			}

			dispatch(
				showNotification( {
					message:
						message ||
						__(
							'Something went wrong. Please try after sometime.',
							'storeengine'
						),
					isShow: true,
					type: 'error',
				} )
			);
		};
	};

	return (
		<Scope>
			<Heading>{ __( 'Migration', 'storeengine' ) }</Heading>
			
			<div className="flex items-start gap-4 border-0 border-b border-solid border-se-border mb-6">
				{ tabs.map( ( tab ) => (
					<button
						type="button"
						key={ tab.value }
						className={ cx(
							TAB_BASE,
							activeTab.value === tab.value
								? TAB_ACTIVE
								: TAB_IDLE
						) }
						onClick={ () => isActiveTab( tab ) }
					>
						{ tab.label }
					</button>
				) ) }
			</div>

			{ activeTab && (
				<div className="flex flex-col gap-5">
					<p className="flex items-center gap-3.5 m-0 p-4 rounded-lg border border-solid border-se-primary text-base text-se-subtitle">
						<span
							className="storeengine-icon storeengine-icon--info text-lg text-se-primary"
							aria-hidden={ true }
						/>
						<span>
							{ __(
								'Before migrating, please run this migration process in a',
								'storeengine'
							) }
							<a
								href="https://www.wpbeginner.com/wp-tutorials/how-to-create-staging-environment-for-a-wordpress-site/"
								target="_blank"
								rel="noreferrer"
							>
								{ __( 'Staging site.', 'storeengine' ) }
							</a>
							<br />
							{ __(
								'The following data will be migrate to Storeengine. After migrating no date can be restored to your previous eCommerce system.',
								'storeengine'
							) }
						</span>
					</p>

					<ul className="list-disc m-0 px-5 text-se-subtitle">
						<li>
							{ __(
								'All Products (Simple & Variable products).',
								'storeengine'
							) }
						</li>
						<li>{ __( 'All Coupons Migrate.', 'storeengine' ) }</li>
						<li>
							{ __( 'All Orders and refunds.', 'storeengine' ) }
						</li>
					</ul>

					<Button
						preset="primary"
						onClick={ () => setShowConfirmModal( true ) }
						className="self-start"
					>
						{ __( 'Run Migration', 'storeengine' ) }
					</Button>
				</div>
			) }

			<Confirm
				show={ showConfirmModal }
				confirmation={ __(
					'Are you sure you want to migrate WooCommerce data to StoreEngine?',
					'storeengine'
				) }
				proceed={ ( confirmed ) => {
					if ( confirmed ) {
						// do a pre-check before starting migration.
						runMigration( activeTab.value );
					}

					setShowConfirmModal( false );
				} }
			/>

			<ProgressBar
				show={ showProgressModal }
				progress={ migrationProgress?.percentage ?? 0 }
				isComplete={ migrationProgress?.isComplete ?? false }
				title={ __( 'Migration in Progress!', 'storeengine' ) }
				progressMessage={
					migrationProgress.message ??
					sprintf(
						// translators: %1$d. Progress count, %2$d Progress left.
						__( 'Migrated %1$d out of %2$d data…', 'storeengine' ),
						migrationProgress.migrated,
						migrationProgress.left
					)
				}
				successTitle={ __(
					'Migration completed successfully!',
					'storeengine'
				) }
				successMessage={ __(
					'Your migration is successfully done—and you’re good to go now, take a moment to test it now!',
					'storeengine'
				) }
				close={ closeProgressModal }
			/>
		</Scope>
	);
};

export default Migration;
