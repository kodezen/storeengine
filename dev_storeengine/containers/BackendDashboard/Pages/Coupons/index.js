import React from 'react';
import TopBar from '@Components/TopBar';
import { __ } from '@wordpress/i18n';
import { Scope, Button } from '@Components/ui';
import CouponsTable from './CouponsTable';
import { Link } from 'react-router-dom';
import { route_path, canWriteResource } from '@Utils/helper';
import SubTopBar from '@Components/SubTopBar';
import GetHelp from '@Components/GetHelp';

import './styles.scss';

const Coupons = () => {
	const canCreate = canWriteResource( 'coupons', 'create' );
	return (
		<Scope>
			<TopBar
				title={ __( 'All Coupons', 'storeengine' ) }
				render={ () => (
					<>
						<GetHelp filterText={ [ 'coupons' ] } />
					</>
				) }
			/>

			<SubTopBar heading={ __( 'Coupons List', 'storeengine' ) }>
				{ canCreate && (
					<Link
						to={ `${ route_path }admin.php?page=storeengine-coupons&action=new` }
					>
						<Button preset="primary" type="button">
							{ __( 'Add Coupon', 'storeengine' ) }
						</Button>
					</Link>
				) }
			</SubTopBar>

			<div className="storeengine-page-content storeengine-page-content--coupon">
				<CouponsTable />
			</div>
		</Scope>
	);
};

export default Coupons;
