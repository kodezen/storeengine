import React from 'react';
import Details from './Options/Details';
import ProductBundleEditor from './Options/ProductBundle';
import Price from './Options/Price';
import { Form, useFormikContext } from 'formik';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import ProductOrganize from './Options/ProductOrganize';
import SubTopBar from '@Components/SubTopBar';
import Publishing from './Options/Publishing';
// import BasicSEO from './Options/BasicSEO';
import Images from './Options/Images';
import Integration from './Options/Integration';
import Shipping from './Options/Shipping';
import VariantsAndLinked from './Options/VariantsAndLinked';
import PurchaseRedirect from './Options/PurchaseRedirect';
import { enable_after_purchase_redirect, isAddonActive } from '@Utils/helper';
import LinkedProducts from './Options/LinkedProducts';
import Inventory from './Options/Inventory';
import Grundpreis from './Options/Grundpreis';
import SeoPanel from './Options/SeoPanel';
import Faq from './Options/Faq';
import { Scope } from '@Components/ui';
import { SectionGate } from './productFormConfig';

import './styles.scss';

const FormInner = ( { ID, mode } ) => {
	const { values } = useFormikContext();
	return (
		<Scope className="storeengine-page-content storeengine-page-content--product">
			<SubTopBar
				classnames = { mode !== 'admin' ? 'my-6' : '' }
				heading={
					ID
						? __( 'Update Product', 'storeengine' )
						: __( 'Add New Product', 'storeengine' )
				}
				status={ values?.status ?? 'draft' }
			/>
			<Form className="storeengine-page-content--add-product">
				<div className="storeengine-page-content__left">
					<Details />
					<ProductBundleEditor ID={ ID } mode={ mode } />
					<Price ID={ ID } />
					{ values?.product_type !== 'bundled' &&
						values.meta._storeengine_product_shipping_type ===
							'physical' && (
							<SectionGate id="variants">
								<VariantsAndLinked ID={ ID } />
							</SectionGate>
						) }
					{ /* Per-product inventory is CORE — the stock engine, columns,
					   reduce-on-order, and storefront out-of-stock display are all
					   core and always on, so the editor UI is too (physical
					   products always; the Inventory addon also surfaces it for
					   digital products). The addon owns only the store-wide
					   management dashboard, not this section. */ }
					{ values?.product_type !== 'bundled' &&
						( values.meta._storeengine_product_shipping_type ===
							'physical' ||
							isAddonActive( 'inventory' ) ||
							isAddonActive( 'cost-profit' ) ) && (
						<SectionGate id="inventory">
							<Inventory />
						</SectionGate>
					) }
					{ values?.product_type !== 'bundled' && (
						<SectionGate id="integration">
							<Integration ID={ ID } />
						</SectionGate>
					) }
					<SectionGate id="faq">
						<Faq productId={ ID } />
					</SectionGate>
				</div>
				<div className="storeengine-page-content__right">
					<Publishing ID={ ID } />
					<SectionGate id="shipping">
						<Shipping />
					</SectionGate>
					{ /* A unit price (Grundpreis) is meaningless for a customer-set
					     donation / name-your-price product. */ }
					{ isAddonActive( 'eu-compliance' ) &&
						! [ 'name_your_price', 'donation' ].includes(
							values?.donation?.mode
						) && (
						<SectionGate id="grundpreis">
							<Grundpreis />
						</SectionGate>
					) }
					<ProductOrganize mode={ mode } />
					<SectionGate id="linked_products">
						<LinkedProducts />
					</SectionGate>
					{ enable_after_purchase_redirect && (
						<SectionGate id="purchase_redirect">
							<PurchaseRedirect />
						</SectionGate>
					) }
					<SectionGate id="media">
						<Images />
					</SectionGate>
					{ isAddonActive( 'seo' ) && (
						<SectionGate id="seo">
							<SeoPanel productId={ ID } />
						</SectionGate>
					) }
					<SectionGate id="addons">
						{ applyFilters(
							'storeengine.product.editor.sidebar',
							null,
							{ productId: ID, values }
						) }
					</SectionGate>
				</div>
			</Form>
		</Scope>
	);
};

export default FormInner;
