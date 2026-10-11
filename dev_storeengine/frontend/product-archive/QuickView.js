import { el } from '../product-gallery/utils';

const cfg = window.StoreEngineArchive || {};
const i18n = cfg.i18n || {};
// Admin settings (localized): where the modal sits and how it animates in.
const POSITION = cfg.position || 'center'; // center | left | right
const ANIMATION = cfg.animation || 'fade'; // fade | zoom | slide | none

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Quick View modal. Fetches the server-rendered mini single-product markup and
 * injects it, then fires `storeengine:gallery:refresh` (gallery lib enhances the
 * modal gallery) and `storeengine:quickview:loaded` (frontend bundle re-wires the
 * variation picker / price / add-to-cart on the injected markup).
 *
 * Admin-configurable position (center / left / right sidebar) + open animation.
 * Adds prev/next product navigation, a loading skeleton, and dialog a11y
 * (ARIA, focus trap, focus return).
 */
const QuickView = {
	modal: null,
	bound: false,
	lastTrigger: null,
	ids: [], // product ids in grid order, for prev/next
	currentId: null,

	bind() {
		if ( this.bound ) {
			return;
		}
		this.bound = true;
		document.addEventListener( 'click', ( e ) => {
			const btn = e.target.closest( '.storeengine-quick-view-btn' );
			if ( ! btn ) {
				return;
			}
			e.preventDefault();
			const id = btn.getAttribute( 'data-product-id' );
			if ( id ) {
				this.lastTrigger = btn;
				this.collectIds();
				this.open( id );
			}
		} );
	},

	// Record a view in the same localStorage list the Recently Viewed strip
	// reads (product-archive and frontend bundles are separate, so this mirrors
	// the tiny read/write instead of importing across bundles).
	trackRecentlyViewed( id ) {
		const KEY = 'storeengine_recently_viewed';
		const sid = String( id || '' );
		if ( ! sid || sid === '0' ) {
			return;
		}
		try {
			const raw = JSON.parse( localStorage.getItem( KEY ) );
			const list = ( Array.isArray( raw ) ? raw.map( String ) : [] ).filter(
				( x ) => x !== sid
			);
			list.unshift( sid );
			localStorage.setItem( KEY, JSON.stringify( list.slice( 0, 12 ) ) );
		} catch ( e ) {
			// storage unavailable — skip.
		}
	},

	// Product ids in DOM (grid) order — powers prev/next navigation.
	collectIds() {
		this.ids = Array.from(
			document.querySelectorAll(
				'.storeengine-quick-view-btn[data-product-id]'
			)
		)
			.map( ( b ) => b.getAttribute( 'data-product-id' ) )
			.filter( ( v, i, a ) => v && a.indexOf( v ) === i );
	},

	ensureModal() {
		if ( this.modal ) {
			return this.modal;
		}
		const overlay = el(
			'div',
			`storeengine-qv storeengine-qv--pos-${ POSITION } storeengine-qv--anim-${ ANIMATION }`
		);
		overlay.hidden = true;
		overlay.setAttribute( 'role', 'dialog' );
		overlay.setAttribute( 'aria-modal', 'true' );
		overlay.setAttribute( 'aria-label', i18n.quickView || 'Quick View' );

		const dialog = el( 'div', 'storeengine-qv__dialog' );
		const closeBtn = el( 'button', 'storeengine-qv__close' );
		closeBtn.type = 'button';
		closeBtn.setAttribute( 'aria-label', i18n.close || 'Close' );
		const body = el( 'div', 'storeengine-qv__body' );
		dialog.appendChild( closeBtn );
		dialog.appendChild( body );

		// Prev / next product navigation.
		const prev = el(
			'button',
			'storeengine-qv__nav storeengine-qv__nav--prev'
		);
		prev.type = 'button';
		prev.setAttribute( 'aria-label', i18n.prevProduct || 'Previous product' );
		const next = el(
			'button',
			'storeengine-qv__nav storeengine-qv__nav--next'
		);
		next.type = 'button';
		next.setAttribute( 'aria-label', i18n.nextProduct || 'Next product' );
		prev.addEventListener( 'click', () => this.step( -1 ) );
		next.addEventListener( 'click', () => this.step( 1 ) );

		overlay.appendChild( prev );
		overlay.appendChild( next );
		overlay.appendChild( dialog );
		document.body.appendChild( overlay );

		closeBtn.addEventListener( 'click', () => this.close() );
		overlay.addEventListener( 'click', ( e ) => {
			if ( e.target === overlay ) {
				this.close();
			}
		} );
		overlay.addEventListener( 'keydown', ( e ) => this.onKeydown( e ) );

		this.modal = { overlay, body, prev, next };
		return this.modal;
	},

	onKeydown( e ) {
		if ( e.key === 'Escape' ) {
			this.close();
			return;
		}
		if ( e.key === 'Tab' ) {
			this.trapFocus( e );
			return;
		}
		// Arrow keys browse products — but only when focus isn't on a form
		// control (radios / qty input use the arrows themselves).
		const onField =
			e.target && e.target.matches && e.target.matches( 'input, select, textarea' );
		if ( onField ) {
			return;
		}
		if ( e.key === 'ArrowLeft' ) {
			this.step( -1 );
		} else if ( e.key === 'ArrowRight' ) {
			this.step( 1 );
		}
	},

	trapFocus( e ) {
		const nodes = Array.from(
			this.modal.overlay.querySelectorAll( FOCUSABLE )
		).filter( ( n ) => n.offsetParent !== null );
		if ( ! nodes.length ) {
			return;
		}
		const first = nodes[ 0 ];
		const last = nodes[ nodes.length - 1 ];
		if ( e.shiftKey && document.activeElement === first ) {
			e.preventDefault();
			last.focus();
		} else if ( ! e.shiftKey && document.activeElement === last ) {
			e.preventDefault();
			first.focus();
		}
	},

	skeleton() {
		return `
			<div class="storeengine-qv__skeleton" aria-hidden="true">
				<div class="storeengine-qv__sk-block"></div>
				<div>
					<div class="storeengine-qv__sk-line storeengine-qv__sk-line--lg"></div>
					<div class="storeengine-qv__sk-line storeengine-qv__sk-line--sm"></div>
					<div class="storeengine-qv__sk-line"></div>
					<div class="storeengine-qv__sk-line"></div>
					<div class="storeengine-qv__sk-line storeengine-qv__sk-line--sm"></div>
				</div>
			</div>`;
	},

	updateNav() {
		const { prev, next } = this.modal;
		const idx = this.ids.indexOf( String( this.currentId ) );
		const has = this.ids.length > 1 && idx !== -1;
		prev.hidden = ! has;
		next.hidden = ! has;
		if ( has ) {
			prev.disabled = idx <= 0;
			next.disabled = idx >= this.ids.length - 1;
		}
	},

	step( delta ) {
		if ( ! this.ids.length ) {
			return;
		}
		const idx = this.ids.indexOf( String( this.currentId ) );
		const nextIdx = idx + delta;
		if ( idx === -1 || nextIdx < 0 || nextIdx >= this.ids.length ) {
			return;
		}
		this.load( this.ids[ nextIdx ] );
	},

	open( id ) {
		const { overlay } = this.ensureModal();
		overlay.hidden = false;
		document.documentElement.classList.add( 'storeengine-qv-open' );
		// Force a reflow so the enter transition runs from the initial state.
		void overlay.offsetWidth;
		requestAnimationFrame( () => overlay.classList.add( 'is-open' ) );
		this.load( id );
	},

	load( id ) {
		const { body } = this.modal;
		this.currentId = id;
		body.innerHTML = this.skeleton();
		this.updateNav();
		this.trackRecentlyViewed( id );

		const url = `${ cfg.restUrl || '' }${ id }/quick-view`;
		fetch( url, { headers: { 'X-WP-Nonce': cfg.nonce || '' } } )
			.then( ( r ) => ( r.ok ? r.json() : Promise.reject( r ) ) )
			.then( ( data ) => {
				body.innerHTML = ( data && data.html ) || '';
				// Variable products ship their variation matrix in the payload
				// (the archive page never localizes StoreEngineProductVariations),
				// so expose it before the `quickview:loaded` listeners run.
				if ( data && data.variations ) {
					window.StoreEngineProductVariations = data.variations;
				}
				document.dispatchEvent(
					new CustomEvent( 'storeengine:gallery:refresh', {
						detail: { scope: body },
					} )
				);
				document.dispatchEvent(
					new CustomEvent( 'storeengine:quickview:loaded', {
						detail: { scope: body, id },
					} )
				);
				// Move focus into the dialog for keyboard/AT users.
				const focusTarget =
					body.querySelector( FOCUSABLE ) ||
					this.modal.overlay.querySelector(
						'.storeengine-qv__close'
					);
				if ( focusTarget ) {
					focusTarget.focus();
				}
			} )
			.catch( () => {
				body.innerHTML = `<div class="storeengine-qv__error">${
					i18n.error || 'Could not load the product.'
				}</div>`;
			} );
	},

	close() {
		if ( ! this.modal ) {
			return;
		}
		const { overlay } = this.modal;
		overlay.classList.remove( 'is-open' );

		let finished = false;
		const done = () => {
			if ( finished ) {
				return;
			}
			finished = true;
			overlay.removeEventListener( 'transitionend', done );
			overlay.hidden = true;
			document.documentElement.classList.remove( 'storeengine-qv-open' );
			this.modal.body.innerHTML = '';
			// Return focus to the card's Quick View button (a11y).
			if ( this.lastTrigger && document.contains( this.lastTrigger ) ) {
				this.lastTrigger.focus();
			}
		};

		if ( ANIMATION === 'none' ) {
			done();
		} else {
			overlay.addEventListener( 'transitionend', done );
			// Fallback if transitionend doesn't fire (e.g. reduced-motion).
			setTimeout( done, 400 );
		}
	},
};

export default QuickView;
