import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocationQuery } from '@Hooks';

/**
 * Settings field deep-link handler.
 *
 * Reads the `field` query param (set by the settings search / a deep link) and,
 * once the active tab has rendered and settings data is loaded, scrolls to that
 * field and flashes a highlight ring. It then strips the param so a refresh or
 * back-navigation doesn't re-trigger.
 *
 * Mechanism: every Formik field renders either `id={name}` (Text/Number/
 * Textarea/Select) or `name={name}` on a real input (Checkbox/Color), and most
 * react-selects pass `name` too. So we resolve the element by id → [name] →
 * an explicit [data-se-field] escape hatch (used by the self-saving addon tabs),
 * then climb to the nearest laid-out wrapper for the scroll/highlight target.
 *
 * Must be rendered INSIDE the `key={path}` wrapper in Settings so it remounts on
 * every tab change — that gives a fresh resolution attempt per navigation.
 */

const WRAPPER_SELECTOR = [
	'.storeengine-text',
	'.storeengine-checkbox',
	'.storeengine-number',
	'.storeengine-textarea-wrap',
	'.storeengine-form-group',
	'.form-group__color',
	'.form-group',
	'.storeengine-column-items',
].join( ', ' );

const HIGHLIGHT_CLASS = 'storeengine-settings-field--highlight';
const HIGHLIGHT_MS = 2200;

const isLaidOut = ( el ) =>
	!! el && typeof el.getClientRects === 'function' && el.getClientRects().length > 0;

/**
 * Resolve a setting key to a visible DOM element to scroll/highlight.
 *
 * @param {string} field setting key (Formik name / DOM id).
 * @return {HTMLElement|null} element, or null if not in the DOM yet.
 */
const resolveTarget = ( field ) => {
	const escaped =
		typeof window !== 'undefined' && window.CSS && window.CSS.escape
			? window.CSS.escape( field )
			: field.replace( /"/g, '\\"' );

	let el =
		document.getElementById( field ) ||
		document.querySelector( `[data-se-field="${ escaped }"]` ) ||
		document.querySelector( `[name="${ escaped }"]` );

	if ( ! el ) {
		return null;
	}

	// Prefer a known field wrapper for a tidy highlight frame.
	const wrapper = el.closest( WRAPPER_SELECTOR );
	let target = wrapper || el;

	// Hidden inputs (e.g. react-select's name carrier) have no box — climb to a
	// laid-out ancestor so scrollIntoView has something to measure.
	if ( ! isLaidOut( target ) ) {
		let probe = el;
		while (
			probe &&
			probe !== document.body &&
			! isLaidOut( probe )
		) {
			probe = probe.parentElement;
		}
		if ( probe && probe !== document.body ) {
			target = probe;
		}
	}

	return isLaidOut( target ) ? target : null;
};

const ScrollToField = ( { path, settingsReady } ) => {
	const location = useLocationQuery();
	const navigate = useNavigate();
	const field = location.getValue( 'field', null );

	useEffect( () => {
		if ( ! field || ! settingsReady ) {
			return undefined;
		}

		let raf = 0;
		let tries = 0;
		let observer = null;
		let observerTimer = 0;
		let done = false;
		const MAX_TRIES = 60; // ~1s at 60fps — covers remount + Formik reinit.

		const clearParam = () => {
			const sp = new URLSearchParams( window.location.search );
			sp.delete( 'field' );
			navigate( { search: sp.toString() }, { replace: true } );
		};

		const finish = ( el ) => {
			if ( done ) {
				return;
			}
			done = true;
			if ( observer ) {
				observer.disconnect();
			}
			if ( observerTimer ) {
				window.clearTimeout( observerTimer );
			}
			cancelAnimationFrame( raf );

			if ( el ) {
				el.scrollIntoView( { behavior: 'smooth', block: 'center' } );
				el.classList.add( HIGHLIGHT_CLASS );
				window.setTimeout(
					() => el.classList.remove( HIGHLIGHT_CLASS ),
					HIGHLIGHT_MS
				);
			} else if ( process.env.NODE_ENV !== 'production' ) {
				// eslint-disable-next-line no-console
				console.warn(
					`[storeengine] settings search: field "${ field }" not found on tab "${ path }" — check the search index entry.`
				);
			}

			clearParam();
		};

		const tick = () => {
			const el = resolveTarget( field );
			if ( el ) {
				finish( el );
				return;
			}
			tries += 1;
			if ( tries >= MAX_TRIES ) {
				// Slow path: lazy/code-split addon tabs or async react-select
				// options may add the field after our poll window. Watch the
				// content area once, with a hard stop so we never leak.
				const root =
					document.querySelector(
						'.storeengine-tab-panel-content'
					) || document.body;
				observer = new MutationObserver( () => {
					const found = resolveTarget( field );
					if ( found ) {
						finish( found );
					}
				} );
				observer.observe( root, { childList: true, subtree: true } );
				observerTimer = window.setTimeout(
					() => finish( resolveTarget( field ) ),
					4000
				);
				return;
			}
			raf = requestAnimationFrame( tick );
		};

		raf = requestAnimationFrame( tick );

		return () => {
			done = true;
			if ( observer ) {
				observer.disconnect();
			}
			if ( observerTimer ) {
				window.clearTimeout( observerTimer );
			}
			cancelAnimationFrame( raf );
		};
	}, [ field, settingsReady, path ] ); // eslint-disable-line react-hooks/exhaustive-deps

	return null;
};

export default ScrollToField;
