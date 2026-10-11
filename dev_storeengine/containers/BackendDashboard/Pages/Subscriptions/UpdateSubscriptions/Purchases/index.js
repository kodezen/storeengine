import { __ } from '@wordpress/i18n';
import { Scope, Card, Heading, Title, SubTitle, Button, Row } from '@Components/ui';

const Purchases = () => {
	return (
		<Scope>
			<Card className="mb-6">
				<Heading>{ __( 'Purchases', 'storeengine' ) }</Heading>
				<h4 className="text-sm font-medium text-se-text mb-2">
					{ __( 'Item', 'storeengine' ) }
				</h4>
				<Row justify="between" align="center">
					<div>
						<Title>{ __( 'Saiful Islam', 'storeengine' ) }</Title>
						<SubTitle>{ __( 'Monthly', 'storeengine' ) }</SubTitle>
						<SubTitle>{ __( 'Qty : 1', 'storeengine' ) }</SubTitle>
					</div>
					<Button type="button" preset="primary">
						{ __( 'Revoke', 'storeengine' ) }
					</Button>
				</Row>
			</Card>
		</Scope>
	);
};

export default Purchases;
