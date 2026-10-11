import React from 'react';
import { __ } from '@wordpress/i18n';
import SubTopBar from '@Components/SubTopBar';
import ProductCommissions from './ProductCommissions';
import Clicks from './Clicks';
import PromotionCodes from './PromotionCodes';
import Payouts from './Payouts';
import Referrals from './Referrals';
import Profile from './Profile';
import ReferralUrl from './ReferralUrl';
import CustomCommission from './CustomCommission';

import './styles.scss';

const Requests = () => {
	return (
		<div className="storeengine-page-content se-admin-tw">
			<SubTopBar heading={ __( 'Affiliate', 'storeengine' ) } />

			<div className="storeengine-page-content--affiliate-requests">
				<div className="storeengine-page-content__left">
					<Referrals />
					<Payouts />
					<PromotionCodes />
					<Clicks />
					<ProductCommissions />
				</div>

				<div className="storeengine-page-content__right">
					<Profile />
					<ReferralUrl />
					<CustomCommission />
				</div>
			</div>
		</div>
	);
};

export default Requests;
