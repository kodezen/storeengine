import React, { useState, useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import Button from '@Components/Button';
import { decodeEntities } from '@wordpress/html-entities';

import './styles.scss';

const SelectTree = ( {
	data,
	onChange,
	value = [],
	resetOnSelection = false,
} ) => {
	const [ selected, setSelected ] = useState( new Set( value ) );
	const [ keyword, setKeyword ] = useState( '' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ filteredData, setFilteredData ] = useState( data );
	const [ regionToggles, setRegionToggles ] = useState( {} );
	const [ countryToggles, setCountryToggles ] = useState( {} );
	const dropdownRef = useRef();
	const inputRef = useRef();

	const isChecked = ( id ) => selected.has( id );

	const toggleSelection = ( id ) => {
		const newSet = new Set( selected );

		if ( newSet.has( id ) ) {
			newSet.delete( id );
		} else {
			newSet.add( id );
		}

		recalculateAncestors( newSet );
		setSelected( newSet );
		onChange( [ ...newSet ] );

		if ( resetOnSelection ) {
			setKeyword( '' );
		}
	};

	const recalculateAncestors = ( newSet ) => {
		data?.forEach( ( region ) => {
			const regionValue = region.value;
			const regionCountries = region.children || [];

			let allCountriesSelected = true;
			let allStatesSelected = true;

			regionCountries.forEach( ( country ) => {
				const countryValue = country.value;
				const states = country.children || [];
				const stateIds = states.map( ( state ) => state.value );

				const allStatesOfCountrySelected =
					stateIds.length > 0
						? stateIds.every( ( id ) => newSet.has( id ) )
						: newSet.has( countryValue );

				if (
					allStatesOfCountrySelected ||
					newSet.has( countryValue )
				) {
					newSet.add( countryValue );
				} else {
					newSet.delete( countryValue );
					allCountriesSelected = false;
				}

				if ( ! allStatesOfCountrySelected ) {
					allStatesSelected = false;
				}
			} );

			if (
				( allCountriesSelected && allStatesSelected ) ||
				newSet.has( regionValue )
			) {
				newSet.add( regionValue );
			} else {
				newSet.delete( regionValue );
			}
		} );
	};

	const handleClickOutside = ( e ) => {
		if (
			dropdownRef.current &&
			! dropdownRef.current.contains( e.target )
		) {
			setIsOpen( false );
			setKeyword( '' );
		}
	};

	useEffect( () => {
		document.addEventListener( 'mousedown', handleClickOutside );
		return () =>
			document.removeEventListener( 'mousedown', handleClickOutside );
	}, [] );

	useEffect( () => {
		function filterData() {
			const filterRecursive = ( items ) => {
				return items
					?.map( ( item ) => {
						const labelMatch = item.label
							.toLowerCase()
							.includes( keyword.toLowerCase() );
						const children = item?.children
							? filterRecursive( item?.children )
							: [];

						if ( labelMatch || children?.length > 0 ) {
							return {
								...item,
								children:
									children?.length > 0 ? children : undefined,
							};
						}
						return null;
					} )
					.filter( Boolean );
			};

			return filterRecursive( data );
		}

		const filtered = filterData();
		setFilteredData( filtered );

		const newRegionToggles = {};
		const newCountryToggles = {};

		const walkAndToggle = ( items ) => {
			for ( const item of items ) {
				if ( item.value.startsWith( 'continent:' ) ) {
					newRegionToggles[ item.value ] = true;
				}
				if ( item.value.startsWith( 'country:' ) ) {
					newCountryToggles[ item.value ] = true;
				}
				if ( item.children ) {
					walkAndToggle( item.children );
				}
			}
		};

		walkAndToggle( filtered );
		setRegionToggles( newRegionToggles );
		setCountryToggles( newCountryToggles );
	}, [ keyword, data ] );

	const getLabelForId = ( id ) => {
		for ( const region of data ) {
			if ( region?.value === id ) {
				return region?.label;
			}
			for ( const country of region?.children ) {
				if ( country?.value === id ) {
					return country?.label;
				}
				for ( const state of country?.children ) {
					if ( state.value === id ) {
						return state.label;
					}
				}
			}
		}
		return id?.split( ':' ).pop();
	};

	const toggleRegion = ( regionId ) => {
		setRegionToggles( ( prev ) => ( {
			...prev,
			[ regionId ]: ! prev[ regionId ],
		} ) );
	};

	const toggleCountry = ( countryId ) => {
		setCountryToggles( ( prev ) => ( {
			...prev,
			[ countryId ]: ! prev[ countryId ],
		} ) );
	};

	const handleSearch = ( event ) => {
		if ( ! isOpen ) {
			setIsOpen( true );
		}
		setKeyword( event.target.value );
	};

	const clickHandler = () => {
		setIsOpen( true );
		if ( inputRef.current ) {
			inputRef.current.focus();
		}
	};

	return (
		<div className="storeengine-select-tree" ref={ dropdownRef }>
			<div
				className="storeengine-select-tree__control"
				onClick={ clickHandler }
			>
				{ selected.size > 0 ? (
					<div className="storeengine-select-tree__tags">
						{ [ ...selected ]?.map( ( id ) => (
							<div
								key={ id }
								className="storeengine-select-tree__tag"
							>
								{ getLabelForId( id ) }
								<Button
									type="button"
									onClick={ ( e ) => {
										e.stopPropagation();
										const newSet = new Set( selected );
										newSet.delete( id );
										const region = data?.find(
											( item ) => item.value === id
										);
										if ( region ) {
											region?.children?.forEach(
												( country ) => {
													newSet.delete(
														country?.value
													);
													country?.children?.forEach(
														( state ) =>
															newSet.delete(
																state.value
															)
													);
												}
											);
										} else {
											data?.forEach( ( region ) => {
												const country =
													region?.children?.find(
														( item ) =>
															item.value === id
													);
												if ( country ) {
													country?.children?.forEach(
														( state ) =>
															newSet.delete(
																state.value
															)
													);
												}
											} );
										}

										recalculateAncestors( newSet );
										setSelected( newSet );
										onChange( [ ...newSet ] );
									} }
									icon={
										<span className="storeengine-icon storeengine-icon--close" />
									}
									suffix="select-tree"
									preset="transparent"
								/>
							</div>
						) ) }

						<input
							ref={ inputRef }
							value={ keyword }
							onChange={ handleSearch }
						/>
					</div>
				) : (
					<input
						ref={ inputRef }
						value={ keyword }
						onChange={ handleSearch }
						placeholder={ __( 'Select…', 'storeengine' ) }
					/>
				) }
			</div>

			{ isOpen && (
				<div className="storeengine-select-tree__dropdown">
					{ filteredData?.length > 0 ? (
						filteredData?.map( ( region ) => {
							const regionStates = region?.children?.flatMap(
								( country ) =>
									country?.children?.map(
										( state ) => state.value
									)
							);
							const regionCountries = region?.children?.map(
								( country ) => country?.value
							);

							return (
								<React.Fragment key={ region?.value }>
									<div className="storeengine-select-tree__parent">
										<label>
											<input
												type="checkbox"
												checked={ isChecked(
													region?.value
												) }
												onChange={ () =>
													toggleSelection(
														region?.value,
														[
															...regionCountries,
															...regionStates,
														]
													)
												}
											/>
											{ region?.label }
										</label>

										<Button
											type="button"
											onClick={ () =>
												toggleRegion( region?.value )
											}
											icon={
												regionToggles[
													region?.value
												] ? (
													<span className="storeengine-icon storeengine-icon--arrow-up" />
												) : (
													<span className="storeengine-icon storeengine-icon--arrow-down" />
												)
											}
											suffix="select-tree"
											preset="transparent"
										/>
									</div>

									{ regionToggles[ region?.value ] && (
										<div className="storeengine-select-tree__brunch">
											{ region?.children?.map(
												( country ) => {
													const stateIds =
														country?.children?.map(
															( state ) =>
																state.value
														);

													return (
														<div
															key={
																country?.value
															}
															className=""
														>
															<div className="storeengine-select-tree__children">
																<label>
																	<input
																		type="checkbox"
																		checked={ isChecked(
																			country?.value
																		) }
																		onChange={ () =>
																			toggleSelection(
																				country?.value,
																				stateIds
																			)
																		}
																	/>
																	{ decodeEntities(
																		country?.label
																	) }
																</label>

																{ country
																	?.children
																	?.length >
																	0 && (
																	<Button
																		type="button"
																		onClick={ () =>
																			toggleCountry(
																				country?.value
																			)
																		}
																		icon={
																			countryToggles[
																				country
																					?.value
																			] ? (
																				<span className="storeengine-icon storeengine-icon--arrow-up" />
																			) : (
																				<span className="storeengine-icon storeengine-icon--arrow-down" />
																			)
																		}
																		suffix="select-tree"
																		preset="transparent"
																	/>
																) }
															</div>

															{ countryToggles[
																country?.value
															] &&
																country
																	?.children
																	?.length >
																	0 && (
																	<div className="storeengine-select-tree__children-items">
																		{ country?.children?.map(
																			(
																				state
																			) => {
																				const id =
																					state.value;

																				return (
																					<label
																						key={
																							id
																						}
																					>
																						<input
																							type="checkbox"
																							checked={ isChecked(
																								id
																							) }
																							onChange={ () =>
																								toggleSelection(
																									id
																								)
																							}
																						/>
																						{ decodeEntities(
																							state.label
																						) }
																					</label>
																				);
																			}
																		) }
																	</div>
																) }
														</div>
													);
												}
											) }
										</div>
									) }
								</React.Fragment>
							);
						} )
					) : (
						<div className="storeengine-select-tree__no-results">
							{ __( 'No results found', 'storeengine' ) }
						</div>
					) }
				</div>
			) }
		</div>
	);
};

export default SelectTree;
