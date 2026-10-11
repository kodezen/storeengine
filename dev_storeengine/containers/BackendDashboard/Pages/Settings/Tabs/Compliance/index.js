import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Field, FieldArray, useFormikContext } from 'formik';
import { ContentSection, TabContent } from '../../Layouts';
import Text from '@Components/Formik/Text';
import Select from '@Components/Formik/Select';
import SwitchControl from '@Components/Formik/SwitchControl';
import PostSelect from '@Components/PostSelect';
import OptionMenu from '@Components/OptionMenu';
import { Scope, Button } from '@Components/ui';

import './styles.scss';

const roleOptions = [
	{ value: 'none', label: __( 'None', 'storeengine' ) },
	{
		value: 'newsletter',
		label: __( 'Newsletter (sync opt-in to GemCRM)', 'storeengine' ),
	},
];

const newCheckbox = ( order ) => ( {
	key: '',
	label: '',
	required: false,
	role: 'none',
	page: 0,
	enabled: true,
	order,
} );

/**
 * German / EU compliance settings: checkout button text, VAT transparency,
 * legal-document PDFs, and a dynamic consent-checkbox builder.
 */
export default function Compliance() {
	const { values } = useFormikContext();
	const checkboxes = values.compliance_consent_checkboxes || [];
	// Which consent rows are expanded (accordion). Multiple may be open.
	const [ openRows, setOpenRows ] = useState( () => new Set() );
	// Row index awaiting delete confirmation (null = none).
	const [ confirmDelete, setConfirmDelete ] = useState( null );
	const toggleRow = ( i ) =>
		setOpenRows( ( prev ) => {
			const next = new Set( prev );
			next.has( i ) ? next.delete( i ) : next.add( i );
			return next;
		} );

	return (
		<Scope>
		<TabContent name="compliance">
			<ContentSection
				slug="compliance-button"
				label={ __( 'Checkout Button', 'storeengine' ) }
			>
				<Text
					name="place_order_button_text"
					title={ __( 'Place-order button text', 'storeengine' ) }
					placeholder={ __( 'Place Order', 'storeengine' ) }
					desc={ __(
						'Leave empty for the default. For Germany use e.g. “Kostenpflichtig bestellen”.',
						'storeengine'
					) }
					prefix={"plain"}
				/>
			</ContentSection>

			<ContentSection
				slug="compliance-vat"
				label={ __( 'VAT Transparency', 'storeengine' ) }
			>
				<label className="storeengine-consent-builder__switch">
					<Field
						name="compliance_vat_breakdown"
						type="checkbox"
						component={ SwitchControl }
					/>
					<span>
						{ __(
							'Show net total + per-rate VAT breakdown on cart & checkout',
							'storeengine'
						) }
					</span>
				</label>
			</ContentSection>

			<ContentSection
				slug="compliance-docs"
				label={ __(
					'Legal Documents (attached to confirmation email)',
					'storeengine'
				) }
			>
				<PostSelect
					name="compliance_legal_docs.agb_page"
					postType="page"
					title={ __( 'Terms & Conditions (AGB) page', 'storeengine' ) }
					placeholder={ __( 'Select a page', 'storeengine' ) }
				/>
				<PostSelect
					name="compliance_legal_docs.widerruf_page"
					postType="page"
					title={ __(
						'Revocation Policy (Widerrufsbelehrung) page',
						'storeengine'
					) }
					placeholder={ __( 'Select a page', 'storeengine' ) }
				/>
				<p className="storeengine-consent-builder__hint">
					{ __(
						'Selected pages are rendered to PDF and attached to the order-confirmation email. Requires the Invoice + Email addons (PDF/font infrastructure).',
						'storeengine'
					) }
				</p>
			</ContentSection>

			<ContentSection
				slug="compliance-consent"
				label={ __( 'Consent Checkboxes', 'storeengine' ) }
			>
				<p className="storeengine-consent-builder__hint">
					{ __(
						'Checkboxes shown above the order button. Mandatory ones block the order until ticked; consent is logged (who/when/what/how).',
						'storeengine'
					) }
				</p>

				<FieldArray name="compliance_consent_checkboxes">
					{ ( helpers ) => (
						<div className="flex flex-col gap-2.5">
							{ checkboxes.map( ( box, i ) => {
								const isOpen = openRows.has( i );
								return (
									<div
										key={ i }
										className="overflow-hidden rounded-se border border-solid border-se-border bg-se-white"
									>
										{ /* Accordion header — summary + expand + remove. */ }
										<div
											role="button"
											tabIndex={ 0 }
											onClick={ () => toggleRow( i ) }
											onKeyDown={ ( e ) => {
												if (
													e.key === 'Enter' ||
													e.key === ' '
												) {
													e.preventDefault();
													toggleRow( i );
												}
											} }
											className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-se-bg"
										>
											<span
												className="storeengine-icon storeengine-icon--arrow-down text-se-subtitle text-sm transition-transform"
												style={ {
													transform: isOpen
														? 'rotate(180deg)'
														: 'none',
												} }
												aria-hidden="true"
											/>
											<div className="min-w-0 flex-1">
												<div className="truncate text-sm font-semibold text-se-text">
													{ box.label ||
														box.key ||
														__(
															'Untitled checkbox',
															'storeengine'
														) }
												</div>
												{ box.key && (
													<div className="truncate text-xs text-se-subtitle">
														#{ box.key }
													</div>
												) }
											</div>
											{ box.required && (
												<span className="shrink-0 rounded-full bg-se-primary-light px-2.5 py-1 text-[11px] font-semibold text-se-primary">
													{ __(
														'Mandatory',
														'storeengine'
													) }
												</span>
											) }
											{ ! box.enabled && (
												<span className="shrink-0 rounded-full bg-se-bg px-2.5 py-1 text-[11px] font-semibold text-se-placeholder">
													{ __(
														'Disabled',
														'storeengine'
													) }
												</span>
											) }
											<div
												className="shrink-0"
												onClick={ ( e ) =>
													e.stopPropagation()
												}
											>
												{ confirmDelete === i ? (
													<div className="flex items-center gap-2">
														<span className="text-xs text-se-subtitle">
															{ __(
																'Delete?',
																'storeengine'
															) }
														</span>
														<Button
															type="button"
															preset="danger"
															size="xs"
															onClick={ () => {
																helpers.remove(
																	i
																);
																setConfirmDelete(
																	null
																);
															} }
														>
															{ __(
																'Delete',
																'storeengine'
															) }
														</Button>
														<Button
															type="button"
															preset="outline"
															size="xs"
															onClick={ () =>
																setConfirmDelete(
																	null
																)
															}
														>
															{ __(
																'Cancel',
																'storeengine'
															) }
														</Button>
													</div>
												) : (
													<OptionMenu
														suffix="consent-row"
														options={ [
															{
																type: 'button',
																label: __(
																	'Delete',
																	'storeengine'
																),
																suffix: 'trash',
																icon: (
																	<span className="storeengine-icon storeengine-icon--trash" />
																),
																onClick: () =>
																	setConfirmDelete(
																		i
																	),
															},
														] }
													/>
												) }
											</div>
										</div>

										{ /* Accordion body — the fields. */ }
										{ isOpen && (
											<div className="flex flex-col gap-3 border-t border-solid border-se-border p-4">
												<div className="grid grid-cols-2 gap-3">
													<Text
														name={ `compliance_consent_checkboxes.${ i }.key` }
														title={ __(
															'Key (unique id)',
															'storeengine'
														) }
														placeholder="agb"
													/>
													<Text
														name={ `compliance_consent_checkboxes.${ i }.label` }
														title={ __(
															'Label shown to the customer',
															'storeengine'
														) }
													/>
												</div>
												<div className="grid grid-cols-3 gap-3">
													<Select
														name={ `compliance_consent_checkboxes.${ i }.role` }
														title={ __(
															'Role',
															'storeengine'
														) }
														options={ roleOptions }
													/>
													<Text
														name={ `compliance_consent_checkboxes.${ i }.page` }
														type="number"
														title={ __(
															'Linked page ID (optional)',
															'storeengine'
														) }
													/>
													<Text
														name={ `compliance_consent_checkboxes.${ i }.order` }
														type="number"
														title={ __(
															'Display order',
															'storeengine'
														) }
													/>
												</div>
												<div className="flex flex-wrap gap-x-8 gap-y-2">
													<label className="storeengine-consent-builder__switch">
														<Field
															name={ `compliance_consent_checkboxes.${ i }.required` }
															type="checkbox"
															component={
																SwitchControl
															}
														/>
														<span>
															{ __(
																'Mandatory (blocks order if unticked)',
																'storeengine'
															) }
														</span>
													</label>
													<label className="storeengine-consent-builder__switch">
														<Field
															name={ `compliance_consent_checkboxes.${ i }.enabled` }
															type="checkbox"
															component={
																SwitchControl
															}
														/>
														<span>
															{ __(
																'Enabled',
																'storeengine'
															) }
														</span>
													</label>
												</div>
											</div>
										) }
									</div>
								);
							} ) }

							<div>
								<Button
									type="button"
									preset="primary"
									icon="storeengine-icon--add"
									onClick={ () => {
										helpers.push(
											newCheckbox( checkboxes.length + 1 )
										);
										// Auto-expand the freshly added row.
										setOpenRows( ( prev ) =>
											new Set( prev ).add(
												checkboxes.length
											)
										);
									} }
								>
									{ __( 'Add checkbox', 'storeengine' ) }
								</Button>
							</div>
						</div>
					) }
				</FieldArray>
			</ContentSection>
		</TabContent>
		</Scope>
	);
}
