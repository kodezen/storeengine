import React from 'react';

/**
 * Small glyphs for the Inline | Side panel view switch.
 *
 * @param {Object} props
 * @param {string} props.mode 'inline' or 'panel'.
 */
const ViewModeIcon = ( { mode } ) => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
		focusable="false"
	>
		<rect x="3" y="4" width="18" height="16" rx="2.5" />
		{ 'panel' === mode ? (
			<path d="M15 4v16" />
		) : (
			<>
				<path d="M3 10h18" />
				<path d="M3 15h18" />
			</>
		) }
	</svg>
);

export default ViewModeIcon;
