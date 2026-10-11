import React from 'react';

export default function ( { className = '', label, slug, children } ) {
	const classes = [ 'storeengine-content-section' ];
	if ( slug ) {
		classes.push( 'storeengine-content-section--' + slug );
	} else {
		classes.push( 'storeengine-content-section--unknown' );
	}

	if ( className ) {
		classes.push( className );
	}

	return (
		<div className={ classes.join( ' ' ) }>
			{ label ? (
				<h2 className="storeengine-heading">{ label }</h2>
			) : null }
			<div className="storeengine-content-section-content">
				{ children }
			</div>
		</div>
	);
}
