/**
 * Sortable Utilities.
 */

/**
 * Find the closest ancestor (including itself) that matches a predicate.
 *
 * @internal
 * @see https://github.com/clauderic/react-sortable-hoc/blob/caf3c4f5bfb30894639391ae75c1bfc2b707a127/src/utils.js#L81C8-L91C2
 *
 * @param {Node | null}           el
 * @param {(el: Node) => boolean} fn
 * @return {Node | null} Returns closest element or null.
 */
function closest( el, fn ) {
	while ( el ) {
		if ( fn( el ) ) {
			return el;
		}

		el = el.parentNode;
	}

	return null;
}

/**
 * Determines whether drag sorting should be cancelled.
 *
 * @see https://github.com/clauderic/react-sortable-hoc/blob/master/src/SortableContainer/defaultShouldCancelStart.js
 *
 * @param {MouseEvent | TouchEvent | PointerEvent} event
 * @return {boolean} returns true on default elements + contentEditable.
 */
export function shouldCancelStart( event ) {
	// Cancel sorting if the event target is an input-like element
	const target = /** @type {HTMLElement} */ ( event.target );
	const targetTag = target.tagName.toLowerCase();

	if ( [ 'input', 'textarea', 'select', 'option' ].includes( targetTag ) ) {
		return true;
	}

	// Handle content editable items.
	if (
		closest(
			target,
			( el ) => el instanceof HTMLElement && el.contentEditable === 'true'
		)
	) {
		return true;
	}

	// Handle dropdown menu.
	if (
		'button' === targetTag &&
		target.classList.contains( 'storeengine-dropdown-menu' )
	) {
		return true;
	}

	// Handle switch (styled checkbox) & react-select dropdown (with optional storeengine prefix).
	return !! (
		target.closest( '.storeengine-checkbox' ) ||
		target.closest( '.react-select__control' ) ||
		target.closest( '.storeengine-react-select__control' ) ||
		target.closest( '.storeengine-select' )
	);
}
