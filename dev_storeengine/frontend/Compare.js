/**
 * Product compare (core).
 *
 * Storage mirrors the wishlist: logged-in shoppers persist to their account
 * (user meta, via REST), guests to their browser (localStorage), and a guest
 * list is merged into the account once on login.
 *
 * Surfaces, all document-delegated so injected markup (Quick View, Recently
 * Viewed, the compare table itself) works without re-binding:
 * - [data-storeengine-compare] toggle buttons on cards / product pages
 * - a docked tray that appears as soon as something is selected
 * - a modal holding the side-by-side table, opened from the tray, so no
 *   compare page has to be created and wired up
 * - [data-storeengine-compare-page], for embedding the same table in a page
 */
const KEY = 'storeengine_compare';
const cfg = window.StoreEngineCompare || {};

const readLocal = () => {
	try {
		const v = JSON.parse( localStorage.getItem( KEY ) );
		return Array.isArray( v ) ? v.map( String ) : [];
	} catch {
		return [];
	}
};
const writeLocal = ( ids ) => {
	try {
		localStorage.setItem( KEY, JSON.stringify( ids ) );
	} catch {
		// storage unavailable — skip.
	}
};

const maxItems = () => Number( cfg.max ) || 4;

// In-memory list for logged-in users (guests read straight from localStorage).
let memoryIds = [];
const getIds = () => ( cfg.isLoggedIn ? memoryIds : readLocal() );

/**
 * Apply the cap by dropping from the front, so the newest pick always wins.
 *
 * Matches storeengine_set_user_compare() and ProductCompare::collect() on the
 * server — all three trim the same end, so the tray and the table can never
 * disagree about what is being compared.
 *
 * @param {Array} ids Candidate ids.
 * @return {string[]} Capped, de-duplicated ids.
 */
const capped = ( ids ) => {
	const unique = Array.from( new Set( ids.map( String ) ) );
	return unique.length > maxItems()
		? unique.slice( unique.length - maxItems() )
		: unique;
};

const setIds = ( next ) => {
	const ids = capped( next );
	if ( cfg.isLoggedIn ) {
		memoryIds = ids;
	} else {
		writeLocal( ids );
	}
	syncUI();
};

const t = ( key, fallback ) => ( cfg.i18n && cfg.i18n[ key ] ) || fallback;

/** Brief inline notice on the tray when the shopper hits the cap. */
function flashLimit() {
	const tray = document.querySelector( '[data-storeengine-compare-tray]' );
	if ( ! tray ) {
		return;
	}
	tray.classList.add( 'is-limit' );
	window.setTimeout( () => tray.classList.remove( 'is-limit' ), 1800 );
}

function syncUI() {
	const current = getIds();

	document
		.querySelectorAll( '[data-storeengine-compare]' )
		.forEach( ( btn ) => {
			const active = current.includes(
				String( btn.getAttribute( 'data-product-id' ) )
			);
			btn.classList.toggle( 'is-active', active );
			btn.setAttribute( 'aria-pressed', String( active ) );
			const label = active
				? t( 'remove', 'Remove from comparison' )
				: t( 'add', 'Compare' );
			btn.setAttribute( 'title', label );
			const text = btn.querySelector( '.storeengine-compare-btn__label' );
			if ( text ) {
				text.textContent = active
					? t( 'added', 'Comparing' )
					: t( 'add', 'Compare' );
			}
		} );

	document
		.querySelectorAll( '[data-storeengine-compare-count]' )
		.forEach( ( el ) => {
			el.textContent = String( current.length );
			el.classList.toggle( 'is-empty', current.length === 0 );
		} );

	renderTray();
}

function toggle( productId ) {
	const pid = String( productId );
	const current = getIds();
	const had = current.includes( pid );

	// Adding past the cap silently evicts the oldest pick, which is confusing
	// unless we say so.
	if ( ! had && current.length >= maxItems() ) {
		flashLimit();
	}

	if ( ! cfg.isLoggedIn ) {
		setIds(
			had ? current.filter( ( x ) => x !== pid ) : [ ...current, pid ]
		);
		renderPage();
		return;
	}

	// Logged-in: optimistic toggle, reconcile with the server response.
	setIds( had ? current.filter( ( x ) => x !== pid ) : [ ...current, pid ] );

	fetch( `${ cfg.restBase }toggle`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': cfg.nonce || '',
		},
		body: JSON.stringify( { product_id: Number( pid ) } ),
	} )
		.then( ( r ) => ( r.ok ? r.json() : Promise.reject( r ) ) )
		.then( ( data ) => {
			if ( data && Array.isArray( data.ids ) ) {
				setIds( data.ids );
			}
			renderPage();
		} )
		.catch( () => {
			// Revert the optimistic change on failure.
			setIds(
				had
					? [ ...getIds(), pid ]
					: getIds().filter( ( x ) => x !== pid )
			);
		} );
}

function mergeGuestIntoAccount() {
	if ( ! cfg.isLoggedIn ) {
		return;
	}
	const local = readLocal();
	if ( ! local.length ) {
		return;
	}
	fetch( `${ cfg.restBase }merge`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': cfg.nonce || '',
		},
		body: JSON.stringify( { ids: local.join( ',' ) } ),
	} )
		.then( ( r ) => ( r.ok ? r.json() : Promise.reject( r ) ) )
		.then( ( data ) => {
			if ( data && Array.isArray( data.ids ) ) {
				memoryIds = data.ids.map( String );
			}
			writeLocal( [] );
			syncUI();
			renderPage();
		} )
		.catch( () => {} );
}

// Cache the last rendered signature so scrolling/syncing doesn't refetch.
let trayKey = '';

function renderTray() {
	const tray = document.querySelector( '[data-storeengine-compare-tray]' );
	if ( ! tray ) {
		return;
	}
	const items = tray.querySelector( '[data-storeengine-compare-tray-items]' );
	const current = getIds();

	if ( ! current.length ) {
		tray.hidden = true;
		trayKey = '';
		if ( items ) {
			items.textContent = '';
		}
		return;
	}

	tray.hidden = false;

	const key = current.join( ',' );
	if ( key === trayKey ) {
		return;
	}
	trayKey = key;

	fetch( `${ cfg.restBase }items?ids=${ encodeURIComponent( key ) }`, {
		headers: { 'X-WP-Nonce': cfg.nonce || '' },
	} )
		.then( ( r ) => ( r.ok ? r.json() : Promise.reject( r ) ) )
		.then( ( data ) => {
			if ( ! items ) {
				return;
			}
			items.textContent = '';
			( ( data && data.items ) || [] ).forEach( ( item ) => {
				const slot = document.createElement( 'div' );
				slot.className = 'storeengine-compare-tray__item';

				const link = document.createElement( 'a' );
				link.href = item.url;
				link.title = item.title;

				const img = document.createElement( 'img' );
				img.src = item.thumb;
				img.alt = item.title;
				img.loading = 'lazy';
				link.appendChild( img );

				const remove = document.createElement( 'button' );
				remove.type = 'button';
				remove.className = 'storeengine-compare-tray__remove';
				remove.setAttribute(
					'data-storeengine-compare-remove',
					item.id
				);
				remove.setAttribute(
					'aria-label',
					t( 'remove', 'Remove from comparison' )
				);
				remove.textContent = '×';

				slot.appendChild( link );
				slot.appendChild( remove );
				items.appendChild( slot );
			} );
		} )
		.catch( () => {} );
}

/* ---------------------------------------------------------------------- *
 * Modal. The table is wide, so it gets a dialog of its own rather than a
 * dedicated page the merchant has to create and wire up.
 * ---------------------------------------------------------------------- */
let modal = null;
let lastTrigger = null;

function ensureModal() {
	if ( modal ) {
		return modal;
	}
	const overlay = document.createElement( 'div' );
	overlay.className = 'storeengine-compare-modal';
	overlay.hidden = true;
	overlay.setAttribute( 'role', 'dialog' );
	overlay.setAttribute( 'aria-modal', 'true' );
	overlay.setAttribute( 'aria-label', t( 'title', 'Compare products' ) );
	overlay.innerHTML =
		'<div class="storeengine-compare-modal__dialog">' +
		'<button type="button" class="storeengine-compare-modal__close" aria-label="' +
		t( 'close', 'Close' ) +
		'"></button>' +
		'<h2 class="storeengine-compare-modal__title">' +
		t( 'title', 'Compare products' ) +
		'</h2>' +
		'<div class="storeengine-compare-modal__body"></div>' +
		'</div>';
	document.body.appendChild( overlay );

	const close = () => {
		overlay.hidden = true;
		document.documentElement.classList.remove( 'storeengine-qv-open' );
		if ( lastTrigger && document.contains( lastTrigger ) ) {
			lastTrigger.focus();
		}
	};
	overlay
		.querySelector( '.storeengine-compare-modal__close' )
		.addEventListener( 'click', close );
	overlay.addEventListener( 'click', ( e ) => {
		if ( e.target === overlay ) {
			close();
		}
	} );
	overlay.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Escape' ) {
			close();
		}
	} );

	modal = {
		overlay,
		body: overlay.querySelector( '.storeengine-compare-modal__body' ),
		close,
	};
	return modal;
}

/**
 * Fetch and render the table into whichever holder is passed.
 *
 * @param {HTMLElement} holder   Element to render the table into.
 * @param {string}      endpoint Table REST endpoint.
 * @param {string}      nonce    REST nonce.
 */
function loadTable( holder, endpoint, nonce ) {
	const current = getIds();
	if ( ! holder || ! endpoint || ! current.length ) {
		return;
	}

	holder.innerHTML = '<div class="storeengine-compare-modal__loading"></div>';

	fetch( `${ endpoint }?ids=${ encodeURIComponent( current.join( ',' ) ) }`, {
		headers: { 'X-WP-Nonce': nonce || '' },
	} )
		.then( ( r ) => ( r.ok ? r.json() : Promise.reject( r ) ) )
		.then( ( data ) => {
			holder.innerHTML = ( data && data.html ) || '';
		} )
		.catch( () => {
			holder.innerHTML = '';
		} );
}

function openModal( trigger ) {
	if ( ! getIds().length ) {
		return;
	}

	const tray = document.querySelector( '[data-storeengine-compare-tray]' );

	lastTrigger = trigger;
	const { overlay, body } = ensureModal();
	overlay.hidden = false;
	document.documentElement.classList.add( 'storeengine-qv-open' );
	overlay.querySelector( '.storeengine-compare-modal__close' ).focus();

	loadTable(
		body,
		tray ? tray.getAttribute( 'data-table' ) : '',
		tray ? tray.getAttribute( 'data-nonce' ) : ''
	);
}

/** Keep an open modal in step when a column is removed from inside it. */
function refreshModal() {
	if ( ! modal || modal.overlay.hidden ) {
		return;
	}
	// Last item removed — nothing left to compare, so close rather than
	// leaving an empty dialog on screen.
	if ( ! getIds().length ) {
		modal.close();
		return;
	}
	const tray = document.querySelector( '[data-storeengine-compare-tray]' );
	loadTable(
		modal.body,
		tray ? tray.getAttribute( 'data-table' ) : '',
		tray ? tray.getAttribute( 'data-nonce' ) : ''
	);
}

function renderPage() {
	const page = document.querySelector( '[data-storeengine-compare-page]' );
	if ( ! page ) {
		return;
	}
	const holder = page.querySelector( '[data-storeengine-compare-table]' );
	const empty = page.querySelector( '.storeengine-compare-page__empty' );
	const current = getIds();

	if ( ! current.length ) {
		if ( holder ) {
			holder.innerHTML = '';
		}
		if ( empty ) {
			empty.hidden = false;
		}
		return;
	}
	if ( empty ) {
		empty.hidden = true;
	}

	fetch(
		`${ page.getAttribute( 'data-table' ) }?ids=${ encodeURIComponent(
			current.join( ',' )
		) }`,
		{ headers: { 'X-WP-Nonce': page.getAttribute( 'data-nonce' ) || '' } }
	)
		.then( ( r ) => ( r.ok ? r.json() : Promise.reject( r ) ) )
		.then( ( data ) => {
			if ( holder ) {
				holder.innerHTML = ( data && data.html ) || '';
			}
			if ( empty ) {
				empty.hidden = !! ( data && data.html && data.html.trim() );
			}
		} )
		.catch( () => {} );
}

export default function () {
	if ( ! cfg.enabled ) {
		return;
	}
	if ( cfg.isLoggedIn ) {
		memoryIds = Array.isArray( cfg.ids ) ? cfg.ids.map( String ) : [];
	} else {
		memoryIds = readLocal();
	}

	syncUI();
	mergeGuestIntoAccount();
	renderPage();

	document.addEventListener( 'click', ( e ) => {
		const open = e.target.closest( '[data-storeengine-compare-open]' );
		if ( open ) {
			e.preventDefault();
			openModal( open );
			return;
		}

		const remove = e.target.closest( '[data-storeengine-compare-remove]' );
		if ( remove ) {
			e.preventDefault();
			toggle( remove.getAttribute( 'data-storeengine-compare-remove' ) );
			refreshModal();
			return;
		}

		if ( e.target.closest( '[data-storeengine-compare-clear]' ) ) {
			e.preventDefault();
			setIds( [] );
			renderPage();
			refreshModal();
			if ( cfg.isLoggedIn ) {
				// Guests are done once localStorage is empty; an account list
				// has to be cleared server-side too or it returns on reload.
				fetch( `${ cfg.restBase }clear`, {
					method: 'POST',
					headers: { 'X-WP-Nonce': cfg.nonce || '' },
				} ).catch( () => {} );
			}
			return;
		}

		const btn = e.target.closest( '[data-storeengine-compare]' );
		if ( ! btn ) {
			return;
		}
		e.preventDefault();
		const pid = btn.getAttribute( 'data-product-id' );
		if ( pid ) {
			toggle( pid );
		}
	} );

	// Keep dynamically-injected compare buttons in sync.
	let scheduled = false;
	const observer = new MutationObserver( ( muts ) => {
		if ( scheduled ) {
			return;
		}
		for ( const m of muts ) {
			for ( const node of m.addedNodes ) {
				if (
					node.nodeType === 1 &&
					( ( node.matches &&
						node.matches( '[data-storeengine-compare]' ) ) ||
						( node.querySelector &&
							node.querySelector(
								'[data-storeengine-compare]'
							) ) )
				) {
					scheduled = true;
					requestAnimationFrame( () => {
						scheduled = false;
						syncUI();
					} );
					return;
				}
			}
		}
	} );
	observer.observe( document.body, { childList: true, subtree: true } );
}
