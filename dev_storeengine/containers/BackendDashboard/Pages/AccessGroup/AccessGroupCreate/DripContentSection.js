import { FieldArray, useFormikContext, Field } from 'formik';
import { __ } from '@wordpress/i18n';
import React from 'react';
import Button from '@Components/Button';
import { Select } from '@Components/ui/Select';

const DripContentSection = ( { options, onInputChange } ) => {
	const { values, setFieldValue } = useFormikContext();
	const { _storeengine_membership_drip_contents } = values.meta;

	return (
		<FieldArray name="meta._storeengine_membership_drip_contents">
			{ ( { push, remove } ) => (
				<>
					{ _storeengine_membership_drip_contents.length > 0 &&
						_storeengine_membership_drip_contents?.map(
							( item, index ) => {
								const selectedValue =
									options &&
									options?.reduce( ( acc, current ) => {
										const postIds =
											_storeengine_membership_drip_contents[
												index
											]?.post_id
												? _storeengine_membership_drip_contents[
														index
												  ]?.post_id
												: [];
										const content = postIds.find(
											( item ) => {
												if ( item === current.value ) {
													return current;
												}
											}
										);
										if ( content !== undefined ) {
											acc.push( current );
										}
										return acc;
									}, [] );

								return (
									<div
										key={ index }
										className="storeengine-content-section"
									>
										<div className="storeengine-content-section__drip-content">
											<div className="storeengine-drip-field">
												<label
													htmlFor={ `content-${ index }` }
													className="storeengine-drip-field__label"
												>
													{ __(
														'Show this content',
														'storeengine'
													) }
												</label>
												<Select
													className="storeengine-select"
													classNamePrefix="storeengine-react-select"
													placeholder={ __(
														'Search Content',
														'storeengine'
													) }
													isClearable={ true }
													options={ options }
													onInputChange={ onInputChange }
													isMulti
													onChange={ ( option ) => {
														const selectedOptions =
															( option || [] ).map(
																( current ) =>
																	current.value
															);
														setFieldValue(
															`meta._storeengine_membership_drip_contents.${ index }.post_id`,
															selectedOptions
														);
													} }
													value={ selectedValue }
												/>
											</div>

											<div className="storeengine-drip-field">
												<label
													htmlFor={ `drip-date-${ index }` }
													className="storeengine-drip-field__label"
												>
													{ __(
														'Available from',
														'storeengine'
													) }
												</label>
												<Field
													id={ `drip-date-${ index }` }
													type="date"
													name={ `meta._storeengine_membership_drip_contents.${ index }.specific_date` }
													placeholder={ __(
														'Select a date',
														'storeengine'
													) }
													className="storeengine-content-section__membership-expiration storeengine-input"
													value={
														values.meta
															?._storeengine_membership_drip_contents[
															index
														]?.specific_date || ''
													}
												/>
											</div>

											<Button
												icon={
													<span className="storeengine-icon storeengine-icon--trash" />
												}
												onClick={ () => remove( index ) }
												suffix="remove-content"
												preset="transparent"
											/>
										</div>
									</div>
								);
							}
						) }

					<Button
						iconPosition="left"
						label={ __( 'Add Drip Content', 'storeengine' ) }
						onClick={ () =>
							push( { post_id: '', specific_date: '' } )
						}
						preset="light-blue"
					/>
				</>
			) }
		</FieldArray>
	);
};

export default DripContentSection;
