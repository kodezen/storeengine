import React from 'react';
import TopBar from '@Components/TopBar';
import SubTopBar from '@Components/SubTopBar';
import { __ } from '@wordpress/i18n';
import GetHelp from '@Components/GetHelp';
import { Scope, Button } from '@Components/ui';
import AccessGroupTable from './AccessGroupTable';
import { Link } from 'react-router-dom';
import { route_path, canWriteResource } from '@Utils/helper';

const AccessGroup = () => {
	const canCreate = canWriteResource( 'memberships', 'create' );
	return (
		<Scope>
			<TopBar title={ __( 'All Access Groups', 'storeengine' ) } />

			<div className="storeengine-page-content">
				<SubTopBar heading={ __( 'Access Group', 'storeengine' ) }>
					{ canCreate && (
						<Link
							to={ `${ route_path }admin.php?page=storeengine-membership-rules&action=new` }
						>
							<Button type="button" preset="primary">
								{ __( 'Add Access Group', 'storeengine' ) }
							</Button>
						</Link>
					) }
				</SubTopBar>

				<AccessGroupTable />
			</div>
		</Scope>
	);
};

export default AccessGroup;
