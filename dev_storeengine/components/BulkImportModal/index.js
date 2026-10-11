import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import ReactModalFormik from '@Components/ReactModalFormik';
import Button from '@Components/Button';
import { makeRequest, is_pro } from '@Utils/helper';
// import { upgradeProModal } from '@Redux/actions/upgradetopro.actions';
// import { getAllStudents } from '@Redux/actions/students.actions';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import FileUpload from './FileUpload';

import './styles.scss';

const propTypes = {
	label: PropTypes.string,
	type: PropTypes.string,
	isOpenModal: PropTypes.func,
	setImportOpen: PropTypes.func,
	info: PropTypes.string,
};

export default function BulkImportModal( {
	type = '',
	label = __( 'Bulk Import', 'storeengine' ),
	isOpenModal = () => {},
	setImportOpen = () => {},
	info = "Please ensure your CSV file includes the <strong>'email'</strong> field as it is required for a successful import. The <strong>'first_name'</strong>, <strong>'last_name'</strong>, <strong>'username'</strong> and <strong>'password'</strong> fields are optional. Thank you!",
} ) {
	const [ isOpenBulkImport, setOpenBulkImport ] = useState( false );
	const [ responseData, setResponseData ] = useState( [] );
	const [ uploadFiles, setUploadFiles ] = useState( false );

	const dispatch = useDispatch();

	const onSubmitHandler = async ( values, actions ) => {
		actions.setSubmitting( true );
		if ( ! uploadFiles ) {
			dispatch(
				showNotification( {
					message: __(
						'Please select a file before import.',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
			return;
		}
		setResponseData( [] );
		try {
			const res = await makeRequest(
				{
					action: 'storeengine_pro/admin/bulk_' + type,
					upload_file: uploadFiles,
				},
				true
			);
			setResponseData( res.data.data );
			dispatch( getAllStudents() );
			dispatch(
				showNotification( {
					message: __( 'Successfully Imported', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
		} catch ( e ) {
			dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'error',
				} )
			);
		}
		actions.setSubmitting( false );
		actions.resetForm( {} );
		setUploadFiles( false );
	};

	const handleModalClose = () => {
		setOpenBulkImport( false );
		setImportOpen( false );
	};

	const handleModalOpen = () => {
		if ( is_pro ) {
			setOpenBulkImport( true );
			setImportOpen( true );
		} else {
			isOpenModal( false );
			dispatch( upgradeProModal( true ) );
		}
	};

	return (
		<React.Fragment>
			<div className="storeengine-enrollment-teaser">
				<Button
					type="button"
					suffix={ ! is_pro ? 'disabled' : 'import' }
					preset="border-purple"
					size="sm"
					onClick={ () => handleModalOpen() }
					label={ label }
					isPro={ !! is_pro }
				/>
			</div>
			<ReactModalFormik
				title={ label }
				isOpen={ isOpenBulkImport }
				onRequestClose={ () => handleModalClose() }
				submitButtonLabel={ __( 'Import Now', 'storeengine' ) }
				suffix="bulk-import"
				size="small"
				isEnabledHeader={ false }
				formik={ {
					enableReinitialize: true,
					initialValues: {
						upload_file: '',
					},
					onSubmit: onSubmitHandler,
				} }
			>
				<div className="storeengine-import">
					<h4 className="storeengine-import__details">
						<div className="storeengine-import__details__linear">
							<span className="storeengine-icon storeengine-icon--upload" />
						</div>{ ' ' }
						{ __( 'Support: CSV', 'storeengine' ) }
					</h4>
					<FileUpload
						setUploadFileHandler={ setUploadFiles }
						icon={
							<span className="storeengine-icon storeengine-icon--upload" />
						}
					/>
				</div>
				{ responseData.length > 0 && (
					<div className="storeengine-import-response">
						<p className="storeengine-import-response__title">
							{ __( 'Imported Data List', 'storeengine' ) }
						</p>
						<>
							{ responseData.map( ( item, index ) => (
								<p
									className="storeengine-import-response__item"
									key={ index }
								>
									<span>{ item.email }</span>
									<span>{ item.message }</span>
								</p>
							) ) }
						</>
					</div>
				) }
				<p
					className="storeengine-info"
					dangerouslySetInnerHTML={ { __html: info } }
				></p>
			</ReactModalFormik>
		</React.Fragment>
	);
}

BulkImportModal.propTypes = propTypes;
