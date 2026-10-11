import React from 'react';
import PropTypes from 'prop-types';

import './styles.scss';

/**
 * Segmented tabs: a grey track with the active option raised as a white tile.
 * Meant for switching between sibling views of one page (not for navigation).
 *
 * @param {Object}   props
 * @param {Array}    props.items    [ { key, label } ]
 * @param {string}   props.value    Active key.
 * @param {Function} props.onChange Called with the chosen key.
 * @param {string}   props.ariaLabel Accessible name of the tab group.
 */
const SegmentedTabs = ( { items, value, onChange, ariaLabel } ) => (
	<div className="kzui-segmented-tabs" role="tablist" aria-label={ ariaLabel }>
		{ items.map( ( item ) => (
			<button
				key={ item.key }
				type="button"
				role="tab"
				aria-selected={ item.key === value }
				className={ `kzui-segmented-tabs__item${
					item.key === value ? ' is-active' : ''
				}` }
				onClick={ () => onChange( item.key ) }
			>
				{ item.label }
			</button>
		) ) }
	</div>
);

SegmentedTabs.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.shape( {
			key: PropTypes.string.isRequired,
			label: PropTypes.node.isRequired,
		} )
	).isRequired,
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
	ariaLabel: PropTypes.string,
};

export default SegmentedTabs;
