import domReady from '@wordpress/dom-ready';
import { getSeGlobal, StoreEngineDQ } from '@Utils/helper';
import {
	ConvertTimestamps,
	couponAjaxFormHandler,
	couponNudgeApplyAjaxHandler,
	couponRemoveAjaxFormHandler,
	CurrencySwitcher,
	DropdownToggleMenu,
	handleCopyContentButton,
	HandleNoticeAlerts,
	handleReferralCopyButton,
	maskedKeyPreview,
	priceTypeHandler,
	QtyInputHandler,
	singleProductCommentRating,
	dashboardReviews,
	storeengineArchiveProductFilter,
	storeengineArchiveWidgetTermSearch,
	StoreEngineFormAddress,
	storeengineLogin,
	StoreEngineLoopPriceDropdown,
	toggleAddressForm,
	togglePassword,
	UserConfirmAction,
	versionDownloadHandler,
} from '@Utils/ssr';

import SingleProductVariation from '@Frontend/SingleProductVariation';
import SingleProductToggle from '@Frontend/SingleProductToggle';
import StickyAddToCart from '@Frontend/StickyAddToCart';
import RecentlyViewed from '@Frontend/RecentlyViewed';
import SizeGuide from '@Frontend/SizeGuide';
import Wishlist from '@Frontend/Wishlist';
import Compare from '@Frontend/Compare';
import CardVariantSwitcher from '@Frontend/CardVariantSwitcher';
import PriceTypeFilter from '@Frontend/PriceTypeFilter';
import SelectPriceFromQuery from '@Frontend/SelectPriceFromQuery';
import { OrderBumps } from '@Frontend/OrderBumps';

import {
	addToCartAjaxFormHandler,
	handleCartRefresh,
	productBundleInfoToggle,
	removeFromCartAjaxHandler,
	updateCartAjaxFormHandler,
} from '@Frontend/cart.js';

import miniCart from './mini-cart/drawer';
import { initPixelIntegrations } from './pixel-integrations';
// Instant Checkout launcher: exposes window.StoreEngine.Checkout and binds
// `.storeengine-instant-checkout` button clicks. Self-installs on DOM ready.
// Inert when the Instant Checkout addon is disabled (no buttons rendered).
import './instant-checkout/launcher';

// Checkout
import checkoutAjaxFormHandler, {
	sameAsShippingAddress,
} from '@Frontend/checkout/CheckoutManager';
// Exposes window.StoreEngineCheckoutCore for third-party gateway plugins.
import '@CheckoutCore/global';
import {
	initStripeGateway,
	initStripeAddPaymentMethod,
} from '@Frontend/checkout/stripe';
import { initPaypalGateway } from '@Frontend/checkout/paypal';
import { initRazorpayGateway } from '@Frontend/checkout/razorpay';
import { initPaddleGateway } from '@Frontend/checkout/paddle';
import { initAddPaymentMethod } from '@Frontend/add-payment-method';

// Checkout
import Dashboard from '@Frontend/dashboard.js';
import '../assets/scss/frontend.scss';

window.StoreEngineDQ = StoreEngineDQ;

domReady( () => {
	if ( getSeGlobal( 'settings.analytics', false ) ) {
		initPixelIntegrations();
	}

	priceTypeHandler();
	StoreEngineLoopPriceDropdown();
	QtyInputHandler();

	addToCartAjaxFormHandler();
	updateCartAjaxFormHandler();
	removeFromCartAjaxHandler();
	handleCartRefresh();
	productBundleInfoToggle();

	// Order-bump checkbox handler. Document-delegated + idempotent, so this is
	// a no-op on pages without bumps and safe even though the CheckoutManager
	// also calls it on the checkout page. This binding is what enables bumps on
	// the cart page.
	OrderBumps();

	couponAjaxFormHandler();
	couponNudgeApplyAjaxHandler();
	couponRemoveAjaxFormHandler();

	togglePassword();
	storeengineLogin();
	toggleAddressForm();
	StoreEngineFormAddress();
	SingleProductVariation();
	StickyAddToCart();
	RecentlyViewed();
	SizeGuide();
	Wishlist();
	Compare();
	CardVariantSwitcher();
	singleProductCommentRating();
	dashboardReviews();
	storeengineArchiveProductFilter();
	storeengineArchiveWidgetTermSearch();
	HandleNoticeAlerts();
	ConvertTimestamps();
	DropdownToggleMenu();
	UserConfirmAction();
	maskedKeyPreview();
	handleCopyContentButton();
	handleReferralCopyButton();
	versionDownloadHandler();
	miniCart();
	SingleProductToggle();
	CurrencySwitcher();

	// Price-type filter tabs (Lifetime / Yearly / Installment …). Must run before
	// SelectPriceFromQuery so a ?price_id deep-link can reveal its group.
	PriceTypeFilter();

	// Honour ?price_id=… / ?se_action=… in the URL — pre-select that price (and
	// optionally add-to-cart / checkout). Runs last so it overrides defaults.
	SelectPriceFromQuery();

	// Quick View injects a compact single-product page into a modal AFTER
	// domReady, so the single-product initializers above (which scan the DOM
	// once on load) never see it. Re-run them scoped to the injected modal body
	// so the price-type buttons, variation picker + #storeengine-price-placeholder,
	// and Buy Now / Add to Cart button state work exactly like the full product
	// page. Scoped to `scope` so archive-card handlers bound on load aren't
	// double-bound. Add-to-cart submit + quantity steppers are already document-
	// delegated, so they need no re-init. Order mirrors the on-load sequence.
	document.addEventListener( 'storeengine:quickview:loaded', ( e ) => {
		const scope = e.detail && e.detail.scope;
		if ( ! scope ) {
			return;
		}
		priceTypeHandler( scope );
		SingleProductVariation( scope );
		PriceTypeFilter( scope );
	} );

	// When the legacy frontend bundle is also loaded inside the React Quick
	// Checkout iframe, the iframe template uses its own React adapters that
	// were already registered against the shared @CheckoutCore registry.
	// The legacy gateway shells would overwrite those adapters (replacing
	// React Component-based ones with legacy onSelected ones), breaking the
	// React UI. Detect the iframe via the React mount node and skip legacy
	// init in that case — only the React adapters drive the iframe.
	const insideQuickCheckoutIframe = !! document.querySelector(
		'[data-storeengine-checkout]'
	);

	if ( ! insideQuickCheckoutIframe ) {
		// Register Stripe's add-payment-method handler BEFORE the orchestrator
		// fires its init action so the listener catches the initial select.
		initStripeAddPaymentMethod();
		initAddPaymentMethod();

		// checkout
		initStripeGateway();
		initPaypalGateway();
		initRazorpayGateway();
		initPaddleGateway();
	}
	// 2. Boot the checkout manager (binds events, fires init hook).
	checkoutAjaxFormHandler();
	// 3. Other page-level initializations.
	sameAsShippingAddress();

	// Dashboard
	Dashboard();
} );
