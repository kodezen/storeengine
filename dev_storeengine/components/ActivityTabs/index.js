import React, { useEffect, useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { API, namespace, ucwords } from '@Utils/helper';
import Button from '@Components/Button';
import EmailActivity from '@Components/EmailActivity';
import moment from 'moment';
import './styles.scss';
import { Heading } from '@Components/ui';

/**
 * Per-entity activity panel with two tabs: System Logs and Emails.
 *
 * Used inside detail pages (order, abandoned cart, customer) to show every
 * recorded interaction with that record in one place.
 *
 * Props:
 *  - entity: object — one of { order_id }, { customer_id }, { abandoned_cart_id }.
 *    Used to filter both the /logs and /email-logs REST queries to just rows
 *    that mention this entity. The email log can index by these directly;
 *    the system log content is JSON-LIKE searched so this is best-effort
 *    (works when the Logger::log call included the relevant key in the
 *    content array — most StoreEngine calls do).
 *  - title: optional heading override.
 */
const ActivityTabs = ( { entity = {}, title } ) => {
	const [ activeTab, setActiveTab ] = useState( 'emails' );

	// Map our compact entity descriptor onto the param names each REST endpoint
	// actually uses. /email-logs and /logs both accept order_id and customer_id
	// directly; for abandoned carts, /email-logs takes the (related_entity_type,
	// related_entity_id) pair while /logs takes abandoned_cart_id.
	const emailFilter = entity.order_id
		? { order_id: entity.order_id }
		: entity.customer_id
		? { customer_id: entity.customer_id }
		: entity.abandoned_cart_id
		? {
				related_entity_type: 'abandoned_cart',
				related_entity_id: entity.abandoned_cart_id,
		}
		: {};

	const logsFilter = { ...entity }; // /logs accepts the entity keys verbatim.

	return (
		<div className="bg-se-white p-6 rounded-se shadow-se-card border border-se-border mb-6">
			<Heading>
				{ title || __( 'Activity', 'storeengine' ) }
			</Heading>

			<div className="storeengine-page-tabs storeengine-activity-tabs__nav">
				<span
					role="presentation"
					className={ `tab ${
						activeTab === 'emails' ? 'is-active' : ''
					}` }
					onClick={ () => setActiveTab( 'emails' ) }
				>
					{ __( 'Emails', 'storeengine' ) }
				</span>
				<span
					role="presentation"
					className={ `tab ${
						activeTab === 'logs' ? 'is-active' : ''
					}` }
					onClick={ () => setActiveTab( 'logs' ) }
				>
					{ __( 'System Logs', 'storeengine' ) }
				</span>
			</div>

			{ activeTab === 'emails' ? (
				// EmailActivity already provides its own card chrome — pass an
				// empty title so we don't double up the heading.
				<EmailActivity filter={ emailFilter } title=" " />
			) : (
				<SystemLogsList filter={ logsFilter } />
			) }
		</div>
	);
};

const SystemLogsList = ( { filter, perPage = 10 } ) => {
	const [ rows, setRows ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ expandedId, setExpandedId ] = useState( null );

	const fetchRows = useCallback( async () => {
		setLoading( true );
		try {
			const res = await API.get( `${ namespace }logs`, {
				params: { ...filter, per_page: perPage, page: 1 },
			} );
			setRows( res.data || [] );
		} catch ( e ) {
			setRows( [] );
		}
		setLoading( false );
	}, [ JSON.stringify( filter ), perPage ] );

	useEffect( () => {
		fetchRows();
	}, [ fetchRows ] );

	if ( loading ) {
		return (
			<p className="storeengine-activity-tabs__empty">
				{ __( 'Loading…', 'storeengine' ) }
			</p>
		);
	}

	if ( rows.length === 0 ) {
		return (
			<div className="storeengine-warning storeengine-product-notice">
				<span
					className="storeengine-icon storeengine-icon--info-primary"
					aria-hidden={ true }
				/>
				<div className="storeengine-product-notice__body">
					<span className="storeengine-product-notice__title">
						{ __( 'No system logs yet', 'storeengine' ) }
					</span>
					<span className="storeengine-product-notice__text">
						{ __(
							'No system log entries reference this record.',
							'storeengine'
						) }
					</span>
				</div>
			</div>
		);
	}

	return (
		<ul className="storeengine-system-logs-list">
			{ rows.map( ( row ) => {
				const isOpen = expandedId === row.id;
				return (
					<li
						key={ row.id }
						className={ `storeengine-system-logs-list__item storeengine-system-logs-list__item--${ row.status }` }
					>
						<div className="storeengine-system-logs-list__row">
							<div className="storeengine-system-logs-list__main">
								<span className="storeengine-system-logs-list__module">
									{ ucwords(
										( row.module || '' )
											.replace( /[_-]+/g, ' ' )
											.trim()
									) }
								</span>
								<span className="storeengine-system-logs-list__title">
									{ row.title }
								</span>
								<span className="storeengine-system-logs-list__meta">
									{ moment.utc( row.date ).local().fromNow() }
								</span>
							</div>
							<div className="storeengine-system-logs-list__side">
								<span
									className={ `storeengine-status storeengine-status--${ row.status }` }
								>
									{ ucwords(
										( row.status || '' )
											.replace( /[_-]+/g, ' ' )
											.trim()
									) }
								</span>
								<Button
									label={
										isOpen
											? __( 'Hide', 'storeengine' )
											: __( 'Show', 'storeengine' )
									}
									size="sm"
									preset="gray"
									onClick={ () =>
										setExpandedId( isOpen ? null : row.id )
									}
									suffix="activity-log-expand"
								/>
							</div>
						</div>
						{ isOpen && (
							<pre className="storeengine-system-logs-list__content">
								{ formatContent( row.content ) }
							</pre>
						) }
					</li>
				);
			} ) }
		</ul>
	);
};

const formatContent = ( content ) => {
	if ( ! content ) return '';
	try {
		const parsed =
			typeof content === 'string' ? JSON.parse( content ) : content;
		return JSON.stringify( parsed, null, 2 );
	} catch {
		return content;
	}
};

export default ActivityTabs;
