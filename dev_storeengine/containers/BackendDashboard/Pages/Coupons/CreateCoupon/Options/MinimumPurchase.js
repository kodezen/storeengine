import React from 'react';
import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import Number from '@Components/Formik/Number';
import { Scope, Heading } from '@Components/ui';

const MinimumPurchase = () => {
	const { values } = useFormikContext();
	const requirementType =
		values?.meta?._storeengine_coupon_type_of_min_requirement;

	return (
		<Scope
			as="div"
			id="purchaseRequirements"
			className="storeengine-content-section storeengine-content-section__minimum-purchase-requirements"
		>
			<Heading as="p">
				{ __(
					'Purchase Requirements For Using This Coupon',
					'storeengine'
				) }
			</Heading>

			{ /* <div className="storeengine-content-section-title">  */ }
			<div className="storeengine-minimum-purchase-requirements__items">
				<label
					htmlFor="noMinimumPurchase"
					className="storeengine-minimum-purchase-requirements__label"
				>
					<Field
						id="noMinimumPurchase"
						type="radio"
						className="storeengine-radio"
						name="meta._storeengine_coupon_type_of_min_requirement"
						value="none"
					/>
					<span className="storeengine-title">
						{ __( 'No purchase requirements', 'storeengine' ) }
					</span>
				</label>

				<label
					htmlFor="minimumQuantityOfItems"
					className="storeengine-minimum-purchase-requirements__label"
				>
					<Field
						id="minimumQuantityOfItems"
						type="radio"
						className="storeengine-radio"
						name="meta._storeengine_coupon_type_of_min_requirement"
						value="quantity"
					/>
					<span className="storeengine-title">
						{ __( 'Minimum items in quantity', 'storeengine' ) }
					</span>
				</label>

				<label
					htmlFor="minimumAmountSpent"
					className="storeengine-minimum-purchase-requirements__label"
				>
					<Field
						id="minimumAmountSpent"
						type="radio"
						className="storeengine-radio"
						name="meta._storeengine_coupon_type_of_min_requirement"
						value="amount"
					/>
					<span className="storeengine-title">
						{ __( 'Minimum amount spent', 'storeengine' ) }
					</span>
				</label>
				{ /* </div> */ }
			</div>

			{ 'quantity' === requirementType ? (
				<Number
					name="meta._storeengine_coupon_min_purchase_quantity"
					readOnly={ false }
					suffix="plain mt-6"
				/>
			) : null }

			{ 'amount' === requirementType ? (
				<Number
					name="meta._storeengine_coupon_min_purchase_amount"
					readOnly={ false }
					currency={ true }
					suffix="plain mt-6"
				/>
			) : null }
		</Scope>
	);
};

export default MinimumPurchase;
