import React, { useState } from 'react';
import { Scope, Heading, Button, Checkbox } from '@Components/ui';
import OptionMenu from '@Components/OptionMenu';
import { useFormikContext } from 'formik';
import { getSeGlobal, makeRequest2, plugin_root_url } from '@Utils/helper';
import { __ } from '@wordpress/i18n';
import IntegrationForm from './IntegrationForm';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

import './styles.scss';
import ReactModal from '@Components/Modal/ReactModal';

const propTypes = {};

export default function Integration( { ID } ) {
	const { values, setFieldValue } = useFormikContext();
	const [ showPopup, setShowPopup ] = useState( false );
	const [ withBundle, setWithBundle ] = useState( false );
	const defaultImg = plugin_root_url + 'assets/images/place-holder.png';
	const [ openIntegrationForm, isOpenIntegrationForm ] = useState( false );
	const [ providedFields, setProviderFields ] = useState( false );
	const dispatch = useDispatch();

	/**
	 *
	 * @param {number} id
	 * @return {Promise<void>}
	 */
	const handleDelete = async ( id ) => {
		let params = { id };
		if ( withBundle ) {
			params = { ...params, with_course_bundle: withBundle };
		}

		try {
			await makeRequest2( 'delete_product_integration', { ...params } );
			const filteredIntegrations = values.integrations.filter(
				( integration ) => integration?.id !== id
			);
			setFieldValue( 'integrations', filteredIntegrations );
			dispatch(
				showNotification( {
					message: __( 'Item removed.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
		} catch ( error ) {
			dispatch(
				showNotification( {
					message: error?.message || error,
					isShow: true,
					type: 'error',
				} )
			);
		} finally {
			setShowPopup( false );
		}
	};

	return (
		<React.Fragment>
			<Scope
				as="div"
				className="storeengine-content-section storeengine-content-section--integration"
			>
				<Heading>
					{ __( 'Integration', 'storeengine' ) }
				</Heading>

				<div className="storeengine-product-editor-integrations">
					{ values?.integrations?.length > 0 &&
						values.integrations.map( ( integration, index ) => {
							const matchingIntegration = getSeGlobal(
								'integrations',
								[]
							).find( ( i ) => i.value === integration.provider );
							const filterPrice = values.prices.find(
								( p ) =>
									parseInt( p.id ) ===
									parseInt( integration.price_id )
							);

							const isSubscriptionForbidden =
								[
									'storeengine/tutor-booking',
									'storeengine/course-bundle',
								].includes( integration.provider ) &&
								'subscription' === filterPrice.price_type;

							return (
								<div
									key={ index }
									className="storeengine-d-flex storeengine-integrate-item-wrap"
								>
									<div className="storeengine-integrate-item">
										<img
											src={
												matchingIntegration?.icon ||
												defaultImg
											}
											alt={
												matchingIntegration?.label ||
												integration.provider
											}
											className="storeengine-integrate-item__logo"
										/>

										<div className="storeengine-title-subtitle">
											<span className="storeengine-label-highlight">
												{ matchingIntegration?.label ||
													integration.provider }
											</span>
											<span className="storeengine-title">
												{ integration.provider }
											</span>
											{ isSubscriptionForbidden && (
												<div className="storeengine-warning storeengine-product-notice">
													<span
														className="storeengine-icon storeengine-icon--info-primary"
														aria-hidden={ true }
													/>
													<div className="storeengine-product-notice__body">
														<span className="storeengine-product-notice__text">
															{ __(
																'Subscription prices are not supported by this integration.',
																'storeengine'
															) }
														</span>
													</div>
												</div>
											) }
											</div>
											</div>

											<Button
												type="button"
												preset="outline-danger"
												size="md"
												icon="storeengine-icon--trash"
												aria-label={ __( 'Remove integration', 'storeengine' ) }
												onClick={ () => {
													setWithBundle( false );
													setShowPopup( integration );
												} }
											/>
									</div>
									);
									} ) }
					{ ID ? (
						<Button
							type="button"
							preset="outline"
							icon="storeengine-icon--add"
							onClick={ () => isOpenIntegrationForm( true ) }
						>
							{ __( 'Add Integration', 'storeengine' ) }
						</Button>
					) : (
						<div className="storeengine-warning storeengine-product-notice">
							<span
								className="storeengine-icon storeengine-icon--info-primary"
								aria-hidden={ true }
							/>
							<div className="storeengine-product-notice__body">
								<span className="storeengine-product-notice__title">
									{ __( 'Save the product first', 'storeengine' ) }
								</span>
								<span className="storeengine-product-notice__text">
									{ __(
										'Integrations can be added once the product has been created.',
										'storeengine'
									) }
								</span>
							</div>
						</div>
					) }
				</div>
			</Scope>

			<ReactModal
				title={ __( 'Add Integration', 'storeengine' ) }
				isOpen={ openIntegrationForm }
				onRequestClose={ () => isOpenIntegrationForm( false ) }
				size="small"
				suffix="integration"
			>
				<IntegrationForm
					isOpenIntegrationForm={ isOpenIntegrationForm }
					providedFields={ providedFields }
					setProviderFields={ setProviderFields }
				/>
			</ReactModal>

			<ReactModal
				title={ __( 'Remove integration?', 'storeengine' ) }
				isOpen={ !! showPopup }
				onRequestClose={ () => setShowPopup( false ) }
				size="small"
				suffix="integration-delete"
			>
				<Scope className="storeengine-confrim-content">
					<p>
						{ __(
							'This integration will stop granting access for this product.',
							'storeengine'
						) }
					</p>
					{ showPopup?.provider === 'storeengine/course-bundle' && (
						<Checkbox
						className="mb-4"
						checked={ withBundle }
						onChange={ setWithBundle }
						label={ __( 'Also delete the course bundle', 'storeengine' ) }
					/>
					) }
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							preset="outline"
							onClick={ () => setShowPopup( false ) }
						>
							{ __( 'Cancel', 'storeengine' ) }
						</Button>
						<Button
							type="button"
							preset="danger"
							onClick={ () => handleDelete( showPopup.id ) }
						>
							{ __( 'Remove', 'storeengine' ) }
						</Button>
					</div>
				</Scope>
			</ReactModal>
		</React.Fragment>
	);
}

Integration.propTypes = propTypes;
