import { Scope, Button } from '@Components/ui';
import { plugin_root_url } from '@Utils/helper';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';

import './styles.scss';

const OVERLAY =
	'fixed inset-0 z-[99999] flex items-center justify-center border-0 p-0 w-full h-full bg-[rgba(3,3,3,0.44)]';

const FreemiusProgressBar = ( {
	show = false,
	close,
	isComplete = false,
	hasError = false,
	onRetry,
	title,
	progressMessage,
	successTitle,
	successMessage,
} ) => {
	useEffect( () => {
		if ( show ) {
			document.body.classList.add( 'storeengine-progress-modal--open' );
			if ( ! isComplete ) {
				window.onbeforeunload = function () {
					return __( 'Process is not complete.', 'storeengine' );
				};
			}
		}

		return () => {
			document.body.classList.remove(
				'storeengine-progress-modal--open'
			);
			window.onbeforeunload = null;
		};
	}, [ show, isComplete ] );

	return (
		show && (
			<Scope
				as="dialog"
				className={ OVERLAY }
				open={ show }
				role="alertdialog"
				aria-modal={ true }
				aria-live="polite"
			>
				<div className="relative px-[60px] py-10 bg-se-white rounded-se w-[480px] min-h-[160px] text-center shadow-se-pop">
					<button
						type="button"
						role="presentation"
						onClick={ close }
						className="absolute top-3 right-3 bg-transparent border-0 cursor-pointer text-se-subtitle"
					>
						<span className="storeengine-icon storeengine-icon--close" aria-hidden={ true }></span>
					</button>

					{ isComplete ? (
						<>
							<img
								src={
									plugin_root_url +
									'assets/images/checkmark-badge.png'
								}
								alt={ __( 'Congratulations', 'storeengine' ) }
							/>
							<p className="text-2xl font-medium text-se-text mt-4 mb-2">
								{ successTitle }
							</p>
							<p className="text-sm text-se-subtitle">
								{ successMessage }
							</p>
							<div className="flex justify-center mt-6">
								<Button
									preset="outline"
									onClick={ close }
									className="w-1/2"
								>
									{ __( 'Close', 'storeengine' ) }
								</Button>
							</div>
						</>
					) : (
						<>
							<h3 id="progressbar_title">{ title }</h3>
							<p
								id="progressbar_status"
								className="text-sm text-se-subtitle"
							>
								{ progressMessage }
							</p>

							{ ! hasError && (
								<div className="flex items-center justify-center my-4">
									<div
										className="storeengine-progress-modal__infinity-loader"
										role="progressbar"
										aria-busy="true"
									></div>
								</div>
							) }

							<div className="flex justify-center mt-6">
								{ hasError ? (
									<Button
										preset="primary"
										onClick={ onRetry }
									>
										{ __( 'Retry', 'storeengine' ) }
									</Button>
								) : (
									<Button
										preset="outline"
										onClick={ close }
										className="w-1/2"
									>
										{ __( 'Cancel', 'storeengine' ) }
									</Button>
								) }
							</div>
						</>
					) }
				</div>
			</Scope>
		)
	);
};

export default FreemiusProgressBar;
