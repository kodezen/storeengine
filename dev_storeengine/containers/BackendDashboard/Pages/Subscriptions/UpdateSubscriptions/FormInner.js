import React from 'react';
import { __ } from '@wordpress/i18n';
import { Form, useFormikContext } from 'formik';
import UpdateSubscriptionsCustomer from './UpdateSubscriptionsCustomer';
import UpdateSubscriptionsPaymentMethod from './UpdateSubscriptionsPaymentMethod';
import SubTopBar from '@Components/SubTopBar';
import Shipping from './Shipping';
import Billing from './Billing';
import RelatedOrders from './RelatedOrders';
import Schedule from './Schedule';
import OrderStatus from './OrderStatus';
import Product from './Product';
import OrderNotes from '@Components/OrderNotes';

const FormInner = ( { heading } ) => {
	const { values } = useFormikContext();

	return (
		<>
			<SubTopBar heading={ heading } status={ values.status } />
			<div className="storeengine-page-content">
				<Form className="storeengine-page-content--update-subscriptions">
					<div className="storeengine-page-content storeengine-page-content--update-subscriptions">
						<div className="storeengine-page-content__left">
							<Product />
							<RelatedOrders />
						</div>

						<div className="storeengine-page-content__right">
							<OrderStatus />
							<UpdateSubscriptionsCustomer />
							<UpdateSubscriptionsPaymentMethod />
							<Schedule />
							<Billing />
							<Shipping />
							<OrderNotes
								order_id={ values?.id }
								notes={ values?.notes || [] }
							/>
							{ /* if need it will be uncommented */ }
							{ /* <AffiliateCommissions /> */ }
						</div>
					</div>
				</Form>
			</div>
		</>
	);
};

export default FormInner;
