import React from 'react';
import { Link } from 'react-router-dom';
import { get_route_path, route_path } from '@Utils/helper';

export default function MenuItem( props ) {
	const {
		className,
		children,
		parent,
		currentPage,
		currentPath,
		subMenuItems,
	} = props;
	return (
		<>
			<li className={ className }>
				{ children }
				{ className === 'current' && subMenuItems && (
					<>
						<ul className="wp-submenu">
							{ subMenuItems.map( ( item, index ) => {
								// Grouped children carry their own top-level
								// `page` slug and keep their existing route;
								// classic sub-items route under the parent via
								// `slug`/`path`.
								const isPageChild = !! item?.page;
								const isChildCurrent =
									isPageChild && currentPage === item.page;
								const classNames = [
									parent,
									( isPageChild ? item.page : item?.slug ) || '',
								];
								if (
									isChildCurrent ||
									( ! isPageChild &&
										item.slug &&
										currentPath === item.slug ) ||
									( ! isPageChild &&
										! item.slug &&
										! currentPath &&
										currentPage === parent )
								) {
									classNames.push( 'current' );
								}
								// Second nesting level: a page-child (e.g. Fraud
								// Shield) that is itself active reveals its own
								// sub-pages, which route under its page via
								// `path`. Keeps those screens reachable without a
								// flyout.
								const grandItems =
									isChildCurrent && item.sub_items?.length
										? item.sub_items
										: [];
								return (
									<li
										className={ classNames
											.filter( ( c ) => !! c )
											.join( ' ' ) }
										key={ index }
									>
										<Link
											to={ get_route_path(
												isPageChild
													? { page: item.page }
													: {
															page: parent,
															path: item.slug || '',
													  }
											) }
										>
											{ item.title }
										</Link>
										{ grandItems.length > 0 && (
											<ul className="wp-submenu storeengine-submenu-l2">
												{ grandItems.map(
													( grand, gIndex ) => {
														const gCurrent =
															( grand.slug &&
																currentPath ===
																	grand.slug ) ||
															( ! grand.slug &&
																! currentPath );
														const gClasses = [
															item.page,
															grand.slug || '',
														];
														if ( gCurrent ) {
															gClasses.push(
																'current'
															);
														}
														return (
															<li
																className={ gClasses
																	.filter(
																		( c ) => !! c
																	)
																	.join( ' ' ) }
																key={ gIndex }
															>
																<Link
																	to={ get_route_path(
																		{
																			page: item.page,
																			path:
																				grand.slug ||
																				'',
																		}
																	) }
																>
																	{ grand.title }
																</Link>
															</li>
														);
													}
												) }
											</ul>
										) }
									</li>
								);
							} ) }
						</ul>
					</>
				) }
			</li>
		</>
	);
}
