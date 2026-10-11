import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@Components/ui';

const ProductCommissions = () => {
	return (
		<div className="storeengine-content-section">
			<h3 className="storeengine-heading">
				{ __( 'Product Commissions', 'storeengine' ) }
			</h3>

			<Button icon="storeengine-icon--add" type="button" preset="primary">
				{ __( 'Add Commissions', 'storeengine' ) }
			</Button>
		</div>
	);
};

export default ProductCommissions;
