import React, { useEffect, useMemo, useRef, useState } from 'react';
import SubTopBar from '@Components/SubTopBar';
import { Scope } from '@Components/ui';
import AddonCard from './AddonCard';
import ExternalAddons from './ExternalAddons';
import CustomTableMessage from '@Components/Oops/CustomTableMessage';
import { Formik } from 'formik';
import Search from '@Components/Search';
import TopBar from '@Components/TopBar';
import GetHelp from '@Components/GetHelp';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAddons } from '@Redux/Slices/addonSlice/addonSlice';
import { useLocationQuery } from '@Hooks';
import { useNavigate } from 'react-router-dom';
import {
	get_assets_url,
	get_route_path,
	getAddonActiveStatus,
	is_pro,
	prepare_admin_route_path,
} from '@Utils/helper';
import { Select } from '@Components/ui/Select';
import FilterOption from './FilterOption.js';
import {
	addonList,
	planOptions,
	statusOptions,
	categoryOptions,
	DEFAULT_CATEGORY,
	EXTERNAL_CATEGORY,
} from './utils.js';

import './styles.scss';

const Addons = () => {
	const location = useLocationQuery();
	const navigate = useNavigate();
	const search = location
		.getValue( 'search', '' )
		.toString()
		.trim()
		.toLowerCase();
	const plan = location
		.getValue( 'plan', 'all' )
		.toString()
		.trim()
		.toLowerCase();
	const status = location
		.getValue( 'status', 'all' )
		.toString()
		.trim()
		.toLowerCase();
	const category = location
		.getValue( 'category', 'all' )
		.toString()
		.trim()
		.toLowerCase();
	const addonsSavedData = useSelector( ( state ) => state.addons );
	const dispatch = useDispatch();

	// addonsSavedData doesn't have new addon keys.
	const addonStates = useMemo( () => {
		const data = { ...addonsSavedData };
		addonList.forEach( ( { name } ) => {
			if ( undefined === data[ name ] ) {
				data[ name ] = getAddonActiveStatus( addonsSavedData, name );
			}
		} );
		return data;
	}, [ addonsSavedData ] );
	const filterAddons = ( params ) =>
		navigate( prepare_admin_route_path( 'storeengine-addons', params ) );

	// Horizontal scroll affordance for the category strip — arrow buttons that
	// appear only when there is more to scroll in that direction.
	const filterRef = useRef( null );
	const [ showLeftScroll, setShowLeftScroll ] = useState( false );
	const [ showRightScroll, setShowRightScroll ] = useState( true );

	const scrollLeft = () => {
		filterRef.current?.scrollBy( { left: -180, behavior: 'smooth' } );
	};

	const scrollRight = () => {
		filterRef.current?.scrollBy( { left: 180, behavior: 'smooth' } );
	};

	const updateScrollButtons = () => {
		const container = filterRef.current;
		if ( ! container ) {
			return;
		}
		const atStart = container.scrollLeft <= 1;
		const atEnd =
			Math.abs(
				container.scrollLeft +
					container.clientWidth -
					container.scrollWidth
			) < 2;
		setShowLeftScroll( ! atStart );
		setShowRightScroll( ! atEnd );
	};

	useEffect( () => {
		dispatch( fetchAddons() );
	}, [] );

	// When the filters/search change, the result set (and therefore the page
	// height) can shrink dramatically — e.g. searching "otp" drops ~36 cards to
	// one. If the user was scrolled down, the collapsing content strands their
	// scroll position over empty space and it looks like scrolling broke. Reset
	// to the top on every filter change so the filtered result is always in view.
	useEffect( () => {
		window.scrollTo( { top: 0 } );
	}, [ search, plan, status, category ] );

	useEffect( () => {
		const container = filterRef.current;
		if ( ! container ) {
			return undefined;
		}
		const check = () => updateScrollButtons();
		check();
		container.addEventListener( 'scroll', check );
		window.addEventListener( 'resize', check );
		const timer = setTimeout( check, 150 );
		return () => {
			container.removeEventListener( 'scroll', check );
			window.removeEventListener( 'resize', check );
			clearTimeout( timer );
		};
	}, [ category ] );

	/**
	 *
	 * @param {{[key:string]:boolean|undefined}} values
	 * @return {AddonData[]}
	 */
	const getAddonLists = ( values ) => {
		return addonList.filter( ( item ) => {
			const { label = '', name = '', is_pro } = item;
			if ( search ) {
				// Match against the addon title only — matching description/tags
				// too used to pull in unrelated addons (e.g. searching "role"
				// matched any addon whose description happened to mention it).
				const haystack = label.toLowerCase();

				// Every word the user typed must appear somewhere (AND match), so
				// "paid membership" or "content drip" narrow correctly; the whole
				// phrase is also accepted as a fallback.
				const terms = search
					.split( /[\s\-_]+/g )
					.filter( ( s ) => s.length );
				const matched = terms.length
					? terms.every( ( term ) => haystack.includes( term ) )
					: haystack.includes( search );

				if ( ! matched ) {
					return false;
				}
			}

			// Category axis — independent of the plan/status axes below.
			const addonCategory = item.category || DEFAULT_CATEGORY;
			if ( category !== 'all' && addonCategory !== category ) {
				return false;
			}

			// Plan (tier) axis.
			if ( 'free' === plan && is_pro ) {
				return false;
			}
			if ( 'pro' === plan && ! is_pro ) {
				return false;
			}

			// Status axis — independent of plan.
			if ( 'active' === status && ! values[ name ] ) {
				return false;
			}
			if ( 'inactive' === status && values[ name ] ) {
				return false;
			}

			return true;
		} );
	};

	const hasClearAll =
		search || plan !== 'all' || status !== 'all' || category !== 'all';

	return (
		<Scope>
			<TopBar
				title={ __( 'Add-ons', 'storeengine' ) }
				render={ () => <GetHelp filterText={ [ 'addon' ] } /> }
			/>
			<div className="storeengine-page-content">
				{!is_pro ? (
					<div className="storeengine-addon-page-banner">
						<span
							className="storeengine-addon-page-banner__bg"
							style={ {
								backgroundImage: `url(${ get_assets_url(
									'images/addon_banner_bg.png'
								) })`,
							} }
							aria-hidden="true"
						/>
						<div className="storeengine-addon-page-banner__content">
							<h2 className="storeengine-addon-page-banner__title">
								{ __(
									'One Price. Every Add-On. Zero Limits.',
									'storeengine'
								) }
							</h2>
							<p className="storeengine-addon-page-banner__desc">
								{ __(
									'Unlock all 32 add-ons with a single payment — activate instantly and customize your store to do exactly what you need.',
									'storeengine'
								) }
							</p>
						</div>
						<div className="storeengine-addon-page-banner__cta">
							<span className="storeengine-addon-page-banner__count">
								<strong>{ __( '32+', 'storeengine' ) }</strong> { __( 'Addons', 'storeengine' ) }
							</span>
							<a
								className="storeengine-addon-page-banner__upgrade"
								href="https://storeengine.pro/pricing/"
								target="_blank"
								rel="noreferrer"
							>
								{ __( 'Upgrade to Pro', 'storeengine' ) }
								<span className='storeengine-icon storeengine-icon--crown'></span>
							</a>
						</div>
					</div>
				) : null}

				<div className="storeengine-content-section storeengine-content-section--addons">
					{ /* Top filter bar */ }
					<div className="storeengine-addons-topbar">
						<span className="storeengine-addons-topbar__title">
							{ __( 'Add-ons', 'storeengine' ) }
						</span>
						<div className="storeengine-addons-topbar__actions">
							{ hasClearAll && (
								<button
									className="storeengine-addons-topbar__clear"
									onClick={ () =>
										filterAddons( {
											search: '',
											plan: 'all',
											status: 'all',
											category: 'all',
										} )
									}
								>
									{ __( 'Clear All', 'storeengine' ) }
								</button>
							) }
							<div className="storeengine-addons-topbar__filter">
								<Select
									className="storeengine-select storeengine-select--addons-filter"
									classNamePrefix="storeengine-react-select"
									options={ planOptions }
									value={
										planOptions.find(
											( o ) => o.value === plan
										) || planOptions[ 0 ]
									}
									onChange={ ( opt ) =>
										filterAddons( {
											search,
											plan: opt?.value || 'all',
											status,
											category,
										} )
									}
									isSearchable={ false }
								/>
							</div>
							<div className="storeengine-addons-topbar__filter">
								<Select
									className="storeengine-select storeengine-select--addons-filter"
									classNamePrefix="storeengine-react-select"
									options={ statusOptions }
									value={
										statusOptions.find(
											( o ) => o.value === status
										) || statusOptions[ 0 ]
									}
									onChange={ ( opt ) =>
										filterAddons( {
											search,
											plan,
											status: opt?.value || 'all',
											category,
										} )
									}
									isSearchable={ false }
								/>
							</div>
							<Search
								placeholder={ __(
									'Search Add-ons',
									'storeengine'
								) }
								onSearchHandler={ ( s ) =>
									filterAddons( {
										search: s,
										plan,
										status,
										category,
									} )
								}
								defaultValue={ search }
							/>
						</div>
					</div>

					{ /* Category tabs — scrollable strip with left/right arrows */ }
					<div className="storeengine-addons-filter-controls">
						<button
							type="button"
							className={ `storeengine-addons-filter-scroll storeengine-addons-filter-scroll--left ${
								showLeftScroll ? 'visible' : ''
							}` }
							onClick={ scrollLeft }
							aria-label={ __(
								'Scroll categories left',
								'storeengine'
							) }
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M15 18l-6-6 6-6"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>

						<div
							className="storeengine-addons-tabs storeengine-addons-tabs--categories"
							ref={ filterRef }
						>
							{ categoryOptions.map( ( { title, slug }, i ) => (
								<FilterOption
									key={ i }
									title={ title }
									slug={ slug }
									isCurrent={ category === slug }
									onClick={ ( c ) =>
										filterAddons( {
											search,
											plan,
											status,
											category: c,
										} )
									}
								/>
							) ) }
							{ /* Couriers are configured under Settings → Couriers
							   (the "Courier Add-ons" list), not on this grid — so
							   this tab redirects there instead of filtering. */ }
							<FilterOption
								key="couriers-redirect"
								title={ __( 'Couriers', 'storeengine' ) }
								slug="couriers-redirect"
								isCurrent={ false }
								onClick={ () =>
									navigate(
										get_route_path( {
											page: 'storeengine-settings',
											path: 'couriers',
										} )
									)
								}
							/>
						</div>

						<button
							type="button"
							className={ `storeengine-addons-filter-scroll storeengine-addons-filter-scroll--right ${
								showRightScroll ? 'visible' : ''
							}` }
							onClick={ scrollRight }
							aria-label={ __(
								'Scroll categories right',
								'storeengine'
							) }
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M9 18l6-6-6-6"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</button>
					</div>

					{ /* Cards */ }
					<div className="storeengine-addons">
						{ /* The Extensions chip shows only the external section,
						   so the bundled toggle grid is hidden for it. */ }
						{ EXTERNAL_CATEGORY !== category && (
						<Formik
							enableReinitialize={ true }
							initialValues={ addonStates }
						>
							{ ( { setFieldValue, values } ) => {
								const addonLists = getAddonLists( values );
								return (
									<form>
										<div className="storeengine-addon-cards">
											{ addonLists.length ? (
												addonLists.map(
													( item, index ) => (
														<AddonCard
															item={ item }
															key={ index }
															index={ index }
															value={
																values[
																	item.name
																]
															}
															setFieldValue={
																setFieldValue
															}
															values={ values }
														/>
													)
												)
											) : (
												<div className="storeengine-addon-cards__empty">
													<CustomTableMessage
														title={ __(
															'No Addons Found!',
															'storeengine'
														) }
													/>
												</div>
											) }
										</div>
									</form>
								);
							} }
						</Formik>
						) }

						{ /* External / downloadable companion plugins —
						   a separated section below the bundled grid. */ }
						<ExternalAddons
							search={ search }
							plan={ plan }
							status={ status }
							category={ category }
						/>
					</div>
				</div>
			</div>
		</Scope>
	);
};

export default Addons;
