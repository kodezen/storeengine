import React, { useState, useRef, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import Button from '@Components/Button';
import { Checkbox } from '@Components/ui';
import useScreenOptions, {
	mergeColumns,
	toSavedColumns,
} from '@Hooks/useScreenOptions';

import './styles.scss';

/**
 * WordPress-style "Screen Options" control for a list screen. Lives in the
 * TopBar (next to Help) and opens a dropdown panel to control the table's
 * column visibility and the per-page fetch limit. All prefs persist per-user
 * to a single user-meta blob (see useScreenOptions / ScreenOptions PHP).
 *
 * @param {Object} props
 * @param {string} props.screenId  Stable screen id (e.g. "orders").
 */
export default function ScreenOptions( { screenId } ) {
	const [ open, setOpen ] = useState( false );
	const ref = useRef( null );

	const {
		perPage,
		savedColumns,
		columnDefs,
		setPerPage,
		setColumns,
		reset,
	} = useScreenOptions( screenId );

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

	const merged = mergeColumns( columnDefs, savedColumns );

	const toggleColumn = ( id, visible ) => {
		const next = merged.map( ( c ) =>
			c.id === id && ! c.locked ? { ...c, visible } : c
		);
		setColumns( toSavedColumns( next ) );
	};

	const currentPerPage = perPage || 10;

	return (
		<div className="storeengine-screen-options" ref={ ref }>
			<Button
				className="storeengine-screen-options__trigger"
				onClick={ () => setOpen( ( o ) => ! o ) }
				icon={
					<span className="storeengine-icon storeengine-icon--setting" />
				}
				label={ __( 'Screen Options', 'storeengine' ) }
			/>

			{ open && (
				<div className="storeengine-screen-options__panel se-admin-tw font-se">
					{ columnDefs.length > 0 && (
						<div className="storeengine-screen-options__section">
							<h4 className="storeengine-screen-options__title">
								{ __( 'Columns', 'storeengine' ) }
							</h4>
							<div className="storeengine-screen-options__cols">
								{ merged.map( ( c ) => (
									<Checkbox
										key={ c.id }
										disabled={ !! c.locked }
										checked={ !! c.visible }
										onChange={ ( v ) =>
											toggleColumn( c.id, v )
										}
										label={ c.name }
									/>
								) ) }
							</div>
						</div>
					) }

					<div className="storeengine-screen-options__section">
						<h4 className="storeengine-screen-options__title">
							{ __( 'Pagination', 'storeengine' ) }
						</h4>
						<label className="storeengine-screen-options__perpage">
							<span>{ __( 'Items per page', 'storeengine' ) }</span>
							<input
								type="number"
								min={ 1 }
								max={ 200 }
								className="storeengine-input"
								value={ currentPerPage }
								onChange={ ( e ) =>
									setPerPage(
										Math.max(
											1,
											Math.min(
												200,
												parseInt( e.target.value, 10 ) || 1
											)
										)
									)
								}
							/>
						</label>
					</div>

					<div className="storeengine-screen-options__footer">
						<button
							type="button"
							className="storeengine-screen-options__reset"
							onClick={ reset }
						>
							{ __( 'Reset to defaults', 'storeengine' ) }
						</button>
					</div>
				</div>
			) }
		</div>
	);
}
