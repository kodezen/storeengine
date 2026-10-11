import React from 'react';
import PropTypes from 'prop-types';
import Button from '@Components/Button';
import { __ } from '@wordpress/i18n';
import { Form, Formik } from 'formik';
import Preloader from '../Loader/Preloader';
import './styles.scss';

const propTypes = {
	title: PropTypes.string,
	isOpen: PropTypes.bool,
	isLoading: PropTypes.bool,
	onClose: PropTypes.func,
	cancelButtonLabel: PropTypes.string,
	submitButtonLabel: PropTypes.string,
	suffix: PropTypes.string,
	formik: PropTypes.object,
};

const CollapsiblePanelFormik = ( {
	suffix,
	isOpen = false,
	onClose = () => {},
	title = '',
	isLoading,
	isAnimating,
	formik = {},
	cancelButtonLabel = __( 'Cancel', 'storeengine' ),
	submitButtonLabel = __( 'Add new', 'storeengine' ),
	children,
} ) => {
	if ( ! isOpen ) {
		return null;
	}
	return (
		<div
			className={ `store-drawer-panel ${
				isAnimating && 'store-drawer-panel--open'
			} store-drawer-panel--${ suffix }` }
		>
			{ title && (
				<div className="store-drawer-panel__header">
					<h5>{ title }</h5>
					<button
						className="store-drawer-panel__close"
						onClick={ onClose }
						type="button"
					>
						<span className="store-icon store-icon--close"></span>
					</button>
				</div>
			) }
			<div className="store-drawer-panel__body">
				<Formik { ...formik }>
					{ ( { isSubmitting } ) => (
						<Form>
							<div
								className={ `store-drawer ${
									suffix && ' store-drawer--' + suffix
								}` }
							>
								{ isLoading ? (
									<Preloader />
								) : (
									<>
										<div className="store-drawer__content">
											{ children }
										</div>
										<div className="store-drawer__footer">
											<Button
												type="button"
												onClick={ () => onClose() }
												borderRadius="rounded"
												preset="border-blue"
												label={ cancelButtonLabel }
											/>
											<Button
												type="submit"
												borderRadius="rounded"
												label={ submitButtonLabel }
												isLoading={ isSubmitting }
											/>
										</div>
									</>
								) }
							</div>
						</Form>
					) }
				</Formik>
			</div>
		</div>
	);
};

CollapsiblePanelFormik.propTypes = propTypes;

export default CollapsiblePanelFormik;
