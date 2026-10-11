import React from 'react';
import { __ } from '@wordpress/i18n';
import './styles.scss';
import PropTypes from 'prop-types';

const propTypes = {
	suffix: PropTypes.string,
};

function ProTag( { suffix = 'storeengine-pro-text' } ) {
	return <span className={ suffix }>{ __( 'PRO', 'storeengine' ) }</span>;
}

ProTag.propTypes = propTypes;
export default ProTag;
