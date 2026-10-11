import React from 'react';
import { Scope, Button } from '@Components/ui';
import TopBar from '@Components/TopBar';
import { __ } from '@wordpress/i18n';
import ProductsTable from './ProductsTable';
import { get_route_path, canWriteResource } from '@Utils/helper';
import SubTopBar from '@Components/SubTopBar';
import { Link } from 'react-router-dom';
import GetHelp from '@Components/GetHelp';

import './styles.scss';

const Products = () => {
	const canCreate = canWriteResource( 'products', 'create' );
	return (
		<Scope>
			<TopBar
				title={ __( 'All Products', 'storeengine' ) }
			/>

			<SubTopBar heading={ __( 'Product', 'storeengine' ) }>
				{ canCreate && (
					<Link
						to={ get_route_path( {
							page: 'storeengine-products',
							action: 'new',
						} ) }
					>
						<Button preset="primary">
							{ __( 'Add New Product', 'storeengine' ) }
						</Button>
					</Link>
				) }
			</SubTopBar>

			<div className="storeengine-page-content storeengine-page-content--product-page">
				<ProductsTable />
			</div>
		</Scope>
	);
};

export default Products;
