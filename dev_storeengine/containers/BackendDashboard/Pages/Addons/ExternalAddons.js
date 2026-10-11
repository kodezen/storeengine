import React from 'react';
import { __ } from '@wordpress/i18n';
import { getSeGlobal } from '@Utils/helper';
import ExternalAddonCard from './ExternalAddonCard';
import { EXTERNAL_CATEGORY } from './utils';

/**
 * "Extensions & Integrations" section at the bottom of the Add-ons grid.
 *
 * Lists the external companion plugins (not bundled in StoreEngine) sourced from
 * `StoreEngineGlobal.satellite_plugins`, each rendered as an install/download
 * card. Kept as its own separated block so it never mixes with the bundled
 * addon toggles above.
 *
 * It honours the page's search / status filters. These plugins are all free, so
 * a Pro-only tier filter hides the section. Because they sit outside the
 * category taxonomy, they surface under "All", under their own "Extensions"
 * chip, or whenever the user is searching — and are hidden under any other
 * specific category. Under the "Extensions" chip this section is the sole
 * content (the bundled grid is hidden), so it renders `standalone` — without
 * the top separator it uses when sitting below the grid.
 *
 * @param {Object} props
 * @param {string} [props.search]
 * @param {string} [props.plan]
 * @param {string} [props.status]
 * @param {string} [props.category]
 */
const ExternalAddons = ( {
	search = '',
	plan = 'all',
	status = 'all',
	category = 'all',
} ) => {
	const raw = getSeGlobal( 'satellite_plugins', {} ) || {};
	const all = Object.values( raw ).filter( ( p ) => p && p.key );

	// Its own chip → this section is the only content on screen.
	const standalone = EXTERNAL_CATEGORY === category;

	// All companion plugins are free — hide when the tier filter is Pro-only.
	if ( 'pro' === plan ) {
		return null;
	}
	// Surface under "All", under the dedicated Extensions chip, or when
	// searching; hide under any other specific category.
	if ( 'all' !== category && ! standalone && ! search ) {
		return null;
	}

	const list = all.filter( ( p ) => {
		if ( search ) {
			// Match against the plugin title only, same as the bundled addon
			// grid — matching description/requires pulled in unrelated results.
			const haystack = ( p.name || '' ).toLowerCase();
			const terms = search
				.split( /[\s\-_]+/g )
				.filter( ( s ) => s.length );
			const matched = terms.length
				? terms.every( ( term ) => haystack.includes( term ) )
				: haystack.includes( search );
			if ( ! matched ) {
				return false;
			}
		}

		if ( 'active' === status && ! p.active ) {
			return false;
		}
		if ( 'inactive' === status && p.active ) {
			return false;
		}

		return true;
	} );

	if ( ! list.length ) {
		return null;
	}

	return (
		<div
			className={ `storeengine-external-addons ${
				standalone ? 'storeengine-external-addons--standalone' : ''
			}` }
		>
			<div className="storeengine-external-addons__header">
				<h3 className="storeengine-external-addons__title">
					{ __( 'Extensions & Integrations', 'storeengine' ) }
				</h3>
				<p className="storeengine-external-addons__subtitle">
					{ __(
						'Free companion plugins that extend StoreEngine. Install with one click or download manually.',
						'storeengine'
					) }
				</p>
			</div>
			<div className="storeengine-addon-cards">
				{ list.map( ( plugin ) => (
					<ExternalAddonCard key={ plugin.key } plugin={ plugin } />
				) ) }
			</div>
		</div>
	);
};

export default ExternalAddons;
