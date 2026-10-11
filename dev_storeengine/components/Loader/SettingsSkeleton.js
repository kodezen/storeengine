import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Scope } from '@Components/ui';

import './settings-skeleton.scss';

/**
 * Shimmering placeholder loader for settings tabs that fetch their own data
 * (Multi Vendor, SEO, EU/UK VAT, …). Instead of a bare "Loading…" line, it
 * paints the *shape* of the tab that's about to appear so the swap to real
 * content is seamless.
 *
 * "Selection based": each tab passes a `sections` schema describing its own
 * layout, so the skeleton matches that specific tab. Row types map to the real
 * controls a settings section uses:
 *
 *   'line'         — a plain text line
 *   'field'        — a labelled input (stacked label + box)
 *   'input-inline' — a label on the left, input on the right (e.g. amounts)
 *   'toggle'       — a switch + its description
 *   'chips'        — a row of pill toggles (e.g. payment methods)
 *   'table'        — a few stacked table rows
 *
 * With no `sections`, it renders a sensible generic 3-section shape so any tab
 * can drop it in without a bespoke schema.
 */

const Bar = ( { w = '100%', h = 14, className = '' } ) => (
	<span
		className={ `storeengine-skel__bar ${ className }` }
		style={ { width: w, height: h } }
		aria-hidden="true"
	/>
);

const SkeletonRow = ( { type } ) => {
	switch ( type ) {
		case 'toggle':
			return (
				<div className="storeengine-skel__row">
					<span
						className="storeengine-skel__switch"
						aria-hidden="true"
					/>
					<Bar w="55%" />
				</div>
			);
		case 'field':
			return (
				<div className="storeengine-skel__field">
					<Bar w="40%" h={ 10 } />
					<Bar
						w="100%"
						h={ 38 }
						className="storeengine-skel__bar--input"
					/>
				</div>
			);
		case 'input-inline':
			return (
				<div className="storeengine-skel__row storeengine-skel__row--between">
					<Bar w="45%" />
					<Bar
						w="160px"
						h={ 38 }
						className="storeengine-skel__bar--input"
					/>
				</div>
			);
		case 'chips':
			return (
				<div className="storeengine-skel__row">
					{ [ 0, 1, 2 ].map( ( i ) => (
						<span
							key={ i }
							className="storeengine-skel__chip"
							aria-hidden="true"
						/>
					) ) }
				</div>
			);
		case 'table':
			return (
				<div className="storeengine-skel__table">
					{ [ 0, 1, 2 ].map( ( i ) => (
						<Bar
							key={ i }
							w="100%"
							h={ 40 }
							className="storeengine-skel__bar--row"
						/>
					) ) }
				</div>
			);
		case 'line':
		default:
			return <Bar w="80%" />;
	}
};

const SkeletonSection = ( { heading = true, rows = [ 'line' ] } ) => (
	<div
		className="storeengine-content-section storeengine-skel__section"
		aria-hidden="true"
	>
		{ heading && (
			<Bar
				w="180px"
				h={ 16 }
				className="storeengine-skel__heading"
			/>
		) }
		<div className="storeengine-skel__rows">
			{ rows.map( ( type, i ) => (
				<SkeletonRow key={ i } type={ type } />
			) ) }
		</div>
	</div>
);

const DEFAULT_SECTIONS = [
	{ rows: [ 'field', 'field' ] },
	{ rows: [ 'toggle', 'toggle' ] },
	{ rows: [ 'input-inline' ] },
];

export default function SettingsSkeleton( { sections = DEFAULT_SECTIONS } ) {
	return (
		<Scope
			as="div"
			className="storeengine-skel"
			role="status"
			aria-live="polite"
			aria-busy="true"
		>
			<span className="screen-reader-text">
				{ __( 'Loading settings…', 'storeengine' ) }
			</span>
			{ sections.map( ( section, i ) => (
				<SkeletonSection
					key={ i }
					heading={ section.heading }
					rows={ section.rows }
				/>
			) ) }
		</Scope>
	);
}

SettingsSkeleton.propTypes = {
	sections: PropTypes.arrayOf(
		PropTypes.shape( {
			heading: PropTypes.bool,
			rows: PropTypes.arrayOf( PropTypes.string ),
		} )
	),
};
