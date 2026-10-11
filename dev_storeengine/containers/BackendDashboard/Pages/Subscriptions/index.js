import React from 'react';
import { __ } from '@wordpress/i18n';
import TopBar from '@Components/TopBar';
import SubTopBar from '@Components/SubTopBar';
import { Scope } from '@Components/ui';
import SubscriptionsTable from './SubscriptionsTable';

const propTypes = {};

const Subscriptions = () => {
	return (
		<Scope>
			<TopBar title={ __( 'Subscriptions', 'storeengine' ) } />

			<div className="storeengine-page-content storeengine-subscriptions-page">
				<SubTopBar heading={ __( 'Subscriptions', 'storeengine' ) } />
				<SubscriptionsTable />
			</div>
		</Scope>
	);
};

export default Subscriptions;
Subscriptions.propTypes = propTypes;
