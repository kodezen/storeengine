import React, { useMemo, useEffect } from 'react';
import { get_route_path } from '@Utils/helper';
import { __ } from '@wordpress/i18n';
import { Link, useNavigate } from 'react-router-dom';
import { useLocationQuery } from '@Hooks';

// eslint-disable-next-line
/*global window */

const sortByPriority = ( a, b ) => ( a.priority || 0 ) - ( b.priority || 0 );

const collectAllSlugs = ( tabs ) =>
	tabs.reduce( ( acc, t ) => {
		acc.push( t.slug );
		if ( Array.isArray( t.children ) ) {
			t.children.forEach( ( c ) => acc.push( c.slug ) );
		}
		return acc;
	}, [] );

const SettingsTabs = ( { tabs, setPath, path, validSlugs, aliasMap } ) => {
	const location = useLocationQuery();
	const navigate = useNavigate();

	const computedTabs = useMemo( () => [ ...tabs ], [ tabs ] );
	// Validate against every real slug (incl. merged sub-tabs not shown in the
	// nav) so deep links / search jumps stay reachable; then alias a merged
	// sub-tab to its host page.
	const allSlugs = useMemo(
		() => validSlugs || collectAllSlugs( computedTabs ),
		[ validSlugs, computedTabs ]
	);

	useEffect( () => {
		const resolved = location.getValue( 'path', 'general', allSlugs );
		const currentPath = ( aliasMap && aliasMap[ resolved ] ) || resolved;
		// Preserve the `field` deep-link param (set by the settings search) so it
		// survives this URL normalization and ScrollToField can consume it.
		// get_route_path drops it once empty (after ScrollToField clears it).
		const field = location.getValue( 'field', null );
		navigate(
			get_route_path( {
				page: 'storeengine-settings',
				path: currentPath,
				field,
			} ),
			{ replace: true }
		);
		setPath( currentPath );
	}, [ location, allSlugs, path ] );

	const renderTabLink = ( tabItem, isChild = false ) => {
		const childSlugs = Array.isArray( tabItem?.children )
			? tabItem.children.map( ( c ) => c.slug )
			: [];
		// Container groups (no own page) navigate to their first child; page
		// groups navigate to their own slug.
		const isGroupParent = childSlugs.length > 0;
		const isOpen =
			path === tabItem?.slug || childSlugs.includes( path );
		const targetPath =
			tabItem?.isGroup && tabItem?.landing
				? tabItem.landing
				: tabItem?.slug;
		// A group header shows a light "open" state; only a leaf (top-level item
		// or a dropdown child, including the parent's own-page entry) gets the
		// solid selected fill.
		const classNames = [ 'storeengine-tab-item' ];
		if ( isChild ) {
			classNames.push( 'storeengine-tab-item--child' );
		}
		if ( tabItem?.highlight ) {
			classNames.push( 'storeengine-tab-item--highlight' );
		}
		if ( isGroupParent ) {
			if ( isOpen ) {
				classNames.push( 'storeengine-tab-item--group-open' );
			}
		} else if ( path === tabItem?.slug ) {
			classNames.push( 'storeengine-tab-item--is-active' );
		}
		return (
		<Link
			to={ get_route_path( {
				page: 'storeengine-settings',
				path: targetPath,
			} ) }
			className={ classNames.join( ' ' ) }
		>
			{ tabItem?.svgIcon ? (
				<img src={ tabItem.svgIcon } alt={ tabItem.label } />
			) : (
				<span
					className={ `storeengine-icon storeengine-icon--${ tabItem?.icon }` }
					aria-hidden={ true }
				/>
			) }
			{ tabItem?.children ? (
				<div className='storeengine-tab-item--wrap'>
					<div>
						<h3 className="storeengine-tab-item--title">
							{ tabItem?.title }
						</h3>
						{ tabItem?.subtitle && (
							<p className="storeengine-tab-item--sub-title">
								{ tabItem?.subtitle }
							</p>
						) }
					</div>
					<span
						className={ `storeengine-icon storeengine-icon--arrow-down` }
						aria-hidden={ true }
					/>
				</div>
			) : (
				<div>
					<h3 className="storeengine-tab-item--title">
						{ tabItem?.title }
					</h3>
					{ tabItem?.subtitle && (
						<p className="storeengine-tab-item--sub-title">
							{ tabItem?.subtitle }
						</p>
					) }
				</div>
			) }
		</Link>
	);
	};

	const hasChildren = ( tab ) =>
		Array.isArray( tab?.children ) && tab.children.length > 0;

	// Single-column nav: a group's children expand inline beneath it (dropdown)
	// while the group — its own page or any child — is the active path.
	return (
		<>
			{ computedTabs.sort( sortByPriority ).map( ( tabItem, tabIndex ) => {
				const childSlugs = hasChildren( tabItem )
					? tabItem.children.map( ( c ) => c.slug )
					: [];
				const isGroupOpen =
					path === tabItem?.slug || childSlugs.includes( path );

				return (
					<div
						className={ `storeengine-tab-panel-control storeengine-tab-panel__item ${
							isGroupOpen
								? 'storeengine-tab-panel__item--is-open'
								: ''
						}` }
						key={ tabIndex }
					>
						{ renderTabLink( tabItem ) }

						{ hasChildren( tabItem ) && isGroupOpen && (
							<div className="storeengine-tab-children">
								{ tabItem.children
									.slice()
									.sort( sortByPriority )
									.map( ( child, childIndex ) => (
										<div
											className="storeengine-tab-panel-control storeengine-tab-panel__item storeengine-tab-panel__item--child"
											key={ `${ tabIndex }-${ childIndex }` }
										>
											{ renderTabLink( child, true ) }
										</div>
									) ) }
							</div>
						) }
					</div>
				);
			} ) }
		</>
	);
};

export default SettingsTabs;
