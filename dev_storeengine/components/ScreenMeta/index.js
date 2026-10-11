import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { useSelector } from 'react-redux';
import { Checkbox } from '@Components/ui';
import useScreenOptions, {
	mergeColumns,
	toSavedColumns,
} from '@Hooks/useScreenOptions';
import './styles.scss';

// Default Help tabs for any list screen. Screens can add/replace tabs via the
// `storeengine.help.tabs` filter (receives ({ screenId })).
const HELP_TABS = [
	{
		id: 'overview',
		title: __( 'Overview', 'storeengine' ),
		content: (
			<p>
				{ __(
					'This screen lists your store data. Use the status tabs and filters above the list to narrow it down, click a column header to sort, and use the Screen Options tab to choose which columns appear and how many items load per page. Your preferences are saved to your account.',
					'storeengine'
				) }
			</p>
		),
	},
	{
		id: 'screen-content',
		title: __( 'Screen Content', 'storeengine' ),
		content: (
			<>
				<p>
					{ __(
						'You can customise what this screen shows:',
						'storeengine'
					) }
				</p>
				<ul>
					<li>
						{ __(
							'Open Screen Options (top-right) to show or hide columns.',
							'storeengine'
						) }
					</li>
					<li>
						{ __(
							'Reorder columns by dragging them in the table’s column manager.',
							'storeengine'
						) }
					</li>
					<li>
						{ __(
							'Set how many items load per page from Screen Options.',
							'storeengine'
						) }
					</li>
				</ul>
			</>
		),
	},
	{
		id: 'actions',
		title: __( 'Available Actions', 'storeengine' ),
		content: (
			<>
				<p>
					{ __(
						'Hover over a row to reveal its actions:',
						'storeengine'
					) }
				</p>
				<ul>
					<li>
						{ __(
							'Edit — open the item’s editing screen (or click its title).',
							'storeengine'
						) }
					</li>
					<li>
						{ __(
							'View — open the item on your live site where available.',
							'storeengine'
						) }
					</li>
					<li>
						{ __(
							'Delete / Trash — remove the item.',
							'storeengine'
						) }
					</li>
				</ul>
			</>
		),
	},
	{
		id: 'bulk',
		title: __( 'Bulk Actions', 'storeengine' ),
		content: (
			<p>
				{ __(
					'Select one or more rows using the checkboxes, choose an action from the Bulk actions menu, and apply it to all selected items at once.',
					'storeengine'
				) }
			</p>
		),
	},
];

// A short, screen-specific intro prepended to the generic Overview so the Help
// panel opens with context about the exact list the user is looking at. Keyed by
// the screenId a page passes to <ListTable screenId="…" />. Screens without an
// entry simply show the generic Overview.
const SCREEN_HELP = {
	orders: __(
		'The Orders screen lists every order placed in your store. Filter by status, search by customer or order number, and open an order to view its items, payments, and fulfilment.',
		'storeengine'
	),
	products: __(
		'The Products screen is your catalog. Create and edit products, manage pricing and variations, and control what appears in your store.',
		'storeengine'
	),
	customers: __(
		'The Customers screen lists everyone who has an account or has purchased from you. Open a customer to see their orders, subscriptions, and purchased items.',
		'storeengine'
	),
	subscriptions: __(
		'The Subscriptions screen tracks recurring plans. Filter by status to find active, on-hold, or cancelled subscriptions and open one to manage its billing.',
		'storeengine'
	),
	payments: __(
		'The Payments screen is a record of every transaction processed through your store, including the gateway used and each payment’s status.',
		'storeengine'
	),
	'access-groups': __(
		'The Access Groups screen manages membership rules that grant customers access to protected content based on the products they own.',
		'storeengine'
	),
	coupons: __(
		'The Coupons screen lists your discount codes. Create fixed or percentage discounts, set usage limits and expiry, and track how each coupon is performing.',
		'storeengine'
	),
	logs: __(
		'The Logs screen records system events and errors. Filter by module or status to diagnose issues; open an entry for its full detail.',
		'storeengine'
	),
	affiliates: __(
		'The Affiliates screen lists partners promoting your store. Approve applications, set commission rates, and review each affiliate’s performance.',
		'storeengine'
	),
	commissions: __(
		'The Commissions screen records the earnings owed to affiliates for referred sales, along with each commission’s current status.',
		'storeengine'
	),
	'affiliate-payouts': __(
		'The Payouts screen tracks money paid out to affiliates. Review pending balances and mark payouts as completed.',
		'storeengine'
	),
	clicks: __(
		'The Clicks screen logs referral link visits so you can see the traffic each affiliate is sending to your store.',
		'storeengine'
	),
	'email-logs': __(
		'The Email Logs screen records the emails your store has sent. Filter by type or status and open an entry to inspect the message.',
		'storeengine'
	),
	funnels: __(
		'The Funnels screen lists your sales funnels — the checkout and one-click upsell flows that guide customers through a purchase.',
		'storeengine'
	),
	tags: __(
		'The Tags screen manages product tags, a flexible way to label and group products for filtering and merchandising.',
		'storeengine'
	),
	taxonomy: __(
		'This screen manages your product taxonomies — categories, tags, and brands — used to organise your catalog.',
		'storeengine'
	),
	attributes: __(
		'The Attributes screen defines reusable product attributes (such as size or colour) and their terms, which power product variations and filtering.',
		'storeengine'
	),
	inventory: __(
		'The Inventory screen shows stock levels across your catalog. Spot low-stock items and adjust quantities in place.',
		'storeengine'
	),
	webhooks: __(
		'The Incoming Webhooks screen manages endpoints that let external services send data into your store.',
		'storeengine'
	),
	'outgoing-webhooks': __(
		'The Webhooks screen manages outgoing notifications your store sends to external URLs when events occur.',
		'storeengine'
	),
	'order-bumps': __(
		'The Order Bumps screen manages the optional add-on offers shown to customers at checkout to increase order value.',
		'storeengine'
	),
	'installment-plans': __(
		'The Installment Plans screen manages pay-over-time plans that split a purchase into scheduled payments.',
		'storeengine'
	),
	licenses: __(
		'The Licenses screen lists software licenses issued for your products, including their activation status and linked sites.',
		'storeengine'
	),
	'abandoned-carts': __(
		'The Abandoned Carts screen surfaces checkouts customers started but didn’t complete, so you can recover potentially lost sales.',
		'storeengine'
	),
};

// Main documentation link shown under "For more information".
const DOCS_URL = 'https://storeengine.pro/docs';

// Community / support links shown in every Help panel.
const COMMUNITY_LINKS = [
	{
		label: __( 'Facebook Community', 'storeengine' ),
		url: 'https://www.facebook.com/groups/academylmsteam',
		icon: 'facebook',
	},
	{
		label: __( 'Community Forum', 'storeengine' ),
		url: 'https://community.kodezen.com/',
		icon: 'community',
	},
	{
		label: __( 'Create a support ticket', 'storeengine' ),
		url: 'https://community.kodezen.com/tickets',
		icon: 'support',
	},
];

const TABS_SLOT = 'storeengine-topbar-meta';
const PANEL_SLOT = 'storeengine-topbar-meta-panel';

/**
 * Finds the top bar's slots for the tabs and panel. Pages mount their TopBar
 * after this component (and swap it on route change), so watch the DOM.
 *
 * @return {{tabs: ?HTMLElement, panel: ?HTMLElement}} Slot elements.
 */
function useTopBarSlots() {
	const [ slots, setSlots ] = useState( { tabs: null, panel: null } );

	useEffect( () => {
		const find = () => {
			const tabs = document.getElementById( TABS_SLOT );
			const panel = document.getElementById( PANEL_SLOT );
			setSlots( ( cur ) =>
				cur.tabs === tabs && cur.panel === panel ? cur : { tabs, panel }
			);
		};
		find();
		const root = document.getElementById( 'wpbody-content' ) || document.body;
		const observer = new window.MutationObserver( find );
		observer.observe( root, { childList: true, subtree: true } );
		return () => observer.disconnect();
	}, [] );

	return slots;
}

/**
 * The single, global WordPress-native "Screen Options" + "Help" meta. Rendered
 * once at the top of the admin shell; it reads the active list screen from the
 * store (set by each page via useRegisterScreenMeta) and sits in normal flow so
 * an open panel pushes the page down, exactly like core.
 */
export default function ScreenMeta() {
	const activeScreen = useSelector( ( s ) => s.screenOptions.activeScreen );
	const screenId = activeScreen?.screenId || '';

	const [ active, setActive ] = useState( null ); // 'options' | 'help' | null
	const [ menuOpen, setMenuOpen ] = useState( false );
	// The tab whose content is mounted. Kept during the slide-up so the panel
	// doesn't empty out before it finishes closing; cleared on transition end.
	const [ renderTab, setRenderTab ] = useState( null );
	// Selected Help content tab (left nav).
	const [ helpTab, setHelpTab ] = useState( HELP_TABS[ 0 ].id );
	// Tabs and panel can live in different DOM spots (portaled into the top
	// bar), so outside-click checks both.
	const tabsRef = useRef( null );
	const panelRef = useRef( null );
	const slots = useTopBarSlots();

	// Collapse the panel whenever the active screen changes (route change).
	useEffect( () => {
		setActive( null );
		setRenderTab( null );
		setMenuOpen( false );
	}, [ screenId ] );

	const {
		perPage,
		savedColumns,
		columnDefs,
		perPageEnabled,
		setPerPage,
		setColumns,
		reset,
	} = useScreenOptions( screenId );

	// Draft state (WordPress applies changes on "Apply", not live).
	const [ draftCols, setDraftCols ] = useState( [] );
	const [ draftPerPage, setDraftPerPage ] = useState( perPage || 10 );

	// Re-seed the draft each time the panel opens.
	useEffect( () => {
		if ( active === 'options' ) {
			setDraftCols( mergeColumns( columnDefs, savedColumns ) );
			setDraftPerPage( perPage || 10 );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ active ] );

	useEffect( () => {
		if ( ! active && ! menuOpen ) {
			return;
		}
		const onDoc = ( e ) => {
			const inside = [ tabsRef, panelRef ].some(
				( r ) => r.current && r.current.contains( e.target )
			);
			if ( ! inside ) {
				setActive( null );
				setMenuOpen( false );
			}
		};
		const onKey = ( e ) => 'Escape' === e.key && setMenuOpen( false );
		document.addEventListener( 'mousedown', onDoc );
		document.addEventListener( 'keydown', onKey );
		return () => {
			document.removeEventListener( 'mousedown', onDoc );
			document.removeEventListener( 'keydown', onKey );
		};
	}, [ active, menuOpen ] );

	const toggle = ( tab ) => {
		if ( active === tab ) {
			setActive( null ); // close — keep renderTab until the slide-up ends
		} else {
			if ( tab === 'help' ) {
				setHelpTab( HELP_TABS[ 0 ].id );
			}
			setRenderTab( tab );
			setActive( tab );
		}
	};

	const toggleColumn = ( id, checked ) =>
		setDraftCols( ( cols ) =>
			cols.map( ( c ) =>
				c.id === id && ! c.locked ? { ...c, visible: checked } : c
			)
		);

	const apply = () => {
		setColumns( toSavedColumns( draftCols ) );
		setPerPage( draftPerPage );
		setActive( null );
	};

	// Prepend a screen-specific intro to the Overview when we have one.
	const intro = SCREEN_HELP[ screenId ];
	const baseTabs = intro
		? [
				{
					...HELP_TABS[ 0 ],
					content: (
						<>
							<p>{ intro }</p>
							{ HELP_TABS[ 0 ].content }
						</>
					),
				},
				...HELP_TABS.slice( 1 ),
		  ]
		: HELP_TABS;

	// Help content tabs (extensible per screen).
	const helpTabs = applyFilters( 'storeengine.help.tabs', baseTabs, {
		screenId,
	} );
	const currentHelpTab =
		helpTabs.find( ( t ) => t.id === helpTab ) || helpTabs[ 0 ];

	const hasOptions = !! screenId;
	const hasHelp = !! screenId;
	if ( ! hasOptions && ! hasHelp ) {
		return null;
	}

	const pick = ( tab ) => {
		setMenuOpen( false );
		toggle( tab );
	};

	const links = (
		<div className="storeengine-screen-meta__links">
			<button
				type="button"
				className={ `storeengine-screen-meta__more ${
					active || menuOpen ? 'is-open' : ''
				}` }
				aria-haspopup="menu"
				aria-expanded={ menuOpen }
				aria-label={ __( 'Screen options and help', 'storeengine' ) }
				title={ __( 'Screen options and help', 'storeengine' ) }
				onClick={ () => setMenuOpen( ( v ) => ! v ) }
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<circle cx="5" cy="12" r="2" />
					<circle cx="12" cy="12" r="2" />
					<circle cx="19" cy="12" r="2" />
				</svg>
			</button>
			{ menuOpen && (
				<ul className="storeengine-screen-meta__menu" role="menu">
					{ hasOptions && (
						<li role="none">
							<button
								type="button"
								role="menuitemcheckbox"
								aria-checked={ active === 'options' }
								onClick={ () => pick( 'options' ) }
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
									<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
									<circle cx="16" cy="6" r="2" />
									<circle cx="10" cy="12" r="2" />
									<circle cx="18" cy="18" r="2" />
								</svg>
								{ __( 'Screen Options', 'storeengine' ) }
								{ active === 'options' && <span className="storeengine-screen-meta__menu-check" aria-hidden="true">✓</span> }
							</button>
						</li>
					) }
					{ hasHelp && (
						<li role="none">
							<button
								type="button"
								role="menuitemcheckbox"
								aria-checked={ active === 'help' }
								onClick={ () => pick( 'help' ) }
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
									<circle cx="12" cy="12" r="9" />
									<path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1v.5" />
									<circle cx="12" cy="17" r="0.6" fill="currentColor" />
								</svg>
								{ __( 'Help', 'storeengine' ) }
								{ active === 'help' && <span className="storeengine-screen-meta__menu-check" aria-hidden="true">✓</span> }
							</button>
						</li>
					) }
				</ul>
			) }
		</div>
	);

	const panel = (
		<div
			className={ `storeengine-screen-meta__panel ${
				active ? 'is-open' : ''
			}` }
			onTransitionEnd={ () => {
				if ( ! active ) {
					setRenderTab( null );
				}
			} }
		>
			<div className="storeengine-screen-meta__panel-clip">
			<div className="storeengine-screen-meta__panel-inner">
				{ renderTab === 'options' && hasOptions && (
					<>
						{ draftCols.length > 0 && (
							<div className="storeengine-screen-meta__row">
								<h5 className="storeengine-screen-meta__title">
									{ __( 'Columns', 'storeengine' ) }
								</h5>
								<div className="storeengine-screen-meta__cols">
									{ draftCols.map( ( c ) => (
										<Checkbox
											key={ c.id }
											checked={ !! c.visible }
											disabled={ !! c.locked }
											onChange={ ( v ) =>
												toggleColumn( c.id, v )
											}
											label={ c.name }
										/>
									) ) }
								</div>
							</div>
						) }

						{ perPageEnabled && (
						<div className="storeengine-screen-meta__row">
							<h5 className="storeengine-screen-meta__title">
								{ __( 'Pagination', 'storeengine' ) }
							</h5>
							<label className="storeengine-screen-meta__perpage">
								<span>
									{ __(
										'Number of items per page:',
										'storeengine'
									) }
								</span>
								<input
									type="number"
									min={ 1 }
									max={ 200 }
									className="storeengine-screen-meta__number"
									value={ draftPerPage }
									onChange={ ( e ) =>
										setDraftPerPage(
											Math.max(
												1,
												Math.min(
													200,
													parseInt(
														e.target.value,
														10
													) || 1
												)
											)
										)
									}
								/>
							</label>
						</div>

						) }

						<div className="storeengine-screen-meta__actions">
							<button
								type="button"
								className="storeengine-screen-meta__apply"
								onClick={ apply }
							>
								{ __( 'Apply', 'storeengine' ) }
							</button>
							<button
								type="button"
								className="storeengine-screen-meta__reset"
								onClick={ () => {
									reset();
									setActive( null );
								} }
							>
								{ __( 'Reset to defaults', 'storeengine' ) }
							</button>
						</div>
					</>
				) }

				{ renderTab === 'help' && hasHelp && (
					<div className="storeengine-screen-meta__help-wrap">
						<div className="storeengine-screen-meta__help-nav">
							{ helpTabs.map( ( t ) => (
								<button
									key={ t.id }
									type="button"
									className={ `storeengine-screen-meta__help-nav-item ${
										currentHelpTab?.id === t.id
											? 'is-active'
											: ''
									}` }
									onClick={ () => setHelpTab( t.id ) }
								>
									{ t.title }
								</button>
							) ) }
						</div>

						<div className="storeengine-screen-meta__help-content">
							{ currentHelpTab?.content }
						</div>

						<div className="storeengine-screen-meta__help-links">
							<div className="storeengine-screen-meta__help-links-group">
								<h5 className="storeengine-screen-meta__title">
									{ __(
										'For more information:',
										'storeengine'
									) }
								</h5>
								<ul>
									<li>
										<a
											href={ DOCS_URL }
											target="_blank"
											rel="noreferrer"
										>
											{ __(
												'Documentation',
												'storeengine'
											) }
										</a>
									</li>
								</ul>
							</div>

							<div className="storeengine-screen-meta__help-links-group">
								<h5 className="storeengine-screen-meta__title">
									{ __(
										'Community & support',
										'storeengine'
									) }
								</h5>
								<ul className="storeengine-screen-meta__help-community">
									{ COMMUNITY_LINKS.map( ( l, i ) => (
										<li key={ `com-${ i }` }>
											<a
												href={ l.url }
												target="_blank"
												rel="noreferrer"
											>
												<span
													className={ `storeengine-icon storeengine-icon--${ l.icon }` }
													aria-hidden="true"
												/>
												{ l.label }
											</a>
										</li>
									) ) }
								</ul>
							</div>
						</div>
					</div>
				) }
			</div>
			</div>
		</div>
	);

	const rootClass = `storeengine-screen-meta ${ active ? 'is-open' : '' }`;

	// Inside the StoreEngine top bar when the page has one: the tabs sit next to
	// search and the panel drops down from the bar, so no extra strip is
	// needed above it. Otherwise keep the classic strip.
	if ( slots.tabs && slots.panel ) {
		return (
			<>
				{ createPortal(
					<div className={ `${ rootClass } storeengine-screen-meta--topbar` } ref={ tabsRef }>
						{ links }
					</div>,
					slots.tabs
				) }
				{ createPortal(
					<div className={ `${ rootClass } storeengine-screen-meta--topbar` } ref={ panelRef }>
						{ panel }
					</div>,
					slots.panel
				) }
			</>
		);
	}

	return (
		<div className={ rootClass } ref={ tabsRef }>
			{ links }
			<div ref={ panelRef }>{ panel }</div>
		</div>
	);
}
