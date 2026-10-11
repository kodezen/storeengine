import React from 'react';
import Checkbox from '@Components/Formik/Checkbox';
import { __ } from '@wordpress/i18n';
import { Scope } from '@Components/ui';
import './styles.scss';

const PagesSetup = () => {
	return (
		<Scope
			as="div"
			id="settingsPagesSetup"
			className="storeengine-tab storeengine-tab-content-pages-setup"
		>
			<div className="storeengine-tab__heading">
				<p className="storeengine-tab__heading--label">
					{ __( 'Pages Setup', 'storeengine' ) }
				</p>
			</div>
			<div className="storeengine-tab-content-pages-setup__filter-actions">
				<p className="filter-actions-label">
					{ __( 'Filter', 'storeengine' ) }
				</p>
				<div className="filter-section">
					<p>(icon)</p>
					<Checkbox
						title="Search"
						name="filter-search-is-enable"
						suffix="filter-box"
					/>
				</div>
				<div className="filter-section">
					<p>(icon)</p>
					<Checkbox
						title="Category"
						name="filter-category-is-enable"
						suffix="filter-box"
					/>
				</div>
				<div className="filter-section">
					<p>(icon)</p>
					<Checkbox
						title="Price"
						name="filter-price-is-enable"
						suffix="filter-box"
					/>
				</div>
				<div className="filter-section">
					<p>(icon)</p>
					<Checkbox
						title="Review"
						name="filter-review-is-enable"
						suffix="filter-box"
					/>
				</div>
				<div className="filter-section">
					<p>(icon)</p>
					<Checkbox
						title="Stock"
						name="filter-stock-is-enable"
						suffix="filter-box"
					/>
				</div>
			</div>
			<div className="storeengine-tab-content-pages-setup__display-options">
				<div>
					<Checkbox
						title="Total sell count"
						name="filter-search-is-enable"
						suffix="display-action"
						// desc="Show the number of products sold"
					/>
					<p>Show the number of products sold</p>
				</div>
				<Checkbox
					title="Product review"
					name="filter-search-is-enable"
					suffix="display-action"
					// desc="Show the product review and rating"
				/>
			</div>
		</Scope>
	);
};

export default PagesSetup;
