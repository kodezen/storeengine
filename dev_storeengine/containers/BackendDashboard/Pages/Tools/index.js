import React, { useEffect } from 'react';
import { applyFilters } from '@wordpress/hooks';
import TopBar from '@Components/TopBar';
import SubTopBar from '@Components/SubTopBar';
import { __ } from '@wordpress/i18n';
import { get_route_path, getAddonActiveStatus, admin_url } from '@Utils/helper';
import { useNavigate, Link } from 'react-router-dom';
import GetHelp from '@Components/GetHelp';
import { useLocationQuery } from '@Hooks';
import { useSelector } from 'react-redux';

// pages
import StoreEngineStatus from './pages/StoreEngineStatus';
import StoreEnginePages from './pages/StoreEnginePages';
import ShortCode from './pages/ShortCode';
import Migration from './pages/Migration';
import ExportAndImport from './pages/ExportAndImport';
import Freemius from './pages/Freemius';
import ActionScheduler from './pages/ActionScheduler';
import Backup from './pages/Backup';
import Seeder from './pages/Seeder';
import classnames from 'classnames';

import './styles.scss';

const helpOptions = {
	status: [ 'status' ],
	pages: [ 'pages' ],
	shortcodes: [ 'shortcode' ],
	backup: [ 'backup', 'export', 'import' ],
	export_import: [ 'export', 'import' ],
	migration: [ 'migration' ],
	'action-scheduler': [ 'scheduler' ],
};

export default function Tools() {
	const allAddons = useSelector( ( state ) => state.addons );
	const migrationTab = getAddonActiveStatus( allAddons, 'migration-tool' )
		? [
				{
					icon: 'migration',
					title: __( 'Migration', 'storeengine' ),
					subtitle: __(
						'Transfer store data from others',
						'storeengine'
					),
					slug: 'migration',
				},
		  ]
		: [];
	const exportAndImportTab = getAddonActiveStatus( allAddons, 'csv' )
		? [
				{
					icon: 'csv-alt',
					title: __( 'CSV Import/Export', 'storeengine' ),
					subtitle: __( 'Bulk data upload/download', 'storeengine' ),
					slug: 'export-import',
				},
		  ]
		: [];
	const seederTab = getAddonActiveStatus( allAddons, 'seeder' )
		? [
				{
					icon: 'general',
					title: __( 'Dummy Data', 'storeengine' ),
					subtitle: __(
						'Generate sample data for testing',
						'storeengine'
					),
					slug: 'dummy-data',
				},
		  ]
		: [];
	const freeiusImportTab = getAddonActiveStatus(
		allAddons,
		'license-management'
	)
		? [
				{
					icon: 'freemius',
					title: __( 'Freemius Import', 'storeengine' ),
					subtitle: __(
						'Import Freemius platform data',
						'storeengine'
					),
					slug: 'freemius-import',
				},
		  ]
		: [];

	const tabs = [
		{
			icon: 'status',
			title: __( 'Status', 'storeengine' ),
			subtitle: __( 'System/Server health check', 'storeengine' ),
			slug: 'status',
			section: 'wordpress',
		},
		{
			icon: 'page',
			title: __( 'StoreEngine Pages', 'storeengine' ),
			subtitle: __( 'Verify/Recreate core store pages', 'storeengine' ),
			slug: 'pages',
		},
		{
			icon: 'code',
			title: __( 'Shortcodes', 'storeengine' ),
			subtitle: __( 'List dynamic function codes', 'storeengine' ),
			slug: 'shortcodes',
		},
		{
			title: __( 'Setup Wizard', 'storeengine' ),
			subtitle: __( 'Guided initial configuration', 'storeengine' ),
			icon: 'setup-wizard',
			name: 'setup',
			slug: 'setup',
			link: `${ admin_url }admin.php?page=storeengine-setup`,
		},
		{
			icon: 'import-export',
			title: __( 'Backup', 'storeengine' ),
			subtitle: __( 'Full export / restore of all data', 'storeengine' ),
			slug: 'backup',
		},
		...exportAndImportTab,
		...migrationTab,
		...freeiusImportTab,
		...seederTab,
		{
			icon: 'setup-wizard',
			title: __( 'Action Scheduler', 'storeengine' ),
			subtitle: __(
				'Inspect & clear queued background jobs',
				'storeengine'
			),
			slug: 'action-scheduler',
		},
		// Let addons (e.g. Pro's AI Bulk generation) contribute their own Tools
		// tab. Each entry is a { icon, title, subtitle, slug } like the ones
		// above; the matching content is provided via the
		// `storeengine.tools.render` filter in renderSwitch below.
		...applyFilters( 'storeengine.tools.tabs', [], { allAddons } ),
	];

	const navigate = useNavigate();
	const location = useLocationQuery();
	const path = location.getValue(
		'path',
		'status',
		tabs.map( ( t ) => t.slug )
	);
	const pageSection = location.getValue( 'section' );

	useEffect( () => {
		const query = { page: 'storeengine-tools', path };
		if ( 'status' === path && pageSection ) {
			query.section = pageSection;
		}
		navigate( get_route_path( query ), { replace: true } );
	}, [ path, pageSection ] );

	const renderSwitch = ( urlPath ) => {
		// Addon-contributed tabs (e.g. Pro AI Bulk generation) render here.
		const injected = applyFilters(
			'storeengine.tools.render',
			null,
			urlPath
		);
		if ( injected ) {
			return injected;
		}
		switch ( urlPath ) {
			case 'pages':
				return <StoreEnginePages />;
			case 'shortcodes':
				return <ShortCode />;
			case 'backup':
				return <Backup />;
			case 'export-import':
				return <ExportAndImport />;
			case 'migration':
				return <Migration />;
			case 'freemius-import':
				return <Freemius />;
			case 'action-scheduler':
				return <ActionScheduler />;
			case 'dummy-data':
				return <Seeder />;
			case 'status':
			default:
				return <StoreEngineStatus />;
		}
	};

	return (
		<>
			<TopBar
				title={ __( 'Tools', 'storeengine' ) }
				render={ () => (
					<GetHelp
						filterText={
							helpOptions.hasOwnProperty( path )
								? helpOptions[ path ]
								: []
						}
					/>
				) }
			/>

			<SubTopBar heading={ __( 'Tools', 'storeengine' ) } />

			<div className="storeengine-page-content">
				<div className="storeengine-page-content--tools">
					<div className="storeengine-tab-panel">
						{ tabs.map( ( tabItem, tabIndex ) => (
							<div
								className={ classnames(
									'storeengine-tab-panel-control storeengine-tab-panel__item',
									{
										'storeengine-tab-panel__item--is-open':
											tabItem.slug === path,
									}
								) }
								key={ tabIndex }
							>
								{ tabItem.slug === 'setup' ? (
									<a
										href={ tabItem.link }
										target="_blank"
										rel="noopener noreferrer"
										className={ `storeengine-tab-item` }
									>
										<span
											className={ `storeengine-icon storeengine-icon--${ tabItem.icon }` }
											aria-hidden={ true }
										/>
										<div>
											<h3 className="storeengine-tab-item--title">
												{ tabItem.title }
											</h3>
											<p className="storeengine-tab-item--sub-title">
												{ tabItem.subtitle }
											</p>
										</div>
									</a>
								) : (
									<Link
										to={ get_route_path( {
											page: 'storeengine-tools',
											path: tabItem.slug,
											section: tabItem.section,
										} ) }
										className={ classnames(
											'storeengine-tab-item',
											{
												'storeengine-tab-item--is-active':
													path === tabItem.slug,
											}
										) }
									>
										<span
											className={ `storeengine-icon storeengine-icon--${ tabItem.icon }` }
											aria-hidden={ true }
										/>
										<div>
											<h3 className="storeengine-tab-item--title">
												{ tabItem.title }
											</h3>
											<p className="storeengine-tab-item--sub-title">
												{ tabItem.subtitle }
											</p>
										</div>
									</Link>
								) }
							</div>
						) ) }
					</div>
					<div className={ `storeengine-page-content--tools__content storeengine-page-content--tools__content--${ path }` }>
						{ renderSwitch( path ) }
					</div>
				</div>
			</div>
		</>
	);
}
