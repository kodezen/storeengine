import React, { useEffect, useRef, useState } from 'react';

/**
 * Scan / type-ahead input for the POS terminal.
 *
 * - Wedge scanners (USB barcode guns) type the code and press Enter so fast
 *   that no debounce can keep up; for that path the form's onSubmit does a
 *   one-shot lookup with the typed value and adds the first match.
 * - Cashiers typing manually want suggestions: a 220ms debounce calls the
 *   lookup, the dropdown shows up to 8 matches with name + SKU + barcode +
 *   qty + price. Arrow keys navigate, Enter picks the highlighted row,
 *   Escape closes the dropdown, click selects.
 *
 * Caller wires the lookup + add behaviour:
 *   - onLookup(q): Promise<row[]>  // identical shape to /pos/lookup
 *   - onAdd(row)                   // commits a row to the cart
 *   - onMessage?(text)             // surfaces "no match" / errors to the UI
 */
const ScanInput = ( { onLookup, onAdd, onMessage, autoFocus = true } ) => {
	const inputRef = useRef( null );
	const wrapRef = useRef( null );
	const [ value, setValue ] = useState( '' );
	const [ results, setResults ] = useState( [] );
	const [ active, setActive ] = useState( 0 );
	const [ open, setOpen ] = useState( false );
	const [ loading, setLoading ] = useState( false );
	const reqIdRef = useRef( 0 );

	useEffect( () => {
		if ( autoFocus && inputRef.current ) inputRef.current.focus();
	}, [ autoFocus ] );

	// Click-outside closes the dropdown without losing the typed text.
	useEffect( () => {
		const onClick = ( e ) => {
			if ( wrapRef.current && ! wrapRef.current.contains( e.target ) ) {
				setOpen( false );
			}
		};
		document.addEventListener( 'mousedown', onClick );
		return () => document.removeEventListener( 'mousedown', onClick );
	}, [] );

	// Debounced search.
	useEffect( () => {
		const q = value.trim();
		if ( ! q ) {
			setResults( [] );
			setOpen( false );
			return undefined;
		}
		const myReq = ++reqIdRef.current;
		setLoading( true );
		const t = setTimeout( async () => {
			try {
				const rows = await onLookup( q );
				if ( reqIdRef.current !== myReq ) return; // stale response
				const trimmed = Array.isArray( rows ) ? rows.slice( 0, 8 ) : [];
				setResults( trimmed );
				setActive( 0 );
				setOpen( true );
			} catch ( e ) {
				if ( reqIdRef.current !== myReq ) return;
				setResults( [] );
				setOpen( false );
			} finally {
				if ( reqIdRef.current === myReq ) setLoading( false );
			}
		}, 220 );
		return () => clearTimeout( t );
	}, [ value, onLookup ] );

	const pick = ( row ) => {
		if ( ! row ) return;
		onAdd( row );
		setValue( '' );
		setResults( [] );
		setOpen( false );
		setActive( 0 );
		if ( inputRef.current ) inputRef.current.focus();
	};

	const onSubmit = ( e ) => {
		e.preventDefault();
		// If suggestions are showing, take the highlighted row.
		if ( open && results[ active ] ) {
			pick( results[ active ] );
			return;
		}
		// Otherwise fall back to a one-shot lookup + auto-add — covers the
		// wedge-scanner path where Enter beats the debounce window.
		const q = value.trim();
		if ( ! q ) return;
		onLookup( q )
			.then( ( rows ) => {
				if ( rows && rows.length ) {
					pick( rows[ 0 ] );
				} else {
					if ( onMessage ) onMessage( `No match for "${ q }".` );
					setValue( '' );
					// Wedge scanners fire keys + Enter in rapid succession.
					// Without refocusing here, focus is lost after a no-match,
					// so the next scan goes nowhere — cashier silently re-aims
					// the gun and wonders why nothing's happening.
					if ( inputRef.current ) inputRef.current.focus();
				}
			} )
			.catch( ( err ) => {
				if ( onMessage ) onMessage( err?.message || 'Lookup failed' );
				if ( inputRef.current ) inputRef.current.focus();
			} );
	};

	const onKeyDown = ( e ) => {
		if ( ! open ) return;
		if ( e.key === 'ArrowDown' ) {
			e.preventDefault();
			setActive( ( i ) => Math.min( results.length - 1, i + 1 ) );
		} else if ( e.key === 'ArrowUp' ) {
			e.preventDefault();
			setActive( ( i ) => Math.max( 0, i - 1 ) );
		} else if ( e.key === 'Escape' ) {
			setOpen( false );
		}
	};

	return (
		<div ref={ wrapRef } className="relative">
			<form onSubmit={ onSubmit }>
				<input
					ref={ inputRef }
					type="text"
					autoFocus={ autoFocus }
					placeholder="Scan or type SKU / barcode / product name…"
					value={ value }
					onChange={ ( e ) => setValue( e.target.value ) }
					onKeyDown={ onKeyDown }
					className="storeengine-input"
				/>
			</form>

			{ open && results.length > 0 && (
				<div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-se-border rounded-md shadow-se-pop max-h-72 overflow-y-auto">
					{ results.map( ( r, i ) => (
						<button
							key={ `${ r.product_id }-${ r.variation_id || 0 }` }
							type="button"
							onMouseEnter={ () => setActive( i ) }
							onClick={ () => pick( r ) }
							className={
								'block w-full text-left px-3 py-2 border-b border-se-border last:border-b-0 ' +
								( active === i ? 'bg-se-primary-light' : 'hover:bg-se-bg' )
							}
						>
							<div className="flex items-center gap-2">
								<div className="flex-1 min-w-0">
									<div className="text-sm text-se-text font-medium truncate">
										{ r.product_title || r.sku || `#${ r.product_id }` }
									</div>
									<div className="text-xs text-se-subtitle font-mono truncate">
										{ r.sku || '—' }
										{ r.barcode ? ` · ${ r.barcode }` : '' }
									</div>
								</div>
								<div className="text-right text-xs">
									{ r.location_qty != null && (
										<div
											className={
												'tabular-nums ' +
												( Number( r.location_qty ) > 0
													? 'text-se-text'
													: 'text-se-error' )
											}
										>
											Qty { Number( r.location_qty ) }
										</div>
									) }
									<div className="text-se-subtitle tabular-nums">
										{ Number( r.price || 0 ).toFixed( 2 ) }
									</div>
								</div>
							</div>
						</button>
					) ) }
				</div>
			) }

			{ open &&
				! loading &&
				results.length === 0 &&
				value && (
					<div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-se-border rounded-md shadow-se-pop px-3 py-3 text-xs text-se-subtitle">
						No match.
					</div>
				) }
		</div>
	);
};

export default ScanInput;
