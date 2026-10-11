import React from 'react';

export default function ( { name, children, className = null } ) {
	return (
		<div
			id={ `settings-${ name }` }
			className={ `storeengine-tab-content-${ name }${
				className ? ' ' + className : ''
			}` }
		>
			{ children }
		</div>
	);
}
