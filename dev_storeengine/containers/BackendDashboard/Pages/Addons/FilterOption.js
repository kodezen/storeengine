import React from 'react';
import classNames from 'classnames';

const FilterOption = ( { title, slug, isCurrent, onClick } ) => {
	return (
		<button
			className={ classNames( {
				'storeengine-addons-filter-option': true,
				'addons-active': isCurrent,
			} ) }
			onClick={ ( e ) => {
				e.preventDefault();
				onClick( slug );
			} }
		>
			<span>{ title }</span>
		</button>
	);
};

export default React.memo( FilterOption );
