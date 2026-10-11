import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import IdleLockOverlay from '@Components/POS/IdleLockOverlay';
import ParkedCartsPanel from './components/ParkedCartsPanel';
import PosProfileModal from './components/PosProfileModal';
import CloseSessionModal from '@Components/POS/CloseSessionModal';
import { admin_url, plugin_root_url } from '@Utils/helper';
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { switchCartTab, closeCartTab, newCartTab, fetchPinStatus, resetActiveRegister, fetchRegisters } from '@Redux/Slices/posSlice/posSlice';
import Terminal from './Terminal';
import MyShiftWidget from './MyShiftWidget';
import ProductsPage from './ProductsPage';
import InventoryPage from './InventoryPage';

const SidebarBtn = ({ active, onClick, title, children }) => (
	<button
		type="button"
		onClick={onClick}
		title={title}
		className={
			'flex flex-col items-center justify-center rounded text-xs gap-1 transition-colors border-none p-2 ' +
			(active
				? 'bg-[#E9F2FF] text-se-primary'
				: 'text-se-subtitle hover:bg-[#E9F2FF] hover:text-se-primary')
		}
	>
		{children}
	</button>
);

/**
 * Standalone shell for the public POS terminal at /pos.
 *
 * The previous implementation owned its own RegisterPicker / SessionStarter /
 * Terminal trees and talked to the REST API via a hand-rolled PosApi. That
 * left it stale relative to the admin Terminal, which has all the new
 * refund / discount / tip / supervisor-PIN / cash-movement / receipt UI.
 *
 * This shell now wraps the admin Terminal component directly. The admin
 * Terminal already handles the full "no register → pick register → no
 * session → open session → checkout" flow internally, so we just render it
 * inside a public chrome (store-name header + cashier identity + logout).
 *
 * The Redux Provider + store are set up in index.js; the slim store
 * pos-terminal/app/store.js includes only the slices the cashier UI needs.
 */
const App = ({ config }) => {
	const [profileOpen, setProfileOpen] = useState(false);
	const [page, setPage] = useState('home');
	const [closeShiftOpen, setCloseShiftOpen] = useState(false);
	const [confirmingRegisterChange, setConfirmingRegisterChange] = useState(false);
	// Parked-carts side panel — lifted from Terminal.js so the toggle can
	// live in the global topbar (used to be inside a register/session info
	// bar above the cart, which we removed).
	const [parkedPanelOpen, setParkedPanelOpen] = useState(false);
	// null = unknown (still loading), true/false once /pos/supervisor/pin resolves.
	const [hasPin, setHasPin] = useState(null);
	const activeCashier = useSelector((s) => s.pos.activeCashier);
	const cashier = activeCashier || config.user || {};

	const dispatch = useDispatch();
	const {
		cart,
		cartTabs = [],
		activeSession,
		activeRegister,
		registers = [],
		activeCartId = 1,
		customer,
		walkin,
		parkedCarts = [],
	} = useSelector( ( s ) => s.pos );

	// Unified cart list. The active cart lives at top-level (cart/customer/
	// walkin), the others in cartTabs[]. We merge them into one ordered list
	// so the tab strip renders uniformly and the "active" highlight follows
	// the user's selection instead of being locked to the first slot.
	const allCarts = useMemo( () => {
		const activeEntry = {
			id: activeCartId,
			items: cart,
			customer,
			walkin,
			active: true,
		};
		const tabEntries = cartTabs.map( ( t ) => ( {
			id: t.id,
			items: t.items || [],
			customer: t.customer || null,
			walkin: t.walkin || null,
			active: false,
		} ) );
		// Sort by id so labels stay in creation order regardless of which
		// one happens to be active. Stable "Cart 1, Cart 2, Cart 3" feel
		// matches what cashiers expect from physical POS tabs.
		return [ activeEntry, ...tabEntries ].sort( ( a, b ) => a.id - b.id );
	}, [ cart, cartTabs, activeCartId, customer, walkin ] );

	// Refresh PIN status on mount and whenever the Profile modal closes
	// (set/clear PIN). Drives the lock button + idle-lock unlock flow.
	useEffect(() => {
		if (!config.hasCap) return;
		dispatch(fetchPinStatus())
			.unwrap()
			.then((res) => setHasPin(!!res?.has_pin))
			.catch(() => setHasPin(false));
	}, [dispatch, config.hasCap, activeCashier?.id, profileOpen]);

	const doChangeRegister = () => {
		setConfirmingRegisterChange(false);
		dispatch( resetActiveRegister() );
		dispatch( fetchRegisters( { active: true, available: true } ) );
	};

	const handleChangeRegister = () => {
		if ( activeSession ) {
			setConfirmingRegisterChange(true);
		} else {
			doChangeRegister();
		}
	};

	// Lock button click: if a PIN is set, lock immediately. If not, open
	// Profile so the user can set one — locking without a PIN would strand
	// them on the lock screen with no way back in.
	const onLockClick = () => {
		if (hasPin) {
			window.dispatchEvent(new Event('storeengine-pos:lock'));
		} else {
			setProfileOpen(true);
		}
	};

	if (!config.hasCap) {
		return (
			<div className="se-pos-shell se-admin-tw">
				<div className="font-se min-h-screen flex items-center justify-center">
					<div className="bg-white border border-se-border rounded-md shadow-se-card p-8 max-w-md text-center">
						<h1 className="m-0 text-xl font-semibold text-se-text">
							{__('Access denied', 'storeengine')}
						</h1>
						<p className="mt-2 text-sm text-se-subtitle">
							{createInterpolateElement(
								__(
									'Your account does not have permission to use the POS terminal. Ask an administrator to assign the <cap1 /> capability or the <cap2 /> role.',
									'storeengine'
								),
								{
									cap1: (
										<code className="px-1 py-0.5 rounded bg-se-bg text-xs">
											storeengine_run_pos
										</code>
									),
									cap2: (
										<code className="px-1 py-0.5 rounded bg-se-bg text-xs">
											storeengine_cashier
										</code>
									),
								}
							)}
						</p>
						<a
							href={config.logoutUrl}
							className="inline-block mt-4 px-4 py-2 rounded bg-se-primary text-white text-sm font-medium hover:opacity-90"
						>
							{__('Log out', 'storeengine')}
						</a>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="se-pos-shell se-admin-tw h-screen overflow-hidden flex flex-col">
			{/* Mounted at the shell level so manual lock (and idle lock) work on
			    every page, not just the Terminal route. */}
			<IdleLockOverlay />
			<div className="shrink-0 flex items-center gap-6 px-6 py-5 bg-white border-l-0 border-r-0 border-t-0 border-b border-solid border-se-border">
				<a
					href={ admin_url + 'admin.php?page=storeengine' }
					className='no-underline'
				>
					<img
						className="storeengine-logo w-[132px]"
						src={plugin_root_url + 'assets/images/full-logo.svg'}
						alt={__('StoreEngine', 'storeengine')}
					/>
				</a>

				<div className='w-px bg-se-border shrink-0 self-stretch' />

				<div className="flex items-center gap-2 flex-wrap">
					{allCarts.map((c) => {
						const titleParts = [
							c.customer?.first_name,
							c.walkin?.first_name,
							c.walkin?.phone,
						].filter(Boolean);
						const title = titleParts.join(' ').trim();
						return (
							<div key={c.id} className="inline-flex">
								{ ! c.active ? (
									<div className='flex items-center gap-2'>
										<button
											type="button"
											onClick={() => !c.active && dispatch(switchCartTab(c.id))}
											className='relative pl-3 pr-7 py-2 border border-solid text-[12px] font-normal cursor-pointer rounded-full border-se-primary bg-white text-se-primary'
											title={title}
										>
											{sprintf(
												__('Cart %1$d · %2$d', 'storeengine'),
												c.id,
												(c.items || []).length
											)}

											<span
												role="button"
												onClick={(e) => {
													e.stopPropagation();
													if (
														(c.items || []).length &&
														!window.confirm(
															__('Close this cart? Its items will be lost.', 'storeengine')
														)
													) {
														return;
													}
													dispatch(closeCartTab(c.id));
												}}
												className="absolute right-[4px] top-[4px] -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-red-200 hover:bg-red-500 hover:text-white text-red-500 text-[10px] leading-none cursor-pointer"
												title={__('Close cart', 'storeengine')}
											>
												✕
											</span>
										</button>
									</div>
								) : (
									<button
										type="button"
										onClick={() =>
											! c.active && dispatch(switchCartTab(c.id))
										}
										disabled={c.active}
										className='px-3 py-2 border border-solid text-[12px] font-normal border-se-primary bg-se-primary text-white rounded-full cursor-pointer'
										title={title}
									>
										{sprintf(
											__('Cart %1$d · %2$d', 'storeengine'),
											c.id,
											(c.items || []).length
										)}
									</button>
								) }
							</div>
						);
					})}

					<button
						type="button"
						onClick={() => dispatch(newCartTab())}
						className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[12px] font-normal rounded-full cursor-pointer"
						title={__('Stash this cart, start a new one', 'storeengine')}
					>
						+ {__('New cart', 'storeengine')}
					</button>
				</div>

				{ activeRegister && registers.length > 1 && (
					<div className="flex items-center gap-2">
						{ confirmingRegisterChange ? (
							<>
								<span className="text-[12px] text-se-subtitle">
									{ sprintf(
										__( 'Session on %s will stay open.', 'storeengine' ),
										activeRegister.name
									) }
								</span>
								<button
									type="button"
									onClick={ doChangeRegister }
									className="px-3 py-2 border border-solid border-se-primary bg-se-primary text-white text-[12px] font-normal rounded-full cursor-pointer"
								>
									{ __( 'Continue', 'storeengine' ) }
								</button>
								<button
									type="button"
									onClick={ () => setConfirmingRegisterChange(false) }
									className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[12px] font-normal rounded-full cursor-pointer"
								>
									{ __( 'Cancel', 'storeengine' ) }
								</button>
							</>
						) : (
							<button
								type="button"
								onClick={ handleChangeRegister }
								title={ activeRegister.name }
								className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[12px] font-normal rounded-full cursor-pointer hover:border-se-primary hover:text-se-primary transition-colors"
							>
								<span className="max-w-[120px] truncate inline-block align-bottom">
									{ sprintf( __( 'Register: %s', 'storeengine' ), activeRegister.name ) }
								</span>
							</button>
						) }
					</div>
				) }

				<div className="ml-auto flex items-center gap-3 text-sm">
					{ activeSession && (
						<button
							type="button"
							onClick={() => setParkedPanelOpen(true)}
							className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[12px] font-normal rounded-full cursor-pointer"
							title={__('Parked carts', 'storeengine')}
						>
							{__('Parked', 'storeengine')}{' '}
							<span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs rounded-full bg-se-primary text-white">
								{parkedCarts.length}
							</span>
						</button>
					) }

					<button
						type="button"
						onClick={() => setProfileOpen(true)}
						className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[12px] font-normal rounded-full cursor-pointer"
						title={__('Profile + PIN', 'storeengine')}
					>
						{cashier.display_name}
						{cashier.role ? (
							<span className="ml-1 text-xs text-se-muted">
								({cashier.role.replace('storeengine_', '').replace(/_/g, ' ')})
							</span>
						) : null}
					</button>

					<button
						type="button"
						onClick={() => setProfileOpen(true)}
						className="px-3 py-2 border border-solid border-se-border bg-white text-[#101828] text-[12px] font-normal rounded-full cursor-pointer"
					>
						{__('Profile', 'storeengine')}
					</button>

					<button
						type="button"
						onClick={onLockClick}
						className="inline-flex items-center justify-center w-9 h-9 border border-solid border-se-border bg-white text-[#101828] rounded-full cursor-pointer hover:bg-se-bg"
						title={
							hasPin === false
								? __('Set a PIN first — opens Profile', 'storeengine')
								: __('Lock terminal', 'storeengine')
						}
						aria-label={__('Lock terminal', 'storeengine')}
					>
						<svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<rect x="3.5" y="9" width="13" height="9" rx="2" />
							<path d="M6.5 9V6.5a3.5 3.5 0 1 1 7 0V9" />
						</svg>
					</button>

					<a
						href={config.logoutUrl}
						className="px-3 py-2 border border-solid border-se-primary bg-se-primary text-white text-[12px] font-normal rounded-full no-underline cursor-pointer"
					>
						{__('Logout', 'storeengine')}
					</a>
				</div>
			</div>

			<div className='flex flex-row items-stretch flex-1 min-h-0 overflow-hidden'>
				<div className='flex flex-col items-center gap-2 p-4 bg-white border-l-0 border-t-0 border-r border-solid border-se-border h-[calc(100vh-79px)] shrink-0 overflow-hidden w-16'>
					<SidebarBtn
						active={page === 'home'}
						onClick={() => setPage('home')}
						title={__('Terminal', 'storeengine')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
							<path d="M8.33366 10.8332V16.6665H11.667V10.8332H8.33366ZM18.3337 15.8332C18.3337 16.4962 18.0701 17.1327 17.6012 17.6016C17.1324 18.0703 16.4966 18.3332 15.8337 18.3332H4.16699C3.50405 18.3332 2.86823 18.0703 2.39941 17.6016C1.93057 17.1327 1.66699 16.4962 1.66699 15.8332V8.33317C1.66699 7.96975 1.74598 7.61059 1.89893 7.28092C2.05197 6.95109 2.27553 6.65872 2.55322 6.42399L8.38249 1.42806L8.38656 1.4248L8.56152 1.28971C8.98128 0.994267 9.48345 0.833984 10.0003 0.833984C10.5172 0.833984 11.0194 0.994267 11.4391 1.28971L11.6141 1.4248L11.6182 1.42806L17.4474 6.42399L17.5492 6.51432C17.78 6.73208 17.9678 6.99229 18.1017 7.28092C18.2547 7.61059 18.3337 7.96975 18.3337 8.33317V15.8332ZM13.3337 16.6665H15.8337C16.0546 16.6665 16.2666 16.5793 16.4229 16.4232C16.5791 16.2669 16.667 16.0542 16.667 15.8332V8.33317C16.667 8.21203 16.6407 8.09231 16.5897 7.98242C16.5387 7.87248 16.4641 7.77502 16.3716 7.69678L16.3675 7.69271L16.9095 7.06038L16.9347 7.02946L16.3675 7.69271L10.5382 2.69678V2.69759C10.3878 2.57047 10.1973 2.50065 10.0003 2.50065C9.80339 2.50065 9.61281 2.57047 9.4624 2.69759L9.46159 2.69678L3.63314 7.69271L3.0651 7.02946L3.09115 7.06038L3.63314 7.69271L3.62907 7.69678C3.53651 7.77502 3.46198 7.87248 3.41097 7.98242C3.35999 8.09231 3.33366 8.21203 3.33366 8.33317V15.8332C3.33366 16.0542 3.42152 16.2669 3.5778 16.4232C3.73406 16.5793 3.94608 16.6665 4.16699 16.6665H6.66699V10.8332C6.66709 10.3913 6.8428 9.96726 7.15527 9.65479C7.46781 9.34234 7.89172 9.1665 8.33366 9.1665H11.667C12.1089 9.1665 12.5328 9.34234 12.8454 9.65479C13.1578 9.96726 13.3336 10.3913 13.3337 10.8332V16.6665Z" fill="currentColor"/>
						</svg>
					</SidebarBtn>
					<SidebarBtn
						active={page === 'activity'}
						onClick={() => setPage('activity')}
						title={__('My Activity', 'storeengine')}
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="18.5 10 15 10 12.5 17 7.5 3 5 10 1.5 10" />
						</svg>
					</SidebarBtn>
					<SidebarBtn
						active={page === 'add-product'}
						onClick={() => setPage('add-product')}
						title={__('Products', 'storeengine')}
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
							<rect x="2.5" y="2.5" width="15" height="15" rx="3" />
							<path d="M10 6.5v7M6.5 10h7" />
						</svg>
					</SidebarBtn>
					{config.canManage && (
						<SidebarBtn
							active={page === 'inventory'}
							onClick={() => setPage('inventory')}
							title={__('Inventory', 'storeengine')}
						>
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
								<path d="M2.5 6.5 10 2.5l7.5 4v7L10 17.5 2.5 13.5z" />
								<path d="M2.5 6.5 10 10.5l7.5-4M10 10.5v7" />
							</svg>
						</SidebarBtn>
					)}
				</div>

				{page === 'home' && (
					<Terminal onAddProduct={() => setPage('add-product')} />
				)}
				{page === 'activity' && (
					<div className="flex-1 p-6">
						<h2 className="text-base font-semibold text-se-text mb-4">{__('My Activity', 'storeengine')}</h2>
						<MyShiftWidget onCloseShift={() => setCloseShiftOpen(true)} />
					</div>
				)}
				{page === 'add-product' && <ProductsPage />}
				{page === 'inventory' && config.canManage && <InventoryPage />}
			</div>

			{closeShiftOpen && activeSession && (
				<CloseSessionModal
					session={activeSession}
					onClose={() => setCloseShiftOpen(false)}
					onClosed={() => setCloseShiftOpen(false)}
				/>
			)}


			{profileOpen ? (
				<PosProfileModal
					user={cashier}
					onClose={() => setProfileOpen(false)}
				/>
			) : null}

			<ParkedCartsPanel
				open={parkedPanelOpen}
				onClose={() => setParkedPanelOpen(false)}
			/>
		</div>
	);
};

export default App;
