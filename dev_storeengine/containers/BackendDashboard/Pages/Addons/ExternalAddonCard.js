import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from 'react-router-dom';
import { Button } from '@Components/ui';
import { makeRequest2, get_route_path } from '@Utils/helper';

/**
 * A single external ("satellite") companion-plugin card for the Add-ons grid.
 *
 * Unlike a normal AddonCard (which toggles a bundled addon on/off), this card
 * represents a plugin that is NOT bundled in StoreEngine. Its action is
 * state-driven:
 *   - not installed → one-click "Install & Activate" + a manual download link
 *   - installed, inactive → "Activate"
 *   - active → collapses to normal: an "Active" badge plus a Manage/Docs link.
 *     (For satellites, their real provider UI takes over in Settings; for
 *     page-builder companions there is a docs link.)
 *
 * @param {Object} props
 * @param {Object} props.plugin One `StoreEngineGlobal.satellite_plugins` entry
 *                              ({ key, kind, name, details, icon, color, active,
 *                              installed, download_url, docs_url, requires,
 *                              settings }).
 */
const ExternalAddonCard = ( { plugin } ) => {
	const navigate = useNavigate();
	const [ installing, setInstalling ] = useState( false );
	const [ error, setError ] = useState( '' );

	const {
		key,
		name,
		details,
		icon,
		color,
		active,
		installed,
		download_url: downloadUrl,
		docs_url: docsUrl,
		requires,
		settings,
	} = plugin;

	const onInstall = async () => {
		if ( ! key || installing ) {
			return;
		}
		setInstalling( true );
		setError( '' );
		try {
			await makeRequest2( 'setup/install_satellite', { plugin: key } );
			// Reload so the newly-active plugin's provider UI (and this card's
			// active state) take effect across the screen.
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

	const openSettings = () => {
		if ( settings && settings.page ) {
			navigate(
				get_route_path( {
					page: settings.page,
					path: settings.path,
				} )
			);
		}
	};

	const ctaLabel = installed
		? __( 'Activate', 'storeengine' )
		: __( 'Install & Activate', 'storeengine' );

	return (
		<div
			className={ `storeengine-addon-card storeengine-addon-card--external ${
				active ? 'storeengine-addon-card--active' : ''
			}` }
		>
			<div className="storeengine-addon-card__control">
				<span
					className={ `storeengine-addon-card__ext-status ${
						active ? 'is-active' : ''
					}` }
				>
					{ active
						? __( 'Active', 'storeengine' )
						: __( 'Free', 'storeengine' ) }
				</span>
			</div>

			<div
				className="storeengine-addon-card__icon"
				style={ { color } }
			>
				{ 'string' === typeof icon && icon ? (
					<span
						className={ `storeengine-icon storeengine-icon--${ icon }` }
						aria-hidden={ true }
					/>
				) : null }
			</div>

			<div className="storeengine-addon-card__title">
				{ name }
				{ docsUrl && (
					<a
						href={ docsUrl }
						target="_blank"
						rel="noopener noreferrer"
						className="storeengine-addon-card__ext-link"
						aria-label={ sprintf(
							// translators: %s: addon name
							__( '%s documentation', 'storeengine' ),
							name
						) }
					>
						<span className="storeengine-icon storeengine-icon--go-on"></span>
					</a>
				) }
			</div>

			<p className="storeengine-addon-card__details">{ details }</p>

			<div className="storeengine-addon-card__ext-actions">
				{ error && (
					<p className="storeengine-addon-card__ext-error">
						{ error }
					</p>
				) }

				{ requires && (
					<div className="storeengine-addon-card__required-notice">
						<span className="storeengine-addon-card__required-label">
							<span
									className="storeengine-icon storeengine-icon--box storeengine-addon-card__required-icon"
									aria-hidden={ true }
								/>
							{ __( 'Requires', 'storeengine' ) }
						</span>
						<span className="storeengine-addon-card__required-list">
							<span className="storeengine-addon-card__req-pill">
								{ requires }
							</span>
						</span>
					</div>
				) }

				{ active ? (
					settings ? (
						<Button
							preset="outline"
							onClick={ openSettings }
							className="storeengine-addon-card__ext-cta"
						>
							{ __( 'Manage', 'storeengine' ) }
						</Button>
					) : null
				) : (
					<div className="storeengine-addon-card__ext-buttons">
						<Button
							preset="primary"
							onClick={ onInstall }
							isLoading={ installing }
							disabled={ installing }
							className="storeengine-addon-card__ext-cta"
						>
							{ installing
								? __( 'Installing…', 'storeengine' )
								: ctaLabel }
						</Button>
						{ ! installed && downloadUrl && (
							<a
								className="storeengine-addon-card__ext-download"
								href={ downloadUrl }
								target="_blank"
								rel="noopener noreferrer"
								title={ __( 'Download the plugin and install it manually', 'storeengine' ) }
							>
								{ __( 'Download', 'storeengine' ) }
							</a>
						) }
					</div>
				) }
			</div>
		</div>
	);
};

export default ExternalAddonCard;
