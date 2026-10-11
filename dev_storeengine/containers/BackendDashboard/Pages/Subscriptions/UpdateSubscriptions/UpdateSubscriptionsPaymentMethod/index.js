import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import Tooltip from '@Components/Tooltip';
import { Card, Heading } from '@Components/ui';

import './styles.scss';

const UpdateSubscriptionsPaymentMethod = () => {
	const { values } = useFormikContext();
	return (
		<Card className="mb-6">
			<Heading>{ __( 'Payment Methods', 'storeengine' ) }</Heading>
			<span className="text-sm text-se-text">
				{ values?.payment_method_title }
				{ values?.payment_method_title && (
					<Tooltip children={ values.payment_method } />
				) }
				{ /* <span className='storeengine-icon storeengine-icon--edit'></span> */ }
			</span>
		</Card>
	);
};

export default UpdateSubscriptionsPaymentMethod;
