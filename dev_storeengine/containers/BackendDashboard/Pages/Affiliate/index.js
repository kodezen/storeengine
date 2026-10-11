import React from 'react';
import TopBar from '@Components/TopBar';
import { __ } from '@wordpress/i18n';
import SubTopBar from '@Components/SubTopBar';
import GetHelp from '@Components/GetHelp';
import { Scope } from '@Components/ui';
import AffiliatesTable from './AffiliatesTable';
import AddAffiliateRequest from './AddAffiliateRequest/index';

const Affiliate = () => {
	return (
		<Scope>
			<TopBar
				title={ __( 'Affiliate', 'storeengine' ) }
				render={ () => <GetHelp filterText={ [ 'Affiliate' ] } /> }
			/>

			<SubTopBar heading={ __( 'Affiliate', 'storeengine' ) }>
				<AddAffiliateRequest />
			</SubTopBar>

			<div className="storeengine-page-content storeengine-page-content--affiliate-page">
				<AffiliatesTable />
			</div>
		</Scope>
	);
};

export default Affiliate;
