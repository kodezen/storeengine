import React, { useState } from 'react';
import { useFormikContext, FieldArray } from 'formik';
import { useDispatch } from 'react-redux';
import { sprintf, __, _x } from '@wordpress/i18n';
import { Scope, Button } from '@Components/ui';
import Text from '@Components/Formik/Text';
import Textarea from '@Components/Formik/Textarea';
import Checkbox from '@Components/Formik/Checkbox';
import Password from '@Components/Formik/Password';
import CopyText from '@Components/Formik/CopyText';
import Tooltip from '@Components/Tooltip';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { Select } from '@Components/ui/Select';
import Label from '@Components/Formik/Label';

const RenderField = ( { method, name, field } ) => {
	const { values, setFieldValue } = useFormikContext();
	const fieldName = name;

	switch ( field.type ) {
		case 'repeater':
			const fields = Object.entries( field.fields );
			let field_values = [];
			const field_value = {};
			fields.forEach( ( [ _name, _field ] ) => {
				field_value[ _name ] = _field.default;
			} );
			if ( values.hasOwnProperty( name ) ) {
				field_values = values[ name ];
			}

			if ( ! field_values.length ) {
				field_values = [ field_value ];
			}

			return (
				<FieldArray
					name={ fieldName }
					render={ ( arrayHelpers ) => {
						return (
							<div
								className={
									'storeengine-repeater storeengine-payment-' +
									method +
									'--' +
									name
								}
							>
								<div className="storeengine-title-container storeengine-mb-4">
									<div className="storeengine-title-subtitle storeengine-mb-2">
										<span className="storeengine-title">
											{ field.label }
											{ field.tooltip ? (
												<Tooltip>
													{ field.tooltip }
												</Tooltip>
											) : null }
										</span>
										<Button
											onClick={ () =>
												arrayHelpers.push( field_value )
											}
											preset="primary"
										>
											{ field?.add_label
												? field.add_label
												: sprintf(
														// translators: %s: Label text.
														__(
															'Add %s',
															'storeengine'
														),
														field.label
												  ) }
										</Button>
									</div>
								</div>
								<div className="storeengine-column-items-field">
									{ fields &&
									fields.length > 0 &&
									field_values.length
										? field_values.map( ( _, index ) => (
												<fieldset
													className="storeengine-repeated-fields-wrapper"
													key={ index }
												>
													<div className="storeengine-title">
														<span>
															{ field?.repeater_label
																? sprintf(
																		field.repeater_label,
																		index +
																			1
																  )
																: sprintf(
																		// translators: %1$s Field label, %2$s Sequence number
																		_x(
																			'%1$s: #%2$s',
																			'Repeater fieldset label with sequence number.',
																			'storeengine'
																		),
																		field.label,
																		index +
																			1
																  ) }
														</span>
														<Button
															type="button"
															preset="danger"
															onClick={ ( e ) => {
																e.preventDefault();
																if (
																	field_values.length ===
																	1
																) {
																	return;
																}
																arrayHelpers.remove(
																	index
																);
															} }
															aria-label={ sprintf(
																// translators: %s. Repeater group name/label.
																__(
																	'Remove %s',
																	'storeengine'
																),
																field.label
															) }
															disabled={
																field_values.length ===
																1
															}
															icon="storeengine-icon--trash"
														/>
													</div>
													<div
														className={
															'storeengine-repeated-fields storeengine-payment-' +
															method +
															'-' +
															name +
															'--fields'
														}
														style={ {
															flexGrow: 1,
														} }
													>
														{ fields.map(
															(
																[
																	nestedName,
																	nestedField,
																],
																key
															) => (
																<div
																	className={
																		'storeengine-payment-' +
																		method +
																		'--' +
																		name +
																		' ' +
																		name +
																		'--' +
																		nestedName
																	}
																	key={ key }
																>
																	<RenderField
																		method={
																			method
																		}
																		name={ `${ fieldName }.${ index }.${ nestedName }` }
																		field={
																			nestedField
																		}
																	/>
																</div>
															)
														) }
													</div>
												</fieldset>
										  ) )
										: null }
								</div>
								<Button
									type="button"
									preset="primary"
									size="md"
									onClick={ () =>
										arrayHelpers.push( field_value )
									}
									style={ { margin: '20px auto 30px auto' } }
								>
									{ field?.add_label
										? field.add_label
										: sprintf(
												// translators: %s: Label text.
												__(
													'Add %s',
													'storeengine'
												),
												field.label
										  ) }
								</Button>
							</div>
						);
					} }
				/>
			);

		case 'textarea':
			return (
				<Textarea
					name={ fieldName }
					title={ field.label }
					placeholder={ field.placeholder || '' }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
					autocomplete={ field?.autocomplete || '' }
				/>
			);
		case 'checkbox':
			return (
				<Checkbox
					name={ fieldName }
					title={ field.label }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
				/>
			);
		case 'password':
			return (
				<Password
					name={ fieldName }
					title={ field.label }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
				/>
			);
		case 'copy_text':
			return (
				<CopyText
					title={ field.label }
					value={ field.value || '' }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
				/>
			);
		case 'select':
		case 'multiselect':
			const flattenedOptions = React.useMemo(
				() =>
					field.options.flatMap( ( item ) =>
						item.options ? item.options : item
					),
				[ field ]
			);
			const selectedOptions = React.useCallback( () => {
				if ( field?.multi ) {
					return flattenedOptions.filter( ( item ) =>
						values[ name ]?.includes( item.value )
					);
				}

				return flattenedOptions.find(
					( item ) => item.value === values[ name ]
				);
			}, [ values[ name ] ] );
			return (
				<div className="storeengine-text">
					<Label
						htmlFor={ fieldName }
						title={ field.label }
						desc={ field.desc || field.description || '' }
						tooltip={ field.tooltip || '' }
						readOnly={ field?.readonly || false }
						isRequired={ field?.required || false }
					/>
					<Select
						name={ fieldName }
						className="storeengine-select"
						classNamePrefix="storeengine-react-select"
						placeholder={ __( 'Select an item', 'storeengine' ) }
						isDisabled={ field?.readonly || false }
						required={ field?.required || false }
						isMulti={ field?.multi || false }
						value={ selectedOptions() }
						options={ field.options }
						onChange={ ( option ) => {
							if ( field?.multi ) {
								setFieldValue(
									fieldName,
									option?.map( ( o ) => o.value )
								);

								return;
							}

							setFieldValue( fieldName, option?.value );
						} }
					/>
				</div>
			);
		case 'safe_text':
		case 'text':
		default:
			return (
				<Text
					name={ fieldName }
					title={ field.label }
					placeholder={ field.placeholder || '' }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
					autocomplete={ field?.autocomplete || '' }
				/>
			);
	}
};

const RenderFields = ( { method, fields } ) => {
	const { values } = useFormikContext();

	return Object.entries( fields )
		.filter( ( [ name, field ] ) => {
			if ( ! field.dependency ) {
				return true;
			}

			return Object.entries( field.dependency ).every(
				( [ key, value ] ) => values[ key ] === value
			);
		} )
		.map( ( [ name, field ], key ) => (
			<RenderField
				method={ method }
				name={ name }
				field={ field }
				key={ key }
			/>
		) );
};

function PaymentSettings( {
	method,
	label,
	description = '',
	fields = [],
	options = {},
	setOpen,
	fieldUpdateHandler,
	payments,
	parentFormSubmitter,
} ) {
	const [ verificationLoading, setVerificationLoading ] = useState( false );
	const dispatch = useDispatch();
	const { values, isSubmitting, submitForm, resetForm } = useFormikContext();

	const handleVerify = async ( e ) => {
		e.preventDefault();

		setVerificationLoading( true );

		const updatedGateway = {
			...payments,
			[ method ]: {
				...payments?.[ method ],
				...values,
				is_enabled: true,
			},
		};
		try {
			await API.post( namespace + 'settings/verify-payment-gateways', {
				method,
				config: { ...values, is_enabled: true },
			} );
			fieldUpdateHandler( 'payments', updatedGateway );
			dispatch(
				showNotification( {
					message: sprintf(
						// translators: %s. Payment method name.
						__(
							'%s settings have been successfully verified.',
							'storeengine'
						),
						label
					),
					isShow: true,
					type: 'success',
				} )
			);
			setTimeout( () => {
				parentFormSubmitter();
			}, 1000 );
			setOpen( false );
		} catch ( error ) {
			dispatch(
				showNotification( {
					message: error,
					isShow: true,
					type: 'error',
				} )
			);
		}

		setVerificationLoading( false );
	};

	return (
		<Scope>
			<div
				className={ `storeengine-payment-settings-form storeengine-payment-${ method }` }
			>
				<div className="storeengine-payment-description">
					<p style={ { marginTop: 0 } }>{ description }</p>
				</div>
				<RenderFields method={ method } fields={ fields } />
				<div
					className="flex justify-end gap-4 border-0 border-t border-solid border-se-border pt-4"
				>
					<Button
						preset="outline"
						onClick={ () => {
							resetForm();
							setOpen( false );
						} }
					>
						{ __( 'Cancel', 'storeengine' ) }
					</Button>
					{ options.verify_config ? (
						<Button
							preset="primary"
							onClick={ handleVerify }
							isLoading={ verificationLoading }
						>
							{ __( 'Verify and Save', 'storeengine' ) }
						</Button>
					) : (
						<Button
							preset="primary"
							isLoading={ isSubmitting }
							onClick={ submitForm }
						>
							{ __( 'Save', 'storeengine' ) }
						</Button>
					) }
				</div>
			</div>
		</Scope>
	);
}

export default PaymentSettings;
