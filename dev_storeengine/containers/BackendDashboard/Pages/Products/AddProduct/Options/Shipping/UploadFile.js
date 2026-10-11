import React, { useEffect, useState } from 'react';
import { API, plugin_root_url, runUploader } from '@Utils/helper';
import { Button } from '@Components/ui';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { Field } from 'formik';

// import './styles/UploadFile.scss';

const propTypes = {
	name: PropTypes.string,
	value: PropTypes.number,
	attachment_id: PropTypes.number,
	saveValueHandler: PropTypes.func,
	onRemove: PropTypes.func,
};

export default function UploadFile( props ) {
	const { attachment_id = 0, name = '', saveValueHandler = () => {}, onRemove } = props;

	const UploadFileHandler = async ( e ) => {
		e.preventDefault();
		const attachment = await runUploader( {
			attachment_id,
			title: __( 'Select or Upload A File', 'storeengine' ),
			button_text: __( 'Use This File', 'storeengine' ),
		} );
		saveValueHandler( attachment );
	};

	return (
		<React.Fragment>
			<div className="storeengine-upload-download-file">
				<div className="storeengine-upload-download-file__entry-left">
					<Field
						name={ name }
						className="storeengine-input"
						placeholder={ __( 'http//', 'storeengine' ) }
					/>
				</div>

				<div className="storeengine-upload-download-file__entry-right">
					<div className="storeengine-flex storeengine-flex-justify-between storeengine-flex-align-center">
						<Button
							type="button"
							onClick={ UploadFileHandler }
							size="sm"
						>
							{ __( 'Upload', 'storeengine' ) }
						</Button>
						{ onRemove && (
							<Button
								type="button"
								preset="outline-danger"
								aria-label={ __( 'Remove file', 'storeengine' ) }
								icon="storeengine-icon--trash"
								onClick={ onRemove }
							/>
						) }
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}

UploadFile.propTypes = propTypes;
