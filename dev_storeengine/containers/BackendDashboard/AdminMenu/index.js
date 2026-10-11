import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	get_route_path,
	route_path,
	is_pro,
	hasOwnProperty,
	get_assets_url,
} from '@Utils/helper';
import { useSelector } from 'react-redux';
import MenuItem from './MenuItem';
import { useLocationQuery } from '@Hooks';
import './styles.scss';
import classNames from 'classnames';
import { createInterpolateElement } from '@wordpress/element';

const isRTL = ( str ) => {
	const ltrChars =
		'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
		'\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF';
	const rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
	const rtlDirCheck = new RegExp( '^[^' + ltrChars + ']*[' + rtlChars + ']' );

	return rtlDirCheck.test( str );
};

const AdminMenu = () => {
	const adminmenu = useSelector( ( state ) => state.adminmenu );
	const location = useLocationQuery();
	const page = location.get( 'page' );
	const path = location.get( 'path' );
	const action = location.get( 'action' );
	useEffect( () => {
		// A grouped child (Orders/Marketing/Finance/Partners) is no longer its
		// own top-level entry — it lives in a group parent's `sub_items` keyed
		// by `page`, and may itself have a nested level (grandchildren keyed by
		// `slug`). Resolve the chain so the document title reads
		// "[Grandchild ‹] Child ‹ Group".
		let menuEntry = adminmenu[ page ];
		const groupSubTitles = [];
		if ( ! menuEntry ) {
			for ( const item of Object.values( adminmenu ) ) {
				const child = ( item?.sub_items || [] ).find(
					( i ) => i.page === page
				);
				if ( child ) {
					menuEntry = item;
					groupSubTitles.push( child.title );
					if ( path && child.sub_items ) {
						const grandchild = child.sub_items.find(
							( g ) => g.slug === path
						);
						if ( grandchild ) {
							groupSubTitles.unshift( grandchild.title );
						}
					}
					break;
				}
			}
		}

		if ( menuEntry && hasOwnProperty.call( menuEntry, 'title' ) ) {
			const parts = [ menuEntry.title ];
			if ( groupSubTitles.length ) {
				parts.unshift( ...groupSubTitles );
			} else if ( menuEntry.sub_items ) {
				const subTitle = menuEntry.sub_items.find(
					( i ) => i.slug === path || ( ! path && i.slug === '' )
				);
				if ( subTitle ) {
					parts.unshift( subTitle.title );
				}
			}

			if ( action ) {
				switch ( action ) {
					case 'new':
						parts.shift();
						parts.unshift( __( 'Add new', 'storeengine' ) );
						break;
					case 'edit':
						parts.shift();
						parts.unshift( __( 'Edit', 'storeengine' ) );
						break;
				}
			}

			let titleParts;
			if ( isRTL( parts.join( ' ' ) ) ) {
				titleParts = parts.reverse().join( ' › ' );
			} else {
				titleParts = parts.join( ' ‹ ' );
			}

			document.title = sprintf(
				// translators: %s. Page title.
				_x( '%s – StoreEngine', 'Admin Page Title', 'storeengine' ),
				titleParts
			);
		}
	}, [ adminmenu, page, path, action ] );

	return (
		<>
			<Link
				to={ `${ route_path }admin.php?page=storeengine` }
				className="wp-has-submenu wp-has-current-submenu wp-menu-open menu-top toplevel_page_storeengine menu-top-last"
				aria-haspopup="false"
			>
				<div className="wp-menu-arrow">
					<div></div>
				</div>
				<div
					className="wp-menu-image svg"
					style={ {
						backgroundImage: `url(${ get_assets_url(
							'images/logo.svg'
						) })`,
					} }
					aria-hidden="true"
				>
					<br />
				</div>
				<div className="wp-menu-name">
					{ __( 'StoreEngine', 'storeengine' ) }
				</div>
			</Link>
			<ul className="wp-submenu wp-submenu-wrap">
				<li className="wp-submenu-head" aria-hidden="true">
					{ __( 'StoreEngine', 'storeengine' ) }
				</li>
				{ Object.entries( adminmenu ).map( ( [ key, item ], index ) => {
					if (
						[
							'storeengine-get-pro',
							'storeengine-license',
						].includes( key )
					) {
						return null;
					}
					const subItems = item?.sub_items || [];
					// Group parents hold children keyed by their own `page`.
					// Highlight/expand the parent while any child page is
					// active. The parent row navigates to `landing` (a
					// primary-backed group like Orders → its own list), else to
					// its first child page (a pure container like Marketing).
					const firstChildPage = subItems.find(
						( i ) => i.page
					)?.page;
					const isChildActive = subItems.some(
						( i ) => i.page && i.page === page
					);
					return (
						<MenuItem
							className={ classNames( {
								'wp-first-item': ! index,
								current: page === key || isChildActive,
							} ) }
							key={ index }
							parent={ key }
							currentPage={ page }
							currentPath={ path }
							subMenuItems={ subItems }
						>
							<Link
								to={ get_route_path( {
									page: item.landing || firstChildPage || key,
								} ) }
							>
								{ item.title }
								{ subItems.length > 0 && (
									<span
										className="storeengine-icon storeengine-icon--arrow-right"
										aria-hidden={ true }
									/>
								) }
							</Link>
						</MenuItem>
					);
				} ) }
				<>
					{ ! is_pro && (
						<li
							className={
								page === 'storeengine-get-pro' ? 'current' : ''
							}
						>
							<a
								href={ get_route_path( {
									page: 'storeengine-get-pro',
								} ) }
								target="_blank"
								rel="noreferrer"
							>
								{ createInterpolateElement(
									__( '<ProBadge/> Get Pro', 'storeengine' ),
									{
										ProBadge: (
											<span
												className="dashicons dashicons-awards storeengine-blue-color"
												aria-hidden={ true }
											/>
										),
									}
								) }
							</a>
						</li>
					) }
				</>
			</ul>
		</>
	);
};

export default AdminMenu;
