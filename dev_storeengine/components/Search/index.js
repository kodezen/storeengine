import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import debounce from 'just-debounce-it';
import './styles.scss';
import { __ } from '@wordpress/i18n';
import { noop } from '@Utils/helper';

const propTypes = {
	placeholder: PropTypes.string,
	defaultValue: PropTypes.string,
	onSearchHandler: PropTypes.func,
};

function Search( {
	placeholder = __( 'Search…', 'storeengine' ),
	onSearchHandler = noop,
	defaultValue = '',
} ) {
	const [ searchText, setSearchText ] = useState( '' );

	useEffect( () => {
		setSearchText( defaultValue );
	}, [ defaultValue ] );

	const debouncedAPICall = useCallback(
		debounce( ( keyword ) => {
			onSearchHandler( keyword );
		}, 1000 ),
		[ onSearchHandler ]
	);

	const searchHandler = ( searchValue ) => {
		setSearchText( searchValue );
		debouncedAPICall( searchValue );
	};

	const handleClear = () => {
		setSearchText( '' );
		onSearchHandler( '' );
	};

	return (
		<>
			<div className="storeengine-search-component">
				<span
					className="storeengine-icon storeengine-icon--search"
					aria-hidden={ true }
				/>
				<input
					id="search"
					type="text"
					className="storeengine-search-component__input"
					placeholder={ placeholder }
					value={ searchText }
					onChange={ ( e ) => searchHandler( e.target.value ) }
				/>
				{ searchText && (
					<button
						onClick={ handleClear }
						className="storeengine-search-component__control"
						aria-label={ __( 'Clear Search', 'storeengine' ) }
					>
						<span
							className="storeengine-icon storeengine-icon--trash"
							aria-hidden={ true }
						/>
					</button>
				) }
			</div>
		</>
	);
}

Search.propTypes = propTypes;

export default React.memo( Search );
