import React from 'react';
export default function Status( { value } ) {
	return (
		<>
			{ true === value ? (
				<span
					className="storeengine-icon storeengine-icon--custom-check"
					aria-hidden={ true }
				/>
			) : false === value ? (
				<span
					className="storeengine-icon storeengine-icon--close"
					aria-hidden={ true }
				/>
			) : (
				value
			) }
		</>
	);
}
