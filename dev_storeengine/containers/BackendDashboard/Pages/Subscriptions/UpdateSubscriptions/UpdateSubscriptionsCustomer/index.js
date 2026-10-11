import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Card, Heading, Title } from '@Components/ui';
import './styles.scss';

const UpdateSubscriptionsCustomer = () => {
	const {
		values: { customer_email, customer_name },
	} = useFormikContext();
	return (
		<Card className="mb-6">
			<Heading>{ __( 'Customer', 'storeengine' ) }</Heading>

			<Title className="mb-1">
				{ customer_name ?? __( 'N/A', 'storeengine' ) }
			</Title>

			<span className="text-sm text-se-subtitle">
				{ customer_email ?? __( 'N/A', 'storeengine' ) }
			</span>

			{ /* <Button
				type="button"
				preset="blue"
				size="sm"
				label={ __( 'View Customer', 'storeengine' ) }
				suffix="subscriptions-customer"
			/> */ }
		</Card>
	);
};

export default UpdateSubscriptionsCustomer;
