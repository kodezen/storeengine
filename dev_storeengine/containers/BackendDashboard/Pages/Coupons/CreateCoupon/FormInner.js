import React from 'react';
import General from './Options/General';
import Duration from './Options/Duration';
import Amount from './Options/Amount';
import Redemptions from './Options/Redemptions';
import MinimumPurchase from './Options/MinimumPurchase';
import WhoCanUse from './Options/WhoCanUse';
import { Form } from 'formik';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import SubTopBar from '@Components/SubTopBar';
import { Scope } from '@Components/ui';

import './styles.scss';
import SpecificProduct from './Options/SpecificProduct';
import MoreRestrictions from './Options/MoreRestrictions';
import RecurringDiscount from './Options/RecurringDiscount';

const FormInner = ( { ID } ) => {
	/**
	 * Extra coupon-editor sections contributed by add-ons.
	 *
	 * `left` renders under the product restrictions, `right` under the sidebar
	 * options. Each is an array of React nodes.
	 */
	const leftSections = applyFilters(
		'storeengine.coupon_editor.sections_left',
		[],
		{ ID }
	);
	const rightSections = applyFilters(
		'storeengine.coupon_editor.sections_right',
		[],
		{ ID }
	);

	return (
		<Scope
			as="div"
			className="storeengine-page-content storeengine-page-content__coupon"
		>
			<SubTopBar heading={ __( 'Create Coupon', 'storeengine' ) } />

			<Form className="storeengine-page-content--coupon-list">
				<div className="storeengine-page-content__left">
					<General ID={ ID } />
					<MinimumPurchase />
					{ /* <CouponProductManager /> */ }
					<Duration />
					<SpecificProduct />
					{ leftSections }
					<MoreRestrictions />
				</div>
				<div className="storeengine-page-content__right">
					<Amount />
					<RecurringDiscount />
					{ rightSections }
					<Redemptions />
					<WhoCanUse />
				</div>
			</Form>
		</Scope>
	);
};

export default FormInner;
