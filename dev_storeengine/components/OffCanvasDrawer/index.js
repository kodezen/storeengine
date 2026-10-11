import React from 'react';
import PropTypes from 'prop-types';
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
};

const CollapsiblePanel = ( {
	suffix,
	isOpen = false,
	onClose = () => {},
	title = '',
	isAnimating,
	isLoading,
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
				{ isLoading ? <Preloader /> : <>{ children }</> }
			</div>
		</div>
	);
};

CollapsiblePanel.propTypes = propTypes;

export default CollapsiblePanel;
