import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Scope, Heading, Button } from '@Components/ui';
import { makeRequest2 } from '@Utils/helper';
import './styles.scss';

/**
 * Install-only teaser for a free companion ("satellite") plugin — StoreEngine
 * Payments / StoreEngine Connectors. The concrete providers live in those
 * plugins, so when one is inactive its provider cards never render. This shows
 * the merchant what they'd unlock plus a one-click install/activate button
 * (with a manual-download fallback). It renders nothing once the plugin is
 * active — the real provider UI takes over.
 *
 * @param {Object} props
 * @param {Object} props.plugin  One entry from `StoreEngineGlobal.satellite_plugins`
 *                               ({ key, active, installed, name, download_url, items }).
 * @param {string} [props.pluginKey] Companion key ('payments'|'connectors') for the
 *                               install endpoint; falls back to `plugin.key`.
 * @param {string} [props.heading] Optional heading override.
 */
const LockIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
		<path d="M7 11V7a5 5 0 0 1 10 0v4" />
	</svg>
);

const PluginTeaser = ( { plugin, pluginKey, heading } ) => {
	const [ installing, setInstalling ] = useState( false );
	const [ error, setError ] = useState( '' );

	// Only surface while the companion plugin is inactive; the moment it's
	// active its own provider UI replaces this teaser.
	if ( ! plugin || plugin.active ) {
		return null;
	}

	const { key, name, download_url: downloadUrl, items = [], installed } = plugin;
	const installKey = pluginKey || key;

	const ctaLabel = installed
		? __( 'Activate', 'storeengine' )
		: __( 'Install & Activate', 'storeengine' );

	const onInstall = async () => {
		if ( ! installKey || installing ) {
			return;
		}
		setInstalling( true );
		setError( '' );
		try {
			await makeRequest2( 'setup/install_satellite', { plugin: installKey } );
			// Reload so the newly-active plugin's provider UI (and the removal of
			// this teaser) takes effect across the settings screen.
			window.location.reload();
		} catch ( e ) {
			setInstalling( false );
			setError(
				( e && e.message ) ||
					__(
						'Installation failed. Please download and install the plugin manually.',
						'storeengine'
					)
			);
		}
	};

	return (
		<Scope className="storeengine-content-section storeengine-content-section--plugin-teaser storeengine-mt-4">
			<div className="storeengine-plugin-teaser">
				<div className="storeengine-plugin-teaser__head">
					<span className="storeengine-plugin-teaser__lock">
						<LockIcon />
					</span>
					<div className="storeengine-plugin-teaser__intro">
						<Heading className="storeengine-plugin-teaser__title">
							{ heading ||
								// translators: %s: plugin name.
								sprintf( __( 'Unlock more with %s', 'storeengine' ), name ) }
						</Heading>
						<p className="storeengine-plugin-teaser__subtitle">
							{ installed
								? // translators: %s: plugin name.
								  sprintf(
										__(
											'The free %s plugin is installed but not active. Activate it to enable the integrations below.',
											'storeengine'
										),
										name
								  )
								: // translators: %s: plugin name.
								  sprintf(
										__(
											'Install the free %s plugin to enable the integrations below.',
											'storeengine'
										),
										name
								  ) }
						</p>
						{ error && (
							<p className="storeengine-plugin-teaser__error">
								{ error }
							</p>
						) }
					</div>
					<div className="storeengine-plugin-teaser__actions">
						<Button
							preset="primary"
							onClick={ onInstall }
							isLoading={ installing }
							disabled={ installing }
							className="storeengine-plugin-teaser__cta"
						>
							{ installing
								? __( 'Installing…', 'storeengine' )
								: ctaLabel }
						</Button>
						<a
							className="storeengine-plugin-teaser__manual"
							href={ downloadUrl }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'or download manually', 'storeengine' ) }
						</a>
					</div>
				</div>

				{ items.map( ( group, gi ) => (
					<div className="storeengine-plugin-teaser__group" key={ gi }>
						{ group.group && (
							<div className="storeengine-plugin-teaser__group-title">
								{ group.group }
							</div>
						) }
						<div className="storeengine-dashboard-addon-cards storeengine-dashboard-addon-cards--payment">
							{ ( group.list || [] ).map( ( item, ii ) => (
								<div
									className="storeengine-settings-addon-card locked"
									key={ ii }
								>
									<div className="storeengine-settings-addon-card__control">
										<span className="storeengine-settings-addon-card__lock">
											<LockIcon />
										</span>
									</div>
									<div className="storeengine-settings-addon-card__header">
										<div className="storeengine-settings-addon-card__title">
											{ item.label }
										</div>
									</div>
									<div className="storeengine-settings-addon-card__body">
										<p>{ item.details }</p>
									</div>
								</div>
							) ) }
						</div>
					</div>
				) ) }
			</div>
		</Scope>
	);
};

export default PluginTeaser;
