import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import TopBar from '@Components/TopBar';
import GetHelp from '@Components/GetHelp';
import { Scope, Button } from '@Components/ui';
import { makeRequest2 } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { deleteAttribute } from '@Redux/Slices/attributesSlice/attributesSlice';
import AttributeSidebar from './AttributeSidebar';
import AttributeTermsPanel from './AttributeTermsPanel';
import AttributeFormModal from './AttributeFormModal';
import DeleteImpactModal from './DeleteImpactModal';
import './styles.scss';

const requestedId = () => {
	try {
		return (
			Number(
				new URLSearchParams( window.location.search ).get(
					'attribute_id'
				)
			) || null
		);
	} catch {
		return null;
	}
};

/**
 * Attributes screen: searchable attribute list on the left, the selected
 * attribute's terms on the right. Only an attribute's own settings use a
 * modal; everything about terms happens in place.
 */
const Attributes = () => {
	const dispatch = useDispatch();
	// The selected attribute row (not just an id): the sidebar pages its list,
	// so the selection may not be among the rows currently loaded.
	const [ selected, setSelected ] = useState( null );
	const [ reloadKey, setReloadKey ] = useState( 0 );
	const [ modal, setModal ] = useState( { open: false, editing: null } );
	const [ listEmpty, setListEmpty ] = useState( false );
	// Usage of the selected attribute when it's in use and awaiting confirmation.
	const [ impact, setImpact ] = useState( null );
	const [ deleting, setDeleting ] = useState( false );

	const selectedId = selected ? Number( selected.attribute_id ) : null;

	// First page arrived: keep the current selection when it's still there,
	// else prefer ?attribute_id=, else the first row.
	const onLoaded = ( rows ) => {
		setListEmpty( ! rows.length );
		setSelected( ( current ) => {
			const wanted = current
				? Number( current.attribute_id )
				: requestedId();
			return (
				rows.find( ( r ) => Number( r.attribute_id ) === wanted ) ||
				( current && rows.length ? current : null ) ||
				rows[ 0 ] ||
				null
			);
		} );
	};

	const onSaved = ( row ) => {
		setModal( { open: false, editing: null } );
		if ( row?.attribute_id ) {
			setSelected( ( current ) =>
				current &&
				Number( current.attribute_id ) === Number( row.attribute_id )
					? { ...current, ...row }
					: row
			);
		}
		setReloadKey( ( k ) => k + 1 );
	};

	const remove = async ( force ) => {
		const res = await dispatch(
			deleteAttribute( { ID: selected.attribute_id, force } )
		);
		if ( res?.payload ) {
			setImpact( null );
			setSelected( null );
			setReloadKey( ( k ) => k + 1 );
		}
	};

	// An attribute no product uses is deleted right away; one in use first
	// shows what goes with it.
	const onDelete = async () => {
		if ( ! selected ) {
			return;
		}
		setDeleting( true );
		try {
			const usage = await makeRequest2( 'get_product_attribute_usage', {
				attribute_id: selected.attribute_id,
			} );
			if ( usage?.in_use ) {
				setImpact( usage );
				return;
			}
			await remove( false );
		} catch ( err ) {
			dispatch(
				showNotification( {
					message:
						err?.response?.data?.message ||
						err?.message ||
						__( 'Something went wrong.', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		} finally {
			setDeleting( false );
		}
	};

	const confirmDelete = async () => {
		setDeleting( true );
		try {
			await remove( true );
		} finally {
			setDeleting( false );
		}
	};

	const openCreate = () => setModal( { open: true, editing: null } );

	return (
		<Scope>
			<TopBar
				title={ __( 'Attributes', 'storeengine' ) }
				render={ () => <GetHelp filterText={ [ 'attributes' ] } /> }
			/>
			<div className="storeengine-page-content">
				<div className="storeengine-attr-manager">
					<AttributeSidebar
						selectedId={ selectedId }
						onSelect={ setSelected }
						onLoaded={ onLoaded }
						onCreate={ openCreate }
						reloadKey={ reloadKey }
					/>

					<div className="storeengine-attr-manager__main">
						{ selected && (
							<AttributeTermsPanel
								key={ `${ selected.attribute_id }-${ selected.attribute_orderby }` }
								attribute={ selected }
								onEdit={ () =>
									setModal( {
										open: true,
										editing: selected,
									} )
								}
								onDelete={ onDelete }
							/>
						) }
						{ ! selected && listEmpty && (
							<div className="storeengine-attr-manager__blank">
								<span
									className="storeengine-attr-manager__blank-icon"
									aria-hidden="true"
								>
									<svg
										width="26"
										height="26"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.8"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z" />
										<circle cx="7" cy="7" r="1.5" />
									</svg>
								</span>
								<h3>
									{ __(
										'Create your first attribute',
										'storeengine'
									) }
								</h3>
								<p>
									{ __(
										'Attributes like Size or Color hold the options (terms) your variable products are built from.',
										'storeengine'
									) }
								</p>
								<Button preset="primary" onClick={ openCreate }>
									{ __( 'New attribute', 'storeengine' ) }
								</Button>
							</div>
						) }
					</div>
				</div>
			</div>

			<DeleteImpactModal
				open={ !! impact }
				subject={ selected?.attribute_label || '' }
				usage={ impact }
				deleting={ deleting }
				onConfirm={ confirmDelete }
				onClose={ () => setImpact( null ) }
			/>

			<AttributeFormModal
				open={ modal.open }
				editing={ modal.editing }
				onClose={ () => setModal( { open: false, editing: null } ) }
				onSaved={ onSaved }
			/>
		</Scope>
	);
};

export default Attributes;
