import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import {
	API,
	namespace,
	getSeGlobal,
	renderErrorNotification,
} from '@Utils/helper';
import { __, sprintf, _n } from '@wordpress/i18n';
import { doAction } from '@wordpress/hooks';
import Price from '@Components/Currency';
import { StoreEngineLoopPriceDropdown } from '@Utils/ssr';
import { Provider } from 'react-redux';
import store from '@Redux/store';

function MiniCartDrawer() {
	const [ open, setOpen ] = useState( false );
	const [ cartInfo, setCartInfo ] = useState( {
		is_empty: true,
		subtotal: 0,
		cart_items: [],
		cart_items_html: '',
		cart_items_count: 0,
		cart_url: '',
		checkout_url: '',
		shop_url: '',
	} );

	const getCartInfo = React.useCallback( async () => {
		const { data: response } = await API.get(
			namespace + 'mini-cart/current'
		);
		setCartInfo( response );
		const countEls = document.querySelectorAll( '.storeengine-cart-count' );
		const floatingCartBtnEl = document.querySelector(
			'.storeengine-floating-cart'
		);

		if ( countEls.length ) {
			countEls.forEach(
				( el ) => ( el.textContent = response.cart_items_count )
			);
		}
		if ( floatingCartBtnEl ) {
			// show/hide floating cart icon.
			floatingCartBtnEl.style.display =
				response.cart_items_count > 0 ? 'block' : 'none';
		}
	}, [] );

	const closeDrawer = () => {
		setOpen( false );
		document.body.classList.remove( 'no-scroll' );
	};

	const handleClick = React.useCallback( () => {
		setOpen( true );
		document.body.classList.add( 'no-scroll' );

		doAction( 'storeengine.cart.view_cart', {
			cart_info: cartInfo,
			currency: getSeGlobal( 'currency_options.currency', 'USD' ),
			mini_cart: true,
		} );
	}, [ cartInfo ] );

	useEffect( () => {
		getCartInfo().catch( renderErrorNotification );
		window.addEventListener( 'storeengine_cart_updated', getCartInfo );
		return () => {
			window.removeEventListener(
				'storeengine_cart_updated',
				getCartInfo
			);
		};
	}, [ getCartInfo ] );

	// Auto-open the drawer when an item is added (opt-in setting), so shoppers
	// see the updated cart immediately — especially useful from Quick View.
	useEffect( () => {
		if ( ! getSeGlobal( 'settings.auto_open_cart_drawer', false ) ) {
			return undefined;
		}
		const openOnAdd = () => {
			getCartInfo().catch( renderErrorNotification );
			setOpen( true );
			document.body.classList.add( 'no-scroll' );
		};
		window.addEventListener( 'storeengine_cart_item_added', openOnAdd );
		return () => {
			window.removeEventListener(
				'storeengine_cart_item_added',
				openOnAdd
			);
		};
	}, [ getCartInfo ] );

	useEffect( () => {
		const buttons = document.querySelectorAll(
			'[data-storeengine-mini-cart-open-drawer]'
		);

		if ( buttons.length <= 0 ) {
			return;
		}

		buttons.forEach( ( btn ) =>
			btn.addEventListener( 'click', handleClick )
		);

		return () =>
			buttons.forEach( ( btn ) =>
				btn.removeEventListener( 'click', handleClick )
			);
	}, [ handleClick ] );

	useEffect( () => {
		let timeout;
		if ( cartInfo.cart_items_html ) {
			timeout = setTimeout( StoreEngineLoopPriceDropdown, 1000 );
		}
		return () => clearTimeout( timeout );
	}, [ cartInfo ] );

	return (
		<div className="storeengine-mini-cart">
			<Drawer
				open={ open }
				onClose={ closeDrawer }
				className="storeengine-mini-cart-drawer"
				direction="right"
			>
				<div className="storeengine-mini-cart-drawer-content">
					<button
						type="button"
						className="storeengine-mini-cart-drawer-close-btn"
						onClick={ closeDrawer }
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={ 1.5 }
							stroke="currentColor"
							width={ 24 }
							height={ 24 }
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 18 18 6M6 6l12 12"
							/>
						</svg>
					</button>
					{ 0 === parseInt( cartInfo.cart_items_count ) && (
						<div className="storeengine-mini-cart-empty-container">
							<p>
								<strong>
									{ __(
										'Your cart is currently empty!',
										'storeengine'
									) }
								</strong>
							</p>
							<a
								className="storeengine-btn storeengine-btn--bg-blue"
								href={ cartInfo.shop_url }
							>
								{ __( 'Start Shopping', 'storeengine' ) }
							</a>
						</div>
					) }
					{ 0 < parseInt( cartInfo.cart_items_count ) && (
						<>
							<div>
								<h2 className="storeengine-mini-cart-title">
									<span>
										{ __( 'Your cart', 'storeengine' ) }
									</span>
									<span className="storeengine-mini-cart-title-items-counter">
										{ sprintf(
											// translators: %d is the number of products in the cart
											_n(
												'( %d Item )',
												'( %d Items )',
												cartInfo.cart_items_count,
												'storeengine'
											),
											cartInfo.cart_items_count
										) }
									</span>
								</h2>
								<div
									className="storeengine-mini-cart-table"
									dangerouslySetInnerHTML={ {
										__html: cartInfo.cart_items_html,
									} }
								/>
							</div>
							<div className="storeengine-mini-cart-footer">
								<div className="storeengine-mini-cart-sub-total">
									<span className="storeengine-mini-cart-sub-total-label">
										{ __( 'Subtotal', 'storeengine' ) }
									</span>
									<Price value={ cartInfo.subtotal } />
									<div className="storeengine-mini-cart-sub-description">
										{ __(
											'Shipping, taxes, and discounts calculated at checkout.',
											'storeengine'
										) }
									</div>
								</div>
								<div className="storeengine-mini-cart-footer-actions">
									<a
										href={ cartInfo.cart_url }
										className="storeengine-btn storeengine-btn--bg-gray"
									>
										{ __( 'View my cart', 'storeengine' ) }
									</a>
									<a
										href={ cartInfo.checkout_url }
										className="storeengine-btn storeengine-btn--bg-blue"
									>
										{ __(
											'Go to checkout',
											'storeengine'
										) }
									</a>
								</div>
							</div>
						</>
					) }
				</div>
			</Drawer>
		</div>
	);
}

export default function miniCart() {
	// Mount to a container (create one if missing)
	const mountNode = document.getElementById(
		'storeengine-mini-cart-drawer-root'
	);

	if ( mountNode ) {
		const root = ReactDOM.createRoot( mountNode );
		root.render(
			<Provider store={ store }>
				<MiniCartDrawer />
			</Provider>
		);
	}
}
