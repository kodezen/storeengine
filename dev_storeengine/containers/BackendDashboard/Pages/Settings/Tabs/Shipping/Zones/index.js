import { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import OptionMenu from '@Components/OptionMenu';
import { Button, Row, Title, SubTitle } from '@Components/ui';
import Methods from '../Methods';
import { useDispatch } from 'react-redux';
import { deleteShippingZone } from '@Redux/Slices/settingsSlice/ShippingActions';
import EditZone from './EditZone';
import { API, namespace } from '@Utils/helper';

const Zones = ( { shippingZones } ) => {
	const dispatch = useDispatch();
	const [ editZone, setEditZone ] = useState( {
		isEditing: false,
		formData: null,
	} );
	const [ zoneData, setZoneData ] = useState( [] );

	useEffect( () => {
		( async () => {
			const { data } = await API.get( namespace + 'shipping/regions' );
			setZoneData( data );
		} )();
	}, [] );

	return (
		<div className="flex flex-col w-full gap-4">
			{ shippingZones?.length > 0 ? (
				<>
					{ shippingZones?.map( ( zone, zoneIndex ) => {
						const isFormOpen =
							editZone.isEditing &&
							editZone.formData &&
							parseInt( editZone.formData.zone_id ) ===
								parseInt( zone.zone_id );
						return (
							<React.Fragment key={ zoneIndex }>
								{ isFormOpen ? (
									<EditZone
										formData={ editZone.formData }
										setEditZone={ setEditZone }
										zoneData={ zoneData }
									/>
								) : (
									<div className="bg-se-white p-6 rounded-se shadow-se-card border border-se-border flex flex-col gap-4">
										<Row justify="between" className="w-full">
											<div className="flex items-center gap-2">
												<Title as="span" className="text-base">
													{ zone?.zone_name }
												</Title>
												<span className="w-[5px] h-[5px] rounded-full bg-se-text shrink-0" />
												<SubTitle as="span" className="text-se-muted">
													{ zone?.formatted_zone_location }
												</SubTitle>
											</div>
											<div>
												<OptionMenu
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
																setEditZone( {
																	isEditing: true,
																	formData:
																		zone,
																} ),
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
															onClick: () =>
																dispatch(
																	deleteShippingZone(
																		zone.zone_id
																	)
																),
														},
													] }
												/>
											</div>
										</Row>
										<div>
											<Methods zone={ zone } />
										</div>
									</div>
								) }
							</React.Fragment>
						);
					} ) }
				</>
			) : (
				<>
					{ ! editZone.isEditing && (
						<div className="flex flex-col gap-1">
							<Title>{ __( 'Shipping.', 'storeengine' ) }</Title>
							<SubTitle>
								{ __(
									'Manage where you ship and how much you charge.',
									'storeengine'
								) }
							</SubTitle>
						</div>
					) }
				</>
			) }
			{ ! editZone.isEditing && ! editZone.formData && (
				<div>
					<Button
						preset="primary"
						icon="storeengine-icon--add"
						onClick={ () => {
							setEditZone( {
								isEditing: true,
								formData: null,
							} );
						} }
					>
						{ shippingZones?.length > 0
							? __( 'Add Another Shipping Zone', 'storeengine' )
							: __( 'Add Shipping Zone', 'storeengine' ) }
					</Button>
				</div>
			) }
			{ editZone.isEditing && ! editZone.formData && (
				<EditZone
					formData={ null }
					setEditZone={ setEditZone }
					zoneData={ zoneData }
				/>
			) }
		</div>
	);
};

export default Zones;
