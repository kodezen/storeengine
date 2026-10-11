import React from 'react';
import PostSelect from '@Components/PostSelect';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { getAddonActiveStatus } from '@Utils/helper';
import { useSelector } from 'react-redux';
import { Scope } from '@Components/ui';

import './styles.scss';

/**
 * Page selectors contributed by addons: [{ name, title, addon? }].
 * Shared with the save handler in ../../index.js so a contributed field is
 * persisted without a second registration.
 */
export const getAddonPageFields = () =>
	applyFilters( 'storeengine.settings.page_fields', [] );

const Pages = () => {
	const allAddons = useSelector( ( state ) => state.addons );

	return (
		<Scope as="div" className="storeengine-tab-content">
			<div className="storeengine-tab-content--section">
				<h2 className="storeengine-heading">
					{ __( 'Pages', 'storeengine' ) }
				</h2>

				<PostSelect
					title={ __( 'Cart Page', 'storeengine' ) }
					name="cart_page"
					postType="page"
					isClearable={ false }
				/>

				<PostSelect
					title={ __( 'Checkout Page', 'storeengine' ) }
					name="checkout_page"
					postType="page"
					isClearable={ false }
				/>

				<PostSelect
					title={ __( 'Thankyou Page', 'storeengine' ) }
					name="thankyou_page"
					postType="page"
					isClearable={ false }
				/>

				<PostSelect
					title={ __( 'Dashboard Page', 'storeengine' ) }
					name="dashboard_page"
					postType="page"
					isClearable={ false }
				/>

				{ getAddonActiveStatus( allAddons, 'affiliate' ) && (
					<PostSelect
						title={ __(
							'Affiliate Registration Page',
							'storeengine'
						) }
						name="affiliate_registration_page"
						postType="page"
						isClearable={ false }
					/>
				) }

				{ getAddonActiveStatus( allAddons, 'membership' ) && (
					<PostSelect
						title={ __( 'Membership Pricing Page', 'storeengine' ) }
						name="membership_pricing_page"
						postType="page"
						isClearable={ false }
					/>
				) }

				{ /* Addon-contributed pages. An addon registers its page with the
				     PHP `storeengine/store_page_contents` filter (creation +
				     Tools → Regenerate) and its selector here, so it never needs
				     an edit to this file. `addon` gates the field on that addon
				     being active. */ }
				{ getAddonPageFields().map( ( field ) =>
					! field.addon ||
					getAddonActiveStatus( allAddons, field.addon ) ? (
						<PostSelect
							key={ field.name }
							title={ field.title }
							name={ field.name }
							postType="page"
							isClearable={ false }
						/>
					) : null
				) }
			</div>
		</Scope>
	);
};

export default Pages;
