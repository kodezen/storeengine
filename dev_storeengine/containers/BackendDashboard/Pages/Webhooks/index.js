import React, { useState } from 'react';
import { Button, Scope } from '@Components/ui';
import SegmentedTabs from '@Components/SegmentedTabs';
import TopBar from '@Components/TopBar';
import SubTopBar from '@Components/SubTopBar';
import { __ } from '@wordpress/i18n';
import GetHelp from '@Components/GetHelp';

import HooksTable from './HooksTable';
import WebhookModal from './WebhookModal';

import './styles.scss';

import IncomingTable from '../IncomingWebhooks/HooksTable';
import IncomingDeliveriesModal from '../IncomingWebhooks/DeliveriesModal';

const WEBHOOK_TYPES = [
	{ label: __( 'Outgoing', 'storeengine' ), value: 'outgoing' },
	{ label: __( 'Incoming', 'storeengine' ), value: 'incoming' },
];

const Webhooks = () => {
	// List filter — which type of webhook the table shows.
	const [ listType, setListType ] = useState( 'outgoing' );

	// Unified create/edit modal.
	const [ isModalOpen, setModalOpen ] = useState( false );
	const [ modalType, setModalType ] = useState( 'outgoing' );
	const [ modalData, setModalData ] = useState( false );

	// Incoming deliveries (audit) viewer.
	const [ deliveriesHook, setDeliveriesHook ] = useState( null );

	const isIncomingList = 'incoming' === listType;

	// "Add New Webhook" always opens the modal defaulting to Outgoing.
	const openAddHandler = () => {
		setModalData( false );
		setModalType( 'outgoing' );
		setModalOpen( true );
	};

	const openEditHandler = ( type ) => ( row ) => {
		setModalData( row || false );
		setModalType( type );
		setModalOpen( true );
	};

	const onRequestClose = () => {
		setModalData( false );
		setModalOpen( false );
	};

	return (
		<Scope>
			<TopBar
				title={ __( 'Webhooks', 'storeengine' ) }
				render={ () => <GetHelp filterText={ [ 'webhooks' ] } /> }
			/>
			<SubTopBar
				heading={
					<SegmentedTabs
						items={ WEBHOOK_TYPES.map( ( t ) => ( {
							key: t.value,
							label: t.label,
						} ) ) }
						value={ listType }
						onChange={ setListType }
						ariaLabel={ __( 'Webhook type', 'storeengine' ) }
					/>
				}
			>
				<Button
					preset="primary"
					type="button"
					onClick={ openAddHandler }
				>
					{ __( 'Add New Webhook', 'storeengine' ) }
				</Button>
			</SubTopBar>
			<div className="storeengine-page-content storeengine-page-content--web-hooks">
				{ isIncomingList ? (
					<IncomingTable
						modalOpenHandler={ openEditHandler( 'incoming' ) }
						onViewDeliveries={ setDeliveriesHook }
					/>
				) : (
					<HooksTable
						modalOpenHandler={ openEditHandler( 'outgoing' ) }
					/>
				) }

				{ isModalOpen && (
					<WebhookModal
						isOpenModal={ isModalOpen }
						onRequestClose={ onRequestClose }
						formData={ modalData }
						type={ modalType }
					/>
				) }

				{ deliveriesHook && (
					<IncomingDeliveriesModal
						hook={ deliveriesHook }
						isOpen={ !! deliveriesHook }
						onRequestClose={ () => setDeliveriesHook( null ) }
					/>
				) }
			</div>
		</Scope>
	);
};

export default Webhooks;
