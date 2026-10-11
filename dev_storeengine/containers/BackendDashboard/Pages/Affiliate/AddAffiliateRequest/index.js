import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@Components/ui';
import ReactModal from '@Components/Modal/ReactModal';
import ModalFormInner from './ModalFormInner';

const AddAffiliateRequest = () => {
	const [ openRequestModal, setOpenRequestModal ] = useState( false );

	const onRequestClose = () => {
		setOpenRequestModal( false );
	};

	return (
		<>
			<Button
				onClick={ () => setOpenRequestModal( true ) }
				type="button"
				preset="primary"
			>
				{ __( 'Add Affiliate Request', 'storeengine' ) }
			</Button>
			<ReactModal
				title={ __( 'Create New Affiliate Request', 'storeengine' ) }
				isOpen={ openRequestModal }
				onRequestClose={ onRequestClose }
				size="small"
				isEnabledHeader={ false }
				suffix="affiliate"
			>
				<ModalFormInner onRequestClose={ onRequestClose } />
			</ReactModal>
		</>
	);
};

export default AddAffiliateRequest;
