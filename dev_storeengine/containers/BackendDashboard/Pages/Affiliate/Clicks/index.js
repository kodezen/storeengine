import React from 'react';
import { Scope, Button } from '@Components/ui';
import TopBar from '@Components/TopBar';
import { __ } from '@wordpress/i18n';
import SubTopBar from '@Components/SubTopBar';
import GetHelp from '@Components/GetHelp';
import ClicksTable from './ClicksTable';

const Clicks = () => {
	return (
		<Scope>
			<TopBar
				title={ __( 'Clicks', 'storeengine' ) }
				render={ () => (
					<>
						<Button
							icon="storeengine-icon--add"
							type="button"
							preset="primary"
						>
							{ __( 'Add Click', 'storeengine' ) }
						</Button>
						<GetHelp filterText={ [ 'clicks' ] } />
					</>
				) }
			/>

			<SubTopBar heading={ __( 'Clicks', 'storeengine' ) } />

			<div className="storeengine-page-content storeengine-page-content--affiliate-page">
				<ClicksTable />
			</div>
		</Scope>
	);
};

export default Clicks;
