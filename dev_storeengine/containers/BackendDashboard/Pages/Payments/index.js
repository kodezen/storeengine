import React from 'react';
import { __ } from '@wordpress/i18n';
import TopBar from '@Components/TopBar';
import SubTopBar from '@Components/SubTopBar';
import { Scope } from '@Components/ui';
import PaymentsTable from './PaymentsTable';

const propTypes = {};

const Payments = () => {
	return (
		<Scope>
			<TopBar title={ __( 'All Payments', 'storeengine' ) } />

			<div className="storeengine-page-content storeengine-payments-page">
				<SubTopBar heading={ __( 'Payments', 'storeengine' ) } />
				<PaymentsTable />
			</div>
		</Scope>
	);
};

export default Payments;
Payments.propTypes = propTypes;
