import React, { useEffect, useMemo, useState } from 'react';
import { Select } from '@Components/ui';
import { CustomerApi } from './api';

const STATUS_BADGE = {
	requested: 'bg-yellow-100 text-yellow-800',
	approved: 'bg-blue-100 text-blue-800',
	shipped_by_customer: 'bg-indigo-100 text-indigo-800',
	received: 'bg-purple-100 text-purple-800',
	refunded: 'bg-green-100 text-green-800',
	cancelled: 'bg-gray-200 text-gray-700',
};

const STATUS_LABEL = {
	requested: 'Pending review',
	approved: 'Approved — ready to ship',
	shipped_by_customer: 'In transit',
	received: 'Received',
	refunded: 'Refunded',
	cancelled: 'Cancelled',
};

const App = ( { config } ) => {
	const api = useMemo( () => new CustomerApi( config ), [ config ] );
	const orderId = Number( config.orderId || 0 );
	const [ mode, setMode ] = useState( orderId ? 'compose' : 'list' );
	const [ activeRma, setActiveRma ] = useState( null );
	const [ history, setHistory ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( '' );

	useEffect( () => {
		if ( mode !== 'list' ) return;
		setLoading( true );
		api
			.get( 'me/returns' )
			.then( setHistory )
			.catch( ( e ) => setError( e.message ) )
			.finally( () => setLoading( false ) );
	}, [ api, mode ] );

	if ( mode === 'compose' && orderId ) {
		return (
			<div className="se-admin-tw">
				<Compose
					api={ api }
					orderId={ orderId }
					onDone={ () => setMode( 'list' ) }
					onCancel={ () => setMode( 'list' ) }
				/>
			</div>
		);
	}

	if ( mode === 'detail' && activeRma ) {
		return (
			<div className="se-admin-tw">
				<Detail
					api={ api }
					rmaId={ activeRma }
					onBack={ () => {
						setActiveRma( null );
						setMode( 'list' );
					} }
				/>
			</div>
		);
	}

	return (
		<div className="se-admin-tw">
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<h2 className="m-0 text-lg font-semibold text-se-text">
					Your returns
				</h2>
				<p className="mt-2 text-sm text-se-subtitle">
					To request a return, open the order in your account and click
					"Request return". You can track the status of all your
					returns below.
				</p>

				{ error && (
					<div className="mt-4 p-3 bg-se-error-light text-se-error rounded text-sm">
						{ error }
					</div>
				) }

				{ loading ? (
					<p className="mt-4 text-se-subtitle text-sm">Loading…</p>
				) : history.length === 0 ? (
					<p className="mt-4 text-se-subtitle text-sm">
						You haven't requested any returns yet.
					</p>
				) : (
					<table className="w-full mt-4 text-sm">
						<thead className="text-se-subtitle text-xs uppercase tracking-wide border-b border-se-border">
							<tr>
								<th className="text-left py-2 pr-3">RMA</th>
								<th className="text-left py-2 pr-3">Order</th>
								<th className="text-left py-2 pr-3">Status</th>
								<th className="text-right py-2 pr-3">
									Refund
								</th>
								<th className="text-left py-2 pr-3">Created</th>
								<th className="text-right py-2"></th>
							</tr>
						</thead>
						<tbody className="divide-y divide-se-border">
							{ history.map( ( r ) => {
								const open = () => {
									setActiveRma( Number( r.id ) );
									setMode( 'detail' );
								};
								const cta = r.status === 'approved'
									? 'Submit shipment details →'
									: 'View details →';
								return (
									<tr
										key={ r.id }
										className="cursor-pointer hover:bg-se-bg"
										onClick={ open }
									>
										<td className="py-2 pr-3 font-mono text-xs">
											{ r.rma_number }
										</td>
										<td className="py-2 pr-3">
											#{ r.order_id }
										</td>
										<td className="py-2 pr-3">
											<span
												className={ `inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wide ${
													STATUS_BADGE[ r.status ] ||
													'bg-gray-200 text-gray-700'
												}` }
											>
												{ STATUS_LABEL[ r.status ] || r.status }
											</span>
										</td>
										<td className="py-2 pr-3 text-right">
											{ r.refund_amount }
										</td>
										<td className="py-2 pr-3 text-se-subtitle text-xs">
											{ r.date_created }
										</td>
										<td className="py-2 text-right">
											<button
												type="button"
												onClick={ ( e ) => {
													e.stopPropagation();
													open();
												} }
												className={ `text-xs font-medium ${ r.status === 'approved' ? 'text-blue-600 hover:text-blue-800' : 'text-se-subtitle hover:text-se-text' }` }
											>
												{ cta }
											</button>
										</td>
									</tr>
								);
							} ) }
						</tbody>
					</table>
				) }
			</div>
		</div>
	);
};

/**
 * Compose — the return-request form. Used by the customer dashboard
 * shortcode (`staffMode={false}`, default) and by the admin "Open return"
 * modal on the order editor (`staffMode={true}`).
 *
 * The two modes differ only in transport:
 *  - customer hits owner-checked /me/orders/{id}/return-eligibility + .../return
 *  - staff hits /returns/composer/{id} + POST /returns (admin-cap'd)
 */
export const Compose = ( {
	api,
	orderId,
	onDone,
	onCancel,
	staffMode = false,
	customerId = 0,
} ) => {
	const [ data, setData ] = useState( null );
	const [ selected, setSelected ] = useState( {} );
	const [ note, setNote ] = useState( '' );
	const [ uploads, setUploads ] = useState( [] ); // { id, url, type }
	const [ uploading, setUploading ] = useState( false );
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState( '' );

	const fetchPath = staffMode
		? `returns/composer/${ orderId }`
		: `me/orders/${ orderId }/return-eligibility`;

	const handleFiles = async ( files ) => {
		if ( ! files?.length ) return;
		setUploading( true );
		setError( '' );
		try {
			const added = [];
			for ( const file of Array.from( files ).slice( 0, 8 ) ) {
				// 15 MB cap covers a quick phone clip + most photos. WP's
				// own upload_max_filesize / post_max_size still applies on
				// top, so a stricter server config wins.
				if ( file.size > 15 * 1024 * 1024 ) {
					throw new Error( `"${ file.name }" exceeds 15 MB.` );
				}
				const res = await api.uploadMedia( file );
				added.push( {
					id: Number( res.id ),
					url: res.source_url || '',
					mime: res.mime_type || '',
					type: ( res.mime_type || '' ).startsWith( 'video/' )
						? 'video'
						: 'image',
				} );
			}
			setUploads( ( prev ) => [ ...prev, ...added ].slice( 0, 8 ) );
		} catch ( e ) {
			setError( e.message );
		} finally {
			setUploading( false );
		}
	};

	useEffect( () => {
		api
			.get( fetchPath )
			.then( ( res ) => {
				setData( res );
				const seed = {};
				( res.items || [] ).forEach( ( item ) => {
					// Default to returning 1 (the common case) when the line has
					// any returnable qty; lines with nothing left stay at 0.
					seed[ item.order_item_id ] = {
						qty: Number( item.returnable_qty ) > 0 ? 1 : 0,
						reason_id: 0,
					};
				} );
				setSelected( seed );
			} )
			.catch( ( e ) => setError( e.message ) );
	}, [ api, fetchPath ] );

	const submit = async () => {
		setSubmitting( true );
		setError( '' );
		try {
			const items = Object.entries( selected )
				.filter( ( [ , v ] ) => Number( v.qty ) > 0 )
				.map( ( [ orderItemId, v ] ) => {
					const meta = data?.items?.find(
						( i ) =>
							Number( i.order_item_id ) ===
							Number( orderItemId )
					);
					const base = {
						order_item_id: Number( orderItemId ),
						qty: Number( v.qty ),
						reason_id: Number( v.reason_id ) || undefined,
					};
					// Staff path goes to POST /returns which expects the
					// fuller payload (refund_amount, product_id, etc.).
					if ( staffMode && meta ) {
						return {
							...base,
							product_id: Number( meta.product_id ),
							variation_id: Number( meta.variation_id ),
							sku: meta.sku,
							refund_amount:
								Number( meta.unit_price ) * Number( v.qty ),
						};
					}
					return base;
				} );

			if ( ! items.length ) {
				setError( 'Pick at least one item to return.' );
				setSubmitting( false );
				return;
			}

			if ( staffMode ) {
				await api.post( 'returns', {
					order_id: Number( orderId ),
					customer_id: Number( customerId ) || 0,
					customer_note: note,
					restock_default: true,
					items,
				} );
			} else {
				await api.post( `me/orders/${ orderId }/return`, {
					items,
					customer_note: note,
					request_attachment_ids: uploads.map( ( u ) => u.id ),
				} );
			}
			onDone();
		} catch ( e ) {
			setError( e.message );
		} finally {
			setSubmitting( false );
		}
	};

	if ( ! data && ! error ) {
		return (
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5 text-sm text-se-subtitle">
				Loading order…
			</div>
		);
	}

	if ( error && ! data ) {
		return (
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5 text-sm text-se-error">
				{ error }
				<div className="mt-4">
					<button
						type="button"
						className="px-3 py-1.5 rounded border border-se-border bg-white text-sm"
						onClick={ onCancel }
					>
						Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
			<h2 className="m-0 text-lg font-semibold text-se-text">
				Request a return for order #{ data.order_id }
			</h2>
			<ol className="mt-2 mb-0 text-xs text-se-subtitle list-decimal pl-5 space-y-1">
				<li>Pick which items you want to send back and the qty.</li>
				<li>Choose a reason for each — and write a short note so we know what to look for.</li>
				<li>Attach a couple of photos or a quick video if the item is damaged.</li>
				<li>
					After we approve your request, we'll email a return
					address. Ship the package and submit the courier
					details in your account.
				</li>
			</ol>

			{ error && (
				<div className="mt-4 p-3 bg-se-error-light text-se-error rounded text-sm">
					{ error }
				</div>
			) }

			<table className="w-full mt-4 text-sm">
				<thead className="text-se-subtitle text-xs uppercase tracking-wide border-b border-se-border">
					<tr>
						<th className="text-left py-2 pr-3">Item</th>
						<th className="text-right py-2 pr-3">Bought</th>
						<th className="text-right py-2 pr-3">
							Returnable
						</th>
						<th className="text-right py-2 pr-3 w-24">
							Qty to return
						</th>
						<th className="text-left py-2">Reason</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-se-border">
					{ ( data.items || [] ).map( ( item ) => {
						const sel = selected[ item.order_item_id ] || {
							qty: 0,
							reason_id: 0,
						};
						const max = Number( item.returnable_qty );
						return (
							<tr key={ item.order_item_id }>
								<td className="py-2 pr-3">
									<div className="text-se-text font-medium">
										{ item.name }
									</div>
									{ item.sku && (
										<div className="text-xs text-se-subtitle font-mono">
											{ item.sku }
										</div>
									) }
								</td>
								<td className="py-2 pr-3 text-right text-se-text">
									{ item.qty }
								</td>
								<td className="py-2 pr-3 text-right text-se-text">
									{ item.returnable_qty }
								</td>
								<td className="py-2 pr-3 text-right">
									<input
										type="number"
										min={ 0 }
										max={ max }
										value={ sel.qty }
										disabled={ max === 0 }
										onChange={ ( e ) =>
											setSelected( {
												...selected,
												[ item.order_item_id ]: {
													...sel,
													qty: Math.max(
														0,
														Math.min(
															max,
															Number(
																e.target.value
															) || 0
														)
													),
												},
											} )
										}
										className="w-20 px-2 py-1 border border-se-border rounded text-sm text-right bg-white disabled:opacity-50"
									/>
								</td>
								<td className="py-2">
									<Select
										value={ sel.reason_id }
										onChange={ ( val ) =>
											setSelected( {
												...selected,
												[ item.order_item_id ]: {
													...sel,
													reason_id: Number(
														val
													),
												},
											} )
										}
										className="px-2 py-1 border border-se-border rounded text-sm bg-white"
									>
										<option value={ 0 }>—</option>
										{ ( data.reasons || [] ).map(
											( r ) => (
												<option
													key={ r.id }
													value={ r.id }
												>
													{ r.label }
												</option>
											)
										) }
									</Select>
								</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>

			<label className="flex flex-col gap-1 text-xs text-se-subtitle mt-4">
				<span className="text-sm text-se-text font-medium">
					Tell us what happened
				</span>
				<span className="text-xs">
					Describe the issue in your own words — size, defect,
					mismatch, how soon you noticed, etc. The more detail you
					provide here, the faster we can approve your return.
				</span>
				<textarea
					rows={ 4 }
					value={ note }
					onChange={ ( e ) => setNote( e.target.value ) }
					placeholder="e.g. The fabric tore on the second wear along the back seam."
					className="mt-1 px-2 py-1.5 border border-se-border rounded text-sm bg-white"
				/>
			</label>

			{ ! staffMode && (
				<div className="mt-4">
					<div className="text-sm text-se-text font-medium">
						Add photos or a short video (optional but recommended)
					</div>
					<p className="text-xs text-se-subtitle mt-1">
						Up to 8 files, 15 MB each. Photos of the damage or
						defect, or a short clip showing the issue, help us
						approve faster. Accepted: jpg, png, heic, mp4, webm.
					</p>
					<input
						type="file"
						accept="image/*,video/*"
						multiple
						onChange={ ( e ) => handleFiles( e.target.files ) }
						disabled={ uploading || submitting }
						className="mt-2 text-xs"
					/>
					{ uploading && (
						<p className="mt-1 text-xs text-se-subtitle">
							Uploading…
						</p>
					) }
					{ !! uploads.length && (
						<div className="mt-3 flex flex-wrap gap-2">
							{ uploads.map( ( u ) => (
								<div
									key={ u.id }
									className="relative w-20 h-20 border border-se-border rounded overflow-hidden bg-white"
								>
									{ u.type === 'video' ? (
										<div className="w-full h-full flex items-center justify-center bg-black text-white text-xs">
											▶ video
										</div>
									) : (
										<img
											src={ u.url }
											alt=""
											className="w-full h-full object-cover"
										/>
									) }
									<button
										type="button"
										onClick={ () =>
											setUploads(
												uploads.filter(
													( x ) => x.id !== u.id
												)
											)
										}
										className="absolute top-0 right-0 px-1 text-xs bg-black/60 text-white"
									>
										×
									</button>
								</div>
							) ) }
						</div>
					) }
				</div>
			) }

			<div className="flex justify-end gap-2 mt-4">
				<button
					type="button"
					className="px-3 py-2 rounded border border-se-border bg-white text-sm"
					onClick={ onCancel }
					disabled={ submitting }
				>
					Cancel
				</button>
				<button
					type="button"
					className="px-4 py-2 rounded bg-se-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
					onClick={ submit }
					disabled={ submitting || uploading }
				>
					{ submitting ? 'Submitting…' : 'Submit return' }
				</button>
			</div>
		</div>
	);
};

/**
 * Detail — single-return view. Shows the timeline, line items, and (when
 * status is 'approved') the customer-side ship form: courier free-text,
 * tracking number, proof photo uploads, optional return-shipping fee.
 *
 * Phase-1 deliberately keeps everything in one screen so the customer can
 * see what they shipped, against what, after they submit.
 */
export const Detail = ( { api, rmaId, onBack } ) => {
	const [ rma, setRma ] = useState( null );
	const [ error, setError ] = useState( '' );
	const [ loading, setLoading ] = useState( true );

	const load = () => {
		setLoading( true );
		setError( '' );
		api
			.get( `me/returns/${ rmaId }` )
			.then( setRma )
			.catch( ( e ) => setError( e.message ) )
			.finally( () => setLoading( false ) );
	};

	useEffect( load, [ api, rmaId ] );

	if ( loading ) {
		return (
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5 text-sm text-se-subtitle">
				Loading return…
			</div>
		);
	}
	if ( error || ! rma ) {
		return (
			<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
				<p className="text-sm text-se-error m-0">{ error || 'Return not found.' }</p>
				<button
					type="button"
					className="mt-3 px-3 py-1.5 rounded border border-se-border bg-white text-sm"
					onClick={ onBack }
				>
					Back
				</button>
			</div>
		);
	}

	return (
		<div className="bg-white border border-se-border rounded-md shadow-se-card p-5">
			<button
				type="button"
				className="text-sm text-se-subtitle hover:text-se-text mb-3"
				onClick={ onBack }
			>
				← Back to returns
			</button>

			<div className="flex items-baseline gap-3 flex-wrap">
				<h2 className="m-0 text-lg font-semibold text-se-text">
					{ rma.rma_number }
				</h2>
				<span className="text-sm text-se-subtitle">Order #{ rma.order_id }</span>
				<span className={ `ml-auto inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wide ${ STATUS_BADGE[ rma.status ] || 'bg-gray-200 text-gray-700' }` }>
					{ STATUS_LABEL[ rma.status ] || rma.status }
				</span>
			</div>

			<Timeline rma={ rma } />

			<Items items={ rma.items || [] } />

			<RequestEvidence rma={ rma } />

			{ rma.status === 'approved' && (
				<ShipForm
					api={ api }
					rma={ rma }
					onSubmitted={ load }
				/>
			) }

			{ rma.status !== 'approved' && rma.tracking_number && (
				<ShipmentSummary rma={ rma } />
			) }
		</div>
	);
};

const Timeline = ( { rma } ) => {
	const steps = [
		{ key: 'requested', label: 'Requested', at: rma.date_created },
		{ key: 'approved', label: 'Approved', at: rma.approved_at },
		{ key: 'shipped_by_customer', label: 'In transit', at: rma.shipped_at },
		{ key: 'received', label: 'Received', at: rma.received_at },
		{ key: 'refunded', label: 'Refunded', at: rma.refunded_at },
	];
	const reachedIndex = steps.findIndex( ( s ) => s.key === rma.status );
	return (
		<ol className="mt-4 flex flex-wrap gap-4 text-xs">
			{ steps.map( ( s, i ) => {
				const done = i <= reachedIndex;
				return (
					<li
						key={ s.key }
						className={ `flex items-center gap-2 ${ done ? 'text-se-text' : 'text-se-subtitle' }` }
					>
						<span
							className={ `inline-block w-2 h-2 rounded-full ${ done ? 'bg-green-500' : 'bg-gray-300' }` }
						/>
						<span>{ s.label }</span>
						{ s.at && <span className="text-se-subtitle">· { s.at }</span> }
					</li>
				);
			} ) }
		</ol>
	);
};

const Items = ( { items } ) => {
	if ( ! items?.length ) return null;
	return (
		<table className="w-full mt-4 text-sm">
			<thead className="text-se-subtitle text-xs uppercase tracking-wide border-b border-se-border">
				<tr>
					<th className="text-left py-2 pr-3">Product</th>
					<th className="text-right py-2 pr-3">Qty</th>
					<th className="text-right py-2 pr-3">Refund</th>
				</tr>
			</thead>
			<tbody className="divide-y divide-se-border">
				{ items.map( ( it ) => (
					<tr key={ it.id }>
						<td className="py-2 pr-3">
							<div className="text-se-text font-medium">
								{ it.name ||
									( Number( it.product_id ) > 0
										? `Product #${ it.product_id }`
										: '—' ) }
							</div>
							{ it.sku && (
								<div className="text-xs text-se-subtitle font-mono">
									{ it.sku }
								</div>
							) }
						</td>
						<td className="py-2 pr-3 text-right">{ it.qty }</td>
						<td className="py-2 pr-3 text-right">{ it.refund_amount }</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
};

/**
 * Renders the customer's note + photo/video evidence captured when the
 * return was REQUESTED. Separate from ShipmentSummary which renders the
 * courier slip uploaded after shipping.
 */
const RequestEvidence = ( { rma } ) => {
	const note = (rma.customer_note || '').trim();
	const atts = Array.isArray( rma.request_attachments ) ? rma.request_attachments : [];
	if ( ! note && ! atts.length ) return null;
	return (
		<div className="mt-6 p-4 border border-se-border rounded">
			<h4 className="m-0 text-sm font-semibold text-se-text">
				Your description
			</h4>
			{ note && (
				<p className="mt-2 text-sm text-se-text whitespace-pre-line">
					{ note }
				</p>
			) }
			{ atts.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-2">
					{ atts.map( ( att ) => (
						<a
							key={ att.id }
							href={ att.url }
							target="_blank"
							rel="noreferrer"
							className="inline-block w-20 h-20 rounded overflow-hidden border border-se-border bg-white"
						>
							{ att.type === 'video' ? (
								<div className="w-full h-full flex items-center justify-center bg-black text-white text-xs">
									▶ video
								</div>
							) : (
								<img
									src={ att.thumbnail || att.url }
									alt=""
									className="w-full h-full object-cover"
								/>
							) }
						</a>
					) ) }
				</div>
			) }
		</div>
	);
};

const ShipmentSummary = ( { rma } ) => (
	<div className="mt-6 p-4 border border-se-border rounded bg-se-bg">
		<h4 className="m-0 text-sm font-semibold text-se-text">
			Shipment details
		</h4>
		<div className="mt-2 text-sm text-se-text">
			<div>Courier: <strong>{ rma.tracking_carrier || '—' }</strong></div>
			<div>Tracking: <strong className="font-mono">{ rma.tracking_number || '—' }</strong></div>
			{ rma.shipped_at && <div className="text-se-subtitle text-xs mt-1">Posted { rma.shipped_at }</div> }
		</div>
		{ Array.isArray( rma.proof_attachments ) && rma.proof_attachments.length > 0 && (
			<div className="mt-3 flex flex-wrap gap-2">
				{ rma.proof_attachments.map( ( att ) => (
					<a
						key={ att.id }
						href={ att.url }
						target="_blank"
						rel="noreferrer"
						className="inline-block w-16 h-16 rounded overflow-hidden border border-se-border bg-white"
					>
						<img
							src={ att.thumbnail || att.url }
							alt=""
							className="w-full h-full object-cover"
						/>
					</a>
				) ) }
			</div>
		) }
	</div>
);

const ShipForm = ( { api, rma, onSubmitted } ) => {
	const [ carrier, setCarrier ] = useState( '' );
	const [ tracking, setTracking ] = useState( '' );
	const [ fee, setFee ] = useState( '' );
	const [ uploads, setUploads ] = useState( [] ); // { id, url }
	const [ uploading, setUploading ] = useState( false );
	const [ submitting, setSubmitting ] = useState( false );
	const [ error, setError ] = useState( '' );

	const handleFiles = async ( files ) => {
		if ( ! files?.length ) return;
		setUploading( true );
		setError( '' );
		try {
			const added = [];
			for ( const file of Array.from( files ).slice( 0, 5 ) ) {
				if ( file.size > 5 * 1024 * 1024 ) {
					throw new Error( `"${ file.name }" exceeds 5 MB.` );
				}
				const res = await api.uploadMedia( file );
				added.push( {
					id: Number( res.id ),
					url: res.source_url || '',
				} );
			}
			setUploads( ( prev ) => [ ...prev, ...added ].slice( 0, 5 ) );
		} catch ( e ) {
			setError( e.message );
		} finally {
			setUploading( false );
		}
	};

	const submit = async () => {
		setSubmitting( true );
		setError( '' );
		try {
			await api.post( `me/returns/${ rma.id }/ship`, {
				tracking_number: tracking.trim(),
				tracking_carrier: carrier.trim(),
				proof_attachment_ids: uploads.map( ( u ) => u.id ),
				return_shipping_fee: Number( fee ) || 0,
			} );
			onSubmitted?.();
		} catch ( e ) {
			setError( e.message );
		} finally {
			setSubmitting( false );
		}
	};

	return (
		<div className="mt-6 p-4 border border-se-border rounded bg-se-bg">
			<h3 className="m-0 text-sm font-semibold text-se-text">
				Submit shipment details
			</h3>
			<p className="mt-1 text-xs text-se-subtitle">
				Post the package back to us, then enter the courier name +
				tracking number below and upload at least one proof photo
				(the courier slip is perfect).
			</p>

			{ error && (
				<div className="mt-3 p-2 bg-se-error-light text-se-error rounded text-sm">
					{ error }
				</div>
			) }

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
				<label className="text-xs text-se-subtitle">
					Courier name
					<input
						type="text"
						value={ carrier }
						onChange={ ( e ) => setCarrier( e.target.value ) }
						placeholder="e.g. Pathao, Sundarban, DHL"
						className="w-full mt-1 px-2 py-1.5 border border-se-border rounded text-sm bg-white"
					/>
				</label>
				<label className="text-xs text-se-subtitle">
					Tracking number
					<input
						type="text"
						value={ tracking }
						onChange={ ( e ) => setTracking( e.target.value ) }
						className="w-full mt-1 px-2 py-1.5 border border-se-border rounded text-sm bg-white"
					/>
				</label>
			</div>

			<label className="block text-xs text-se-subtitle mt-3">
				Shipping fee you paid (optional)
				<input
					type="number"
					min="0"
					step="0.01"
					value={ fee }
					onChange={ ( e ) => setFee( e.target.value ) }
					placeholder="0.00"
					className="w-full mt-1 px-2 py-1.5 border border-se-border rounded text-sm bg-white"
				/>
				<span className="block mt-1 text-[11px]">
					If our policy reimburses return shipping, we'll add this to your refund.
				</span>
			</label>

			<div className="mt-4">
				<label className="text-xs text-se-subtitle block">
					Proof photo (courier slip / package shot) — up to 5
				</label>
				<input
					type="file"
					accept="image/*"
					multiple
					onChange={ ( e ) => handleFiles( e.target.files ) }
					className="mt-1 text-xs"
					disabled={ uploading || submitting }
				/>
				{ !! uploads.length && (
					<div className="mt-2 flex flex-wrap gap-2">
						{ uploads.map( ( u ) => (
							<div
								key={ u.id }
								className="relative w-16 h-16 border border-se-border rounded overflow-hidden bg-white"
							>
								<img src={ u.url } alt="" className="w-full h-full object-cover" />
								<button
									type="button"
									onClick={ () =>
										setUploads( uploads.filter( ( x ) => x.id !== u.id ) )
									}
									className="absolute top-0 right-0 px-1 text-xs bg-black/60 text-white"
								>
									×
								</button>
							</div>
						) ) }
					</div>
				) }
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<button
					type="button"
					onClick={ submit }
					disabled={ submitting || uploading || ! carrier.trim() || ! tracking.trim() }
					className="px-4 py-2 rounded bg-se-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
				>
					{ submitting ? 'Submitting…' : 'Mark as shipped' }
				</button>
			</div>
		</div>
	);
};

export default App;
