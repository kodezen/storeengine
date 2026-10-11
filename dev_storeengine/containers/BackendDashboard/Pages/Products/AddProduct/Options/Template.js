import React, { useState } from 'react';
import Text from '@Components/Formik/Text';
import { useFormikContext } from 'formik';
import { Scope, Button } from '@Components/ui';
import { __ } from '@wordpress/i18n';
import ReactModal from '@Components/Modal/ReactModal';
import OptionMenu from '@Components/OptionMenu';
import { Select } from '@Components/ui/Select';

const Template = () => {
	const [ openTemplateModal, setOpenTemplateModal ] = useState( false );
	const { values, setFieldValue } = useFormikContext();
	const templateOptions = [
		{ value: '', label: __( 'Select Template', 'storeengine' ) },
		{ value: 'default', label: __( 'Default', 'storeengine' ) },
		{
			value: 'tshirtTemplate',
			label: __( 'Tshirt Template', 'storeengine' ),
		},
		{
			value: 'shirtTemplate',
			label: __( 'Shirt Template', 'storeengine' ),
		},
	];
	const handleRemoveAction = () => {
		setFieldValue( 'storeengine_product_template', [] );
	};
	const handleAddNewTemplate = () => {
		let templateValue = values?.storeengine_new_product_template
			.split( ' ' )
			.join( '' );
		templateValue =
			templateValue.charAt( 0 ).toLowerCase() + templateValue.slice( 1 );
		setFieldValue( 'storeengine_product_template', [ templateValue ] );
	};
	return (
		<>
			{ values?.storeengine_product_template?.length === 0 ? (
				<Scope
					as="div"
					id="productTemplate"
					className="storeengine-content-section"
				>
					<p className="storeengine-content-section--title">
						{ __( 'Template', 'storeengine' ) }
					</p>
					<div>
						<label htmlFor="saved-template">
							{ __( 'Saved Template', 'storeengine' ) }
						</label>
						<Select
							className="py-[6px] w-[260px] mt-2"
							options={ templateOptions }
							value={ templateOptions.find(
								( item ) =>
									item.value ===
									values.storeengine_product_template[ 0 ]
							) ?? null }
							onChange={ ( selectOption ) =>
								setFieldValue( 'storeengine_product_template', [
									selectOption.value,
								] )
							}
						/>
						<Button
							preset="soft"
							size="lg"
							onClick={ () => setOpenTemplateModal( true ) }
							style={ { marginTop: '10px' } }
						>
							{ __( '+ Add new template', 'storeengine' ) }
						</Button>
						<ReactModal
							title={ __( 'Template Name', 'storeengine' ) }
							isOpen={ openTemplateModal }
							isEnabledHeader={ true }
							onRequestClose={ () =>
								setOpenTemplateModal( false )
							}
							suffix="create-customer"
						>
							<Scope>
								<Text
									name={ 'storeengine_new_product_template' }
									placeholder={ 'Exa:- T-shirt Template' }
								/>
								<div className="storeengine-react-modal__footer">
									<Button
										type="button"
										onClick={ () =>
											setOpenTemplateModal( false )
										}
										preset="outline"
									>
										{ __( 'Cancel', 'storeengine' ) }
									</Button>
									<Button
										type="button"
										onClick={ handleAddNewTemplate }
									>
										{ __( 'Submit', 'storeengine' ) }
									</Button>
								</div>
							</Scope>
						</ReactModal>
					</div>
				</Scope>
			) : (
				<Scope as="div" className="storeengine-content-section">
					<div className="flex justify-between items-center border-b border-se-border mb-6 pb-5">
						<h3 className="storeengine-content-section--title">
							{ __( 'Template Name', 'storeengine' ) }
						</h3>
						<OptionMenu
							options={ [
								{
									type: 'button',
									label: __( 'View', 'storeengine' ),
								},
								{
									type: 'button',
									label: __( 'Remove', 'storeengine' ),
									onClick: () => {
										handleRemoveAction();
									},
								},
							] }
						/>
					</div>

					{ values?.storeengine_product_template }
				</Scope>
			) }
		</>
	);
};

export default Template;
