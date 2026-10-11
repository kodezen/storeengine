import React, { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { useFormikContext } from 'formik';
import Button from '@Components/Button';
import { sliceString } from '@Utils/helper';
import './styles.scss';

const propTypes = {
	name: PropTypes.string,
	label: PropTypes.string,
	icon: PropTypes.string,
};

export default function FileUpload( {
	setUploadFileHandler,
	name = 'upload_file',
	label = __( 'Upload a CSV file', 'storeengine' ),
	icon = null,
} ) {
	const { values, setFieldValue } = useFormikContext();
	const [ fileName, setFileName ] = useState( '' );
	const fileInputRef = useRef( null );

	const handleFileChange = ( e ) => {
		const file = e.target.files[ 0 ];
		if ( file ) {
			setFieldValue( name, file.name );
			setUploadFileHandler( file );
			setFileName( file.name );
		}
	};

	useEffect( () => {
		if ( values[ name ] && ! fileName ) {
			setFileName( values[ name ] );
		}
	}, [ values, name, fileName ] );

	return (
		<div
			role="presentation"
			onClick={ () => fileInputRef.current?.click() }
			className="storeengine-file-upload"
		>
			{ ! values[ name ] ? (
				<div className="storeengine-file-upload__input">
					{ icon && <span className={ icon }></span> }
					<span className="storeengine-file-upload__label storeengine-mt-4 storeengine-mb-6">
						{ label }
					</span>

					<Button
						label={ __( 'Browse File', 'storeengine' ) }
						preset="gray"
						border="gray"
					/>

					<input
						type="file"
						ref={ fileInputRef }
						className="storeengine-import__file"
						style={ { display: 'none' } }
						name={ name }
						onChange={ handleFileChange }
					/>
				</div>
			) : (
				<div className="storeengine-upload-file-details">
					<span>{ sliceString( fileName, 30 ) }</span>
					<Button
						icon={
							<span className="storeengine-icon storeengine-icon--close"></span>
						}
						onClick={ () => {
							setFieldValue( name, '' );
							setUploadFileHandler( false );
							setFileName( '' );
						} }
					/>
				</div>
			) }
		</div>
	);
}

FileUpload.propTypes = propTypes;
