import { __ } from '@wordpress/i18n';

/**
 * Size guide. A delegated click on a `[data-storeengine-size-guide]` trigger
 * opens a shared modal.
 *
 * The resolved chart is inlined next to the trigger as JSON
 * (`.storeengine-size-guide-data`), so there is no network round-trip — which is
 * also why this works inside Quick View.
 *
 * Layout: "Size Charts" and "How to Measure" tabs, the first holding the
 * measurement tables plus a unit switcher when the chart mixes units (e.g. cm
 * and in), the second the chart's rich-text body. A chart with no body renders
 * its tables alone rather than showing a single dead tab.
 */
export default function () {
	let modal = null;
	let lastTrigger = null;

	const ensureModal = () => {
		if ( modal ) {
			return modal;
		}
		const overlay = document.createElement( 'div' );
		overlay.className = 'storeengine-size-guide-modal';
		overlay.hidden = true;
		overlay.setAttribute( 'role', 'dialog' );
		overlay.setAttribute( 'aria-modal', 'true' );
		overlay.innerHTML =
			'<div class="storeengine-size-guide-modal__dialog">' +
			'<button type="button" class="storeengine-size-guide-modal__close" aria-label="Close"></button>' +
			'<div class="storeengine-size-guide-modal__body"></div>' +
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
			.querySelector( '.storeengine-size-guide-modal__close' )
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
			body: overlay.querySelector(
				'.storeengine-size-guide-modal__body'
			),
			close,
		};
		return modal;
	};

	/**
	 * Build one <table> from a chart table definition.
	 *
	 * @param {Object} table Table definition ({ title, unit, columns, rows }).
	 * @return {HTMLElement} The table wrapper element.
	 */
	const buildTable = ( table ) => {
		const wrap = document.createElement( 'div' );
		wrap.className = 'storeengine-size-guide-table';
		if ( table.unit ) {
			wrap.setAttribute( 'data-unit', table.unit );
		}

		if ( table.title ) {
			const caption = document.createElement( 'h3' );
			caption.className = 'storeengine-size-guide-table__title';
			caption.textContent = table.title;
			wrap.appendChild( caption );
		}

		// Own scroll container so a wide chart never scrolls the whole modal.
		const scroller = document.createElement( 'div' );
		scroller.className = 'storeengine-size-guide-table__scroll';

		const el = document.createElement( 'table' );

		const thead = document.createElement( 'thead' );
		const headRow = document.createElement( 'tr' );
		( table.columns || [] ).forEach( ( column ) => {
			const th = document.createElement( 'th' );
			th.scope = 'col';
			th.textContent = column;
			headRow.appendChild( th );
		} );
		thead.appendChild( headRow );
		el.appendChild( thead );

		const tbody = document.createElement( 'tbody' );
		( table.rows || [] ).forEach( ( row ) => {
			const tr = document.createElement( 'tr' );
			row.forEach( ( cell, index ) => {
				// First column is the size label — mark it as the row header.
				const td = document.createElement( index === 0 ? 'th' : 'td' );
				if ( index === 0 ) {
					td.scope = 'row';
				}
				td.textContent = cell;
				tr.appendChild( td );
			} );
			tbody.appendChild( tr );
		} );
		el.appendChild( tbody );

		scroller.appendChild( el );
		wrap.appendChild( scroller );
		return wrap;
	};

	/**
	 * Build the charts panel: optional unit switcher + the measurement tables.
	 *
	 * @param {Array} tables Table definitions from the resolved chart.
	 * @return {HTMLElement} The panel element.
	 */
	const buildChartsPanel = ( tables ) => {
		const panel = document.createElement( 'div' );
		panel.className = 'storeengine-size-guide-panel';

		tables.forEach( ( table ) => panel.appendChild( buildTable( table ) ) );

		const units = [
			...new Set( tables.map( ( t ) => t.unit ).filter( Boolean ) ),
		];
		// Only worth a switcher when the chart actually offers a choice.
		if ( units.length < 2 ) {
			return panel;
		}

		const built = Array.from(
			panel.querySelectorAll( '.storeengine-size-guide-table' )
		);

		const toggle = document.createElement( 'div' );
		toggle.className = 'storeengine-size-guide-units';
		toggle.setAttribute( 'role', 'group' );
		toggle.setAttribute(
			'aria-label',
			__( 'Measurement unit', 'storeengine' )
		);

		const apply = ( unit ) => {
			built.forEach( ( node ) => {
				const nodeUnit = node.getAttribute( 'data-unit' );
				// Unit-less tables (e.g. a fit guide) stay visible always.
				node.hidden = !! nodeUnit && nodeUnit !== unit;
			} );
			toggle
				.querySelectorAll( '.storeengine-size-guide-units__btn' )
				.forEach( ( b ) => {
					const active = b.getAttribute( 'data-unit' ) === unit;
					b.classList.toggle( 'is-active', active );
					b.setAttribute( 'aria-pressed', String( active ) );
				} );
		};

		units.forEach( ( unit ) => {
			const b = document.createElement( 'button' );
			b.type = 'button';
			b.className = 'storeengine-size-guide-units__btn';
			b.setAttribute( 'data-unit', unit );
			b.textContent = unit;
			b.addEventListener( 'click', () => apply( unit ) );
			toggle.appendChild( b );
		} );

		panel.insertBefore( toggle, panel.firstChild );
		apply( units[ 0 ] );

		return panel;
	};

	/**
	 * Build the "how to measure" panel from the chart's rich-text body.
	 *
	 * @param {string} note Server-rendered HTML body.
	 * @return {HTMLElement} The panel element.
	 */
	const buildMeasurePanel = ( note ) => {
		const panel = document.createElement( 'div' );
		panel.className =
			'storeengine-size-guide-panel storeengine-size-guide-note';
		// Server-side kses'd rich text (instructions + any uploaded diagrams).
		panel.innerHTML = note;
		return panel;
	};

	/**
	 * Wire a set of tabs to their panels: click, roving tabindex and the arrow
	 * / Home / End keys the WAI-ARIA tabs pattern expects.
	 *
	 * @param {HTMLElement[]} tabs   Tab buttons, in order.
	 * @param {HTMLElement[]} panels Matching panels, in the same order.
	 */
	const wireTabs = ( tabs, panels ) => {
		const select = ( index, focus = false ) => {
			tabs.forEach( ( tab, i ) => {
				const active = i === index;
				tab.classList.toggle( 'is-active', active );
				tab.setAttribute( 'aria-selected', String( active ) );
				// Roving tabindex: only the active tab is in the tab order, so
				// Tab moves out of the tablist rather than through every tab.
				tab.tabIndex = active ? 0 : -1;
				panels[ i ].hidden = ! active;
			} );
			if ( focus ) {
				tabs[ index ].focus();
			}
		};

		tabs.forEach( ( tab, i ) => {
			tab.addEventListener( 'click', () => select( i ) );
			tab.addEventListener( 'keydown', ( e ) => {
				const last = tabs.length - 1;
				let next = null;
				if ( e.key === 'ArrowRight' ) {
					next = i === last ? 0 : i + 1;
				} else if ( e.key === 'ArrowLeft' ) {
					next = i === 0 ? last : i - 1;
				} else if ( e.key === 'Home' ) {
					next = 0;
				} else if ( e.key === 'End' ) {
					next = last;
				}
				if ( next !== null ) {
					e.preventDefault();
					select( next, true );
				}
			} );
		} );

		select( 0 );
	};

	/**
	 * Render a resolved chart into the modal.
	 *
	 * With a "how to measure" body the modal splits into two tabs; without one
	 * there is nothing to switch between, so the tables render on their own
	 * rather than leaving a lone dead tab.
	 *
	 * @param {HTMLElement} body  Modal body to render into.
	 * @param {Object}      chart Resolved chart payload.
	 */
	const renderChart = ( body, chart ) => {
		body.textContent = '';

		if ( chart.title ) {
			const title = document.createElement( 'h2' );
			title.className = 'storeengine-size-guide-modal__title';
			title.textContent = chart.title;
			body.appendChild( title );
		}

		const content = document.createElement( 'div' );
		content.className = 'storeengine-size-guide-modal__content';

		const chartsPanel = buildChartsPanel( chart.tables || [] );
		const hasNote = !! ( chart.note && chart.note.trim() );

		if ( ! hasNote ) {
			content.appendChild( chartsPanel );
			body.appendChild( content );
			return;
		}

		const measurePanel = buildMeasurePanel( chart.note );

		const specs = [
			{
				label: __( 'Size Charts', 'storeengine' ),
				id: 'charts',
				panel: chartsPanel,
			},
			{
				label: __( 'How to Measure', 'storeengine' ),
				id: 'measure',
				panel: measurePanel,
			},
		];

		const tablist = document.createElement( 'div' );
		tablist.className = 'storeengine-size-guide-tabs';
		tablist.setAttribute( 'role', 'tablist' );
		tablist.setAttribute(
			'aria-label',
			__( 'Size guide sections', 'storeengine' )
		);

		const tabs = specs.map( ( spec ) => {
			const tab = document.createElement( 'button' );
			tab.type = 'button';
			tab.className = 'storeengine-size-guide-tabs__tab';
			tab.id = `storeengine-size-guide-tab-${ spec.id }`;
			tab.setAttribute( 'role', 'tab' );
			tab.setAttribute(
				'aria-controls',
				`storeengine-size-guide-panel-${ spec.id }`
			);
			tab.textContent = spec.label;
			tablist.appendChild( tab );

			spec.panel.id = `storeengine-size-guide-panel-${ spec.id }`;
			spec.panel.setAttribute( 'role', 'tabpanel' );
			spec.panel.setAttribute( 'aria-labelledby', tab.id );
			// Panels are focusable so a keyboard user can reach a scrolling
			// table that contains no other focusable element.
			spec.panel.tabIndex = 0;
			content.appendChild( spec.panel );

			return tab;
		} );

		body.appendChild( tablist );
		body.appendChild( content );

		wireTabs(
			tabs,
			specs.map( ( s ) => s.panel )
		);
	};

	document.addEventListener( 'click', ( e ) => {
		const btn = e.target.closest( '[data-storeengine-size-guide]' );
		if ( ! btn ) {
			return;
		}
		e.preventDefault();

		const root = btn.closest( '.storeengine-size-guide' );
		const dataEl = root
			? root.querySelector( '.storeengine-size-guide-data' )
			: null;

		let chart = null;
		if ( dataEl ) {
			try {
				chart = JSON.parse( dataEl.textContent );
			} catch {
				chart = null;
			}
		}

		// Nothing to show — leave the page alone rather than opening an empty modal.
		if ( ! chart?.tables?.length ) {
			return;
		}

		lastTrigger = btn;
		const { overlay, body } = ensureModal();
		overlay.hidden = false;
		document.documentElement.classList.add( 'storeengine-qv-open' );
		overlay.querySelector( '.storeengine-size-guide-modal__close' ).focus();

		renderChart( body, chart );
	} );
}
