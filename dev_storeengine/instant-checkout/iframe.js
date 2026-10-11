/**
 * iframe lifecycle: create overlay, mount iframe, focus trap, ESC, exit-intent,
 * auto-resize via postMessage from the embedded page.
 */
import { listen } from './messenger.js';

const STYLE_ID = 'storeengine-checkout-sdk-styles';

function injectStylesOnce() {
	if ( document.getElementById( STYLE_ID ) ) {
		return;
	}
	const css = `
		/* Default: opaque white full-viewport modal that fades in. The
		   compact 760px-modal mode is opt-in via mount({ fullscreen:false }). */
		.se-checkout-overlay { position: fixed; inset: 0; z-index: 2147483600; display: flex; align-items: stretch; justify-content: center; opacity: 0; transition: opacity .2s ease-out; background: #fff; }
		.se-checkout-overlay.is-open { opacity: 1; }
		.se-checkout-modal { position: relative; width: 100vw; height: 100vh; background: #fff; overflow: hidden; }
		.se-checkout-iframe { display: block; width: 100%; height: 100vh; min-height: 100vh; border: 0; background: #fff; }
		.se-checkout-back {
			position: fixed;
			top: 52px;
			left: 16px;
			height: 40px;
			padding: 4px 12px;
			border: 0;
			border-radius: 4px;
			background: rgba(15,23,42,.08);
			color: #0f172a;
			font-size: 14px;
			font-weight: 600;
			cursor: pointer;
			z-index: 999;

			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
		}

		.se-checkout-back:hover {
			background: rgba(15,23,42,.16);
		}
		/* Round close (X) button, top-right — mirrors the Back button on the
			   left and fills the otherwise-empty corner in the fullscreen layout.
			   Compact mode repositions it (see .is-compact rule below). */
			.se-checkout-close {
				position: fixed;
				top: 52px;
				right: 16px;
				width: 40px;
				height: 40px;
				padding: 0;
				border: 0;
				border-radius: 50%;
				background: rgba(15,23,42,.08);
				color: #0f172a;
				cursor: pointer;
				z-index: 999;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: background .15s ease;
			}
			.se-checkout-close svg { width: 18px; height: 18px; display: block; }
			.se-checkout-close:hover { background: rgba(15,23,42,.16); }
		.se-checkout-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #fff; z-index: 5; }
		.se-checkout-spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #0f172a; border-radius: 50%; animation: se-spin 0.9s linear infinite; }
		@keyframes se-spin { to { transform: rotate(360deg); } }
		body.se-checkout-locked { overflow: hidden; }

		/* Compact (legacy 760px-modal) mode — kept as opt-in for any caller
		   that explicitly passes fullscreen:false. The default is now
		   fullscreen so the React Quick Checkout opens straight into its
		   Shopify-style layout, no resize flash. */
		.se-checkout-overlay.is-compact { background: rgba(15, 23, 42, 0.55); align-items: flex-start; padding: 32px 16px; overflow-y: auto; }
		.se-checkout-overlay.is-compact .se-checkout-modal { width: 100%; max-width: 760px; height: auto; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,.25); transform: translateY(8px); transition: transform .2s ease-out; }
		.se-checkout-overlay.is-compact.is-open .se-checkout-modal { transform: translateY(0); }
		.se-checkout-overlay.is-compact .se-checkout-iframe { height: auto; min-height: 480px; }
		.se-checkout-overlay.is-compact .se-checkout-close { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; font-size: 18px; }

		/* Runtime-toggleable fullscreen for compact modals (used by Paddle
		   overlay handshake). When a compact modal switches to fullscreen
		   we drop the backdrop and stretch to full viewport, then restore. */
		.se-checkout-overlay.is-fullscreen { padding: 0; background: #fff; align-items: stretch; }
		.se-checkout-overlay.is-fullscreen .se-checkout-modal { max-width: none; width: 100vw; height: 100vh; border-radius: 0; box-shadow: none; }
		.se-checkout-overlay.is-fullscreen .se-checkout-iframe { height: 100vh; min-height: 100vh; }
	`;
	const style = document.createElement( 'style' );
	style.id = STYLE_ID;
	style.textContent = css;
	document.head.appendChild( style );
}

export class CheckoutFrame {
	constructor( { storeOrigin, onEvent, fullscreen } ) {
		this.storeOrigin = storeOrigin;
		this.onEvent = onEvent || ( () => {} );
		this.unlisten = null;
		this.exitIntentBound = false;
		this.previouslyFocused = null;
		// Default to fullscreen — Shopify-style React layout. Pass
		// `fullscreen: false` to opt into the legacy 760px-modal look.
		this.fullscreen = fullscreen !== false;
	}

	mount( checkoutUrl ) {
		injectStylesOnce();

		this.overlay = document.createElement( 'div' );
		this.overlay.className =
			'se-checkout-overlay' + ( this.fullscreen ? '' : ' is-compact' );
		this.overlay.setAttribute( 'role', 'dialog' );
		this.overlay.setAttribute( 'aria-modal', 'true' );

		this.modal = document.createElement( 'div' );
		this.modal.className = 'se-checkout-modal';

		this.closeBtn = document.createElement( 'button' );
		this.closeBtn.type = 'button';
		this.closeBtn.className = 'se-checkout-back';
		this.closeBtn.setAttribute( 'aria-label', 'Back' );
		this.closeBtn.innerHTML = '← Back';
		this.closeBtn.addEventListener( 'click', () =>
			this.requestClose( 'user' )
		);

		// Dedicated close (X) affordance, top-right — clearer than the textual
		// "Back" for dismissing the checkout, and it occupies the empty corner
		// of the fullscreen layout.
		this.topCloseBtn = document.createElement( 'button' );
		this.topCloseBtn.type = 'button';
		this.topCloseBtn.className = 'se-checkout-close';
		this.topCloseBtn.setAttribute( 'aria-label', 'Close' );
		this.topCloseBtn.innerHTML =
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
		this.topCloseBtn.addEventListener( 'click', () =>
			this.requestClose( 'user' )
		);

		this.loading = document.createElement( 'div' );
		this.loading.className = 'se-checkout-loading';
		this.loading.innerHTML =
			'<span class="se-checkout-spinner" aria-hidden="true"></span>';

		this.iframe = document.createElement( 'iframe' );
		this.iframe.className = 'se-checkout-iframe';
		this.iframe.setAttribute(
			'sandbox',
			'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'
		);
		this.iframe.setAttribute( 'allow', 'payment *' );
		this.iframe.src = checkoutUrl;
		this.iframe.addEventListener( 'load', () => {
			if ( this.loading && this.loading.parentNode ) {
				this.loading.parentNode.removeChild( this.loading );
			}
		} );

		this.modal.appendChild( this.closeBtn );
		this.modal.appendChild( this.topCloseBtn );
		this.modal.appendChild( this.loading );
		this.modal.appendChild( this.iframe );
		this.overlay.appendChild( this.modal );

		this.overlay.addEventListener( 'click', ( e ) => {
			if ( e.target === this.overlay ) {
				this.requestClose( 'backdrop' );
			}
		} );

		this.previouslyFocused = document.activeElement;
		document.body.appendChild( this.overlay );
		document.body.classList.add( 'se-checkout-locked' );
		requestAnimationFrame( () => this.overlay.classList.add( 'is-open' ) );
		this.closeBtn.focus();

		this.bindKeydown();
		this.bindExitIntent();
		this.unlisten = listen( this.storeOrigin, ( type, payload ) =>
			this.handleMessage( type, payload )
		);

		this.onEvent( 'opened', { url: checkoutUrl } );
	}

	bindKeydown() {
		this.keydownHandler = ( e ) => {
			if ( e.key === 'Escape' ) {
				this.requestClose( 'escape' );
			}
		};
		document.addEventListener( 'keydown', this.keydownHandler );
	}

	bindExitIntent() {
		this.exitIntentHandler = ( e ) => {
			if ( e.clientY <= 0 && ! this.exitIntentBound ) {
				this.exitIntentBound = true;
				this.onEvent( 'exitIntent', null );
			}
		};
		document.addEventListener( 'mouseout', this.exitIntentHandler );
	}

	handleMessage( type, payload ) {
		switch ( type ) {
			case 'ready':
				this.onEvent( 'ready', payload );
				break;
			case 'resize':
				if (
					payload &&
					typeof payload.height === 'number' &&
					this.iframe
				) {
					this.iframe.style.minHeight =
						Math.min(
							payload.height + 24,
							window.innerHeight - 64
						) + 'px';
				}
				break;
			case 'fullscreen.enable':
				if ( this.overlay ) {
					this.overlay.classList.add( 'is-fullscreen' );
				}
				break;
			case 'fullscreen.disable':
				if ( this.overlay ) {
					this.overlay.classList.remove( 'is-fullscreen' );
				}
				break;
			case 'purchase.completed':
				this.onEvent( 'purchase.completed', payload );
				break;
			case 'purchase.failed':
				this.onEvent( 'purchase.failed', payload );
				break;
			case 'close.request':
				this.requestClose( 'iframe' );
				break;
			default:
				this.onEvent( type, payload );
		}
	}

	requestClose( reason ) {
		this.onEvent( 'beforeClose', { reason } );
		this.destroy();
		this.onEvent( 'closed', { reason } );
	}

	destroy() {
		if ( this.unlisten ) {
			this.unlisten();
			this.unlisten = null;
		}
		if ( this.keydownHandler ) {
			document.removeEventListener( 'keydown', this.keydownHandler );
		}
		if ( this.exitIntentHandler ) {
			document.removeEventListener( 'mouseout', this.exitIntentHandler );
		}
		if ( this.overlay && this.overlay.parentNode ) {
			this.overlay.classList.remove( 'is-open' );
			this.overlay.parentNode.removeChild( this.overlay );
		}
		document.body.classList.remove( 'se-checkout-locked' );
		if ( this.previouslyFocused && this.previouslyFocused.focus ) {
			try {
				this.previouslyFocused.focus();
			} catch ( e ) {
				/* noop */
			}
		}
	}
}
