import React from 'react';
import { __ } from '@wordpress/i18n';
import './styles/form-heading.scss';

export default function FormHeading( { title, subHeading } ) {
	return (
		<div className="storeengine-setup-form-step__heading">
			<h3 className="storeengine-setup-form-title">{ title }</h3>
			<span className="storeengine-setup-from-subtitle">
				{ subHeading }
			</span>
		</div>
	);
}
