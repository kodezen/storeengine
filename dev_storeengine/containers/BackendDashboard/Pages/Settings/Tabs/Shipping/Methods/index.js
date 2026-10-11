import React, { useState } from 'react';
import OptionMenu from '@Components/OptionMenu';
import { Button, SubTitle } from '@Components/ui';
import { __ } from '@wordpress/i18n';
import Currency from '@Components/Currency';
import EditMethod from './EditMethod';
import { deleteShippingMethod } from '@Redux/Slices/settingsSlice/ShippingActions';
import { useDispatch } from 'react-redux';
import ExternalSubmitter from './ExternalSubmitter';

const Methods = ( { zone, enableAddOption = false, fieldHander } ) => {
	const dispatch = useDispatch();
	const [ deleteLoading, setDeleteLoading ] = useState( false );
	const [ editMethod, setEditMethod ] = useState( {
		isEditing: false,
		formData: null,
	} );
	const hasZoneId = zone.hasOwnProperty( 'zone_id' );
	const isFormEmpty = ! editMethod.formData;
	const isEditing = editMethod.isEditing;
	const showAddButton = isFormEmpty && hasZoneId && ! isEditing;

	return (
		<>
			<div
				className={ `flex flex-col gap-2 ${
					enableAddOption ? 'mb-6' : ''
				}` }
			>
				{ zone.shipping_methods.length > 0 && (
					<>
						{ zone.shipping_methods.map(
							( method, methodIndex ) => {
								return (
									<React.Fragment key={ methodIndex }>
										{ editMethod.isEditing &&
										parseInt(
											editMethod.formData?.instance_id
										) ===
											parseInt( method?.instance_id ) ? (
											<EditMethod
												formData={ editMethod.formData }
												setEditMethod={ setEditMethod }
												zone={ zone }
											/>
										) : (
											<div className="flex justify-between items-center gap-3 py-3 border-b border-se-border">
												<div className="flex-1">
													{ method?.name }
												</div>
												<div className="flex-1">
													{
														method?.method_description
													}
												</div>
												<div className="flex-1">
													{ ' ' }
													<Currency
														value={ method?.cost }
													/>
												</div>
												<div className="flex gap-3 items-start">
													<ExternalSubmitter
														data={ method }
														zone={ zone }
													/>
													<OptionMenu
														isLoading={
															parseInt(
																deleteLoading
															) ===
															parseInt(
																method.instance_id
															)
														}
														options={ [
															{
																type: 'button',
																label: (
																	<span>
																		{ __(
																			'Edit',
																			'storeengine'
																		) }
																	</span>
																),
																icon: (
																	<span
																		className="storeengine-icon storeengine-icon--edit"
																		aria-hidden={
																			true
																		}
																	/>
																),
																onClick: () =>
																	setEditMethod(
																		{
																			isEditing: true,
																			formData:
																				method,
																		}
																	),
															},
															{
																type: 'button',
																suffix: 'trash',
																label: (
																	<span>
																		{ __(
																			'Delete',
																			'storeengine'
																		) }
																	</span>
																),
																icon: (
																	<span
																		className="storeengine-icon storeengine-icon--trash"
																		aria-hidden={
																			true
																		}
																	/>
																),
																isLoading:
																	deleteLoading,
																onClick:
																	async () => {
																		setDeleteLoading(
																			method.instance_id
																		);
																		await dispatch(
																			deleteShippingMethod(
																				{
																					method_id:
																						method.method_id,
																					instance_id:
																						method.instance_id,
																					zone,
																				}
																			)
																		);
																		if (
																			enableAddOption
																		) {
																			fieldHander(
																				'shipping_methods',
																				zone.shipping_methods.filter(
																					(
																						item
																					) =>
																						parseInt(
																							item.instance_id
																						) !==
																						parseInt(
																							method.instance_id
																						)
																				)
																			);
																		}
																		setDeleteLoading(
																			false
																		);
																	},
															},
														] }
													/>
												</div>
											</div>
										) }
									</React.Fragment>
								);
							}
						) }
					</>
				) }
			</div>

			{ showAddButton && (
				<React.Fragment>
					<div>
						<Button
							preset="ghost"
							icon="storeengine-icon--add"
							onClick={ () => {
								setEditMethod( {
									isEditing: true,
									formData: null,
								} );
							} }
						>
							{ zone.shipping_methods.length > 0
								? __( 'Add Another Method', 'storeengine' )
								: __( 'Add Method', 'storeengine' ) }
						</Button>
					</div>
					{ zone.shipping_methods.length === 0 && (
						<SubTitle>
							{ __(
								'Shipping method not added. Set one to continue.',
								'storeengine'
							) }
						</SubTitle>
					) }
				</React.Fragment>
			) }

			{ editMethod.isEditing && ! editMethod.formData && (
				<EditMethod
					formData={ null }
					setEditMethod={ setEditMethod }
					zone={ zone }
					fieldHander={ fieldHander }
				/>
			) }
		</>
	);
};

export default Methods;
