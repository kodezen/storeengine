import React from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';

/**
 * A small "view only" banner shown at the top of a CPT editor when the current
 * user can see the record but lacks permission to save changes. Self-contained
 * inline styles so it renders consistently regardless of the surrounding page.
 */
// Outer keeps the notice aligned with `.storeengine-page-content` (max-width +
// centered + gutter) instead of spanning full width.
const outerStyle = {
	maxWidth: '1250px',
	width: '100%',
	margin: '16px auto 0',
	padding: '0 15px',
	boxSizing: 'border-box',
};

const boxStyle = {
	display: 'flex',
	alignItems: 'center',
	gap: '8px',
	padding: '10px 14px',
	background: '#fff8e5',
	border: '1px solid #f0d68a',
	borderRadius: '8px',
	color: '#8a6d3b',
	fontSize: '13px',
	lineHeight: 1.4,
};

const ReadOnlyNotice = ( { message } ) => (
	<div style={ outerStyle }>
		<div style={ boxStyle } role="status">
			<span
				className="storeengine-icon storeengine-icon--eye"
				aria-hidden={ true }
			/>
			<span>
				{ message ||
					__(
						"View only — you don't have permission to edit this. Any changes cannot be saved.",
						'storeengine'
					) }
			</span>
		</div>
	</div>
);

ReadOnlyNotice.propTypes = {
	message: PropTypes.string,
};

export default ReadOnlyNotice;
