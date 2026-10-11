import PropTypes from 'prop-types';
import React from 'react';
import { Spinner } from '@wordpress/components';
import './preloader.scss';

const propTypes = {
	size: PropTypes.string,
};

export default function Preloader( { size = 'md' } ) {
	return (
		<div
			className={ `storeengine-preloader storeengine-preloader--${ size }` }
		>
			<Spinner />
		</div>
	);
}

Preloader.propTypes = propTypes;
