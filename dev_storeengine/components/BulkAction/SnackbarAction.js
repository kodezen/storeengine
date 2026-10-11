import React, { useEffect, useRef } from 'react';
import Button from '@Components/Button';
import { __ } from '@wordpress/i18n';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import './styles.scss';

const propTypes = {
	actionButtons: PropTypes.array,
	itemsLength: PropTypes.number,
	isActionSelected: PropTypes.object,
	confirmHandler: PropTypes.func,
	resetHandler: PropTypes.func,
};

const SnackbarAction = ( {
	actionButtons = [],
	itemsLength = 0,
	confirmHandler = () => {},
	isActionSelected = {},
	resetHandler = () => {},
} ) => {
	const snackbarRef = useRef( null );
	const targetElement =
		document.querySelector( '#storeengine-admin' ) ||
		document.querySelector( '#storeengineFrontendDashWrap' ) ||
		document.querySelector( '#storeengineLessonsWrap' );

	useEffect( () => {
		if ( itemsLength && targetElement ) {
			snackbarRef.current.style.position = 'fixed';
			snackbarRef.current.style.left = `40%`; // Adjust left position as needed
			snackbarRef.current.style.bottom = `50px`; // Place it at the bottom
			document.body.appendChild( snackbarRef.current );
		} else if (
			snackbarRef.current &&
			snackbarRef.current.parentNode === document.body
		) {
			document.body.removeChild( snackbarRef.current );
		}

		return () => {
			if (
				snackbarRef.current &&
				snackbarRef.current.parentNode === document.body
			) {
				document.body.removeChild( snackbarRef.current );
			}
		};
	}, [] );

	return (
		<>
			{ itemsLength &&
				createPortal(
					<div
						className="storeengine-snackbar-action"
						ref={ snackbarRef }
					>
						<Button
							icon={
								<span className="storeengine-icon storeengine-icon--close"></span>
							}
							preset="transparent"
							suffix="close"
							onClick={ resetHandler }
						/>
						{ isActionSelected?.value ? (
							<div className="storeengine-snackbar-action__after">
								<div className="storeengine-snackbar-action__left">
									{ isActionSelected?.message }
								</div>
								<div className="storeengine-snackbar-action__left">
									<Button
										label={ __( 'Cancel', 'storeengine' ) }
										onClick={ resetHandler }
									/>
									<Button
										label={ __( 'Confirm', 'storeengine' ) }
										onClick={ () => confirmHandler( true ) }
										preset="red"
									/>
								</div>
							</div>
						) : (
							<div className="storeengine-snackbar-action__before">
								<div className="storeengine-snackbar-action__left">
									<div className="storeengine-snackbar-action__items-length">
										<span className="">
											{ itemsLength }
										</span>
										<p>
											{ __(
												'Items selected',
												'storeengine'
											) }
										</p>
									</div>
								</div>
								<div className="storeengine-snackbar-action__right">
									{ actionButtons.map(
										( actionButton, index ) => (
											<Button
												key={ index }
												{ ...actionButton }
											/>
										)
									) }
								</div>
							</div>
						) }
					</div>,
					document.body
				) }
		</>
	);
};

SnackbarAction.propTypes = propTypes;
export default SnackbarAction;
