import React, { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Split save button — a primary save action plus a caret dropdown of
 * "Save as …" options (e.g. Save as Draft / Save as Private).
 *
 * `onSave` is called with no argument for the primary button, or with an
 * option's `status` string when a menu item is chosen.
 *
 * Self-contained inline styles so it looks identical across every editor and
 * doesn't depend on regenerating any shared stylesheet.
 */
const STYLE = {
	group: { position: 'relative', display: 'inline-flex' },
	// Matches the standard ui <Button size="sm">: 32px tall, text-sm/medium,
	// rounded-se (4px), se-primary. Keeps the split button consistent with every
	// other button (Add Product, modal actions, etc.). The color is the
	// `--storeengine-primary-color` CSS variable, not a literal, so it follows
	// the same brand color as everything else (this used to be a hard-coded
	// #006BFF — a visibly different blue from the standard #008DFF primary).
	main: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxSizing: 'border-box',
		height: '32px',
		padding: '0 14px',
		background: 'var(--storeengine-primary-color)',
		color: '#fff',
		border: '1px solid var(--storeengine-primary-color)',
		borderRadius: '4px 0 0 4px',
		fontWeight: 500,
		fontSize: '14px',
		lineHeight: 1,
		cursor: 'pointer',
	},
	mainAlone: { borderRadius: '4px' },
	caret: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		boxSizing: 'border-box',
		height: '32px',
		width: '26px',
		background: 'var(--storeengine-primary-color)',
		color: '#fff',
		border: '1px solid var(--storeengine-primary-color)',
		borderLeft: '1px solid rgba(255,255,255,.4)',
		borderRadius: '0 4px 4px 0',
		cursor: 'pointer',
		fontSize: '11px',
		lineHeight: 1,
		padding: 0,
	},
	disabled: { opacity: 0.6, cursor: 'not-allowed' },
	menu: {
		position: 'absolute',
		top: 'calc(100% + 6px)',
		right: 0,
		background: '#fff',
		border: '1px solid #eaecf0',
		borderRadius: '10px',
		boxShadow: '0 12px 28px rgba(16,24,40,.14)',
		minWidth: '234px',
		zIndex: 100000,
		padding: '6px',
	},
	item: {
		display: 'block',
		width: '100%',
		textAlign: 'left',
		background: 'none',
		border: 'none',
		padding: '9px 12px',
		borderRadius: '8px',
		cursor: 'pointer',
	},
	itemTitle: { display: 'block', fontWeight: 600, color: '#101828', fontSize: '0.92rem' },
	itemDesc: { display: 'block', color: '#667085', fontSize: '0.8rem', marginTop: '2px' },
};

export default function SaveSplitButton( {
	onSave,
	saving = false,
	primaryDisabled = false,
	primaryLabel = __( 'Save', 'storeengine' ),
	savingLabel = __( 'Saving…', 'storeengine' ),
	options = [],
} ) {
	const [ open, setOpen ] = useState( false );
	const ref = useRef( null );

	useEffect( () => {
		if ( ! open ) {
			return;
		}
		const onDoc = ( e ) => {
			if ( ref.current && ! ref.current.contains( e.target ) ) {
				setOpen( false );
			}
		};
		document.addEventListener( 'mousedown', onDoc );
		return () => document.removeEventListener( 'mousedown', onDoc );
	}, [ open ] );

	const hasMenu = options.length > 0;

	return (
		<div ref={ ref } style={ STYLE.group }>
			<button
				type="button"
				style={ {
					...STYLE.main,
					...( hasMenu ? {} : STYLE.mainAlone ),
					...( saving || primaryDisabled ? STYLE.disabled : {} ),
				} }
				onClick={ () => onSave() }
				disabled={ saving || primaryDisabled }
			>
				{ saving ? savingLabel : primaryLabel }
			</button>
			{ hasMenu && (
				<button
					type="button"
					style={ { ...STYLE.caret, ...( saving ? STYLE.disabled : {} ) } }
					onClick={ () => setOpen( ( o ) => ! o ) }
					aria-label={ __( 'More save options', 'storeengine' ) }
					aria-expanded={ open }
					disabled={ saving }
				>
					▾
				</button>
			) }
			{ open && (
				<div style={ STYLE.menu }>
					{ options.map( ( item ) => (
						<button
							key={ item.status }
							type="button"
							style={ STYLE.item }
							onMouseEnter={ ( e ) => ( e.currentTarget.style.background = '#f9fafb' ) }
							onMouseLeave={ ( e ) => ( e.currentTarget.style.background = 'none' ) }
							onClick={ () => {
								setOpen( false );
								onSave( item.status );
							} }
						>
							<span style={ STYLE.itemTitle }>{ item.title }</span>
							{ item.desc && <span style={ STYLE.itemDesc }>{ item.desc }</span> }
						</button>
					) ) }
				</div>
			) }
		</div>
	);
}

SaveSplitButton.propTypes = {
	onSave: PropTypes.func.isRequired,
	saving: PropTypes.bool,
	primaryDisabled: PropTypes.bool,
	primaryLabel: PropTypes.string,
	savingLabel: PropTypes.string,
	options: PropTypes.arrayOf(
		PropTypes.shape( {
			status: PropTypes.string.isRequired,
			title: PropTypes.string.isRequired,
			desc: PropTypes.string,
		} )
	),
};
