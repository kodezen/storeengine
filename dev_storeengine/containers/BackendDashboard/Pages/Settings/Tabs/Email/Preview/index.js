import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { makeRequest } from '@Utils/helper';
import { Scope, Button } from '@Components/ui';
import Modal from '@Components/Modal';

const propTypes = {
	templateName: PropTypes.string,
	templateSubName: PropTypes.string,
};

/**
 * On-demand email template preview.
 *
 * Replaces the old always-on "live" preview iframe with a Preview button that
 * opens the server-rendered template (full email shell + resolved tokens via
 * the `preview_template` AJAX) in a modal. The block builder canvas already
 * gives a live WYSIWYG while editing; this button is for a faithful, final
 * render of the saved template. Content is (re)fetched each time the modal is
 * opened so it reflects the latest auto-saved state.
 */
export default function Preview( { templateName, templateSubName } ) {
	const [ open, setOpen ] = useState( false );
	const [ preview, setPreview ] = useState( '' );
	const [ isLoading, setLoading ] = useState( false );

	const openPreview = () => {
		setOpen( true );
		setLoading( true );
		makeRequest(
			'preview_template',
			{ templateName, templateSubName },
			false,
			'_email'
		)
			.then( ( res ) => {
				setPreview( res.data.data );
			} )
			.finally( () => setLoading( false ) );
	};

	return (
		<Scope as="span">
			<Button
				preset="outline"
				size="sm"
				icon="storeengine-icon--eye"
				onClick={ openPreview }
			>
				{ __( 'Preview', 'storeengine' ) }
			</Button>
			<Modal
				open={ open }
				onClose={ () => setOpen( false ) }
				title={ __( 'Template Preview', 'storeengine' ) }
				size="full"
			>
				<div className="storeengine-email-template-preview storeengine-email-template-preview--modal">
					{ isLoading ? (
						<div
							className="storeengine-email-template-preview__skeleton"
							role="status"
							aria-live="polite"
						>
							<div className="storeengine-email-template-preview__skeleton-card">
								<span className="se-skel se-skel--heading" />
								<span className="se-skel se-skel--line" />
								<span className="se-skel se-skel--line" />
								<span className="se-skel se-skel--line se-skel--short" />
								<span className="se-skel se-skel--gap" />
								<span className="se-skel se-skel--line" />
								<span className="se-skel se-skel--line se-skel--short" />
								<span className="se-skel se-skel--button" />
							</div>
							<p className="storeengine-email-template-preview__loading">
								{ __( 'Loading preview…', 'storeengine' ) }
							</p>
						</div>
					) : (
						<iframe
							title={ __( 'Template Preview', 'storeengine' ) }
							srcDoc={ preview }
							style={ { width: '100%', height: '70vh', border: 0 } }
						></iframe>
					) }
				</div>
			</Modal>
		</Scope>
	);
}

Preview.propTypes = propTypes;
