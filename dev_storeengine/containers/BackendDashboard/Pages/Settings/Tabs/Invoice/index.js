import { useState } from 'react';
import { __, _x } from '@wordpress/i18n';
import { Select } from '@Components/ui/Select';
import { Field, useFormikContext } from 'formik';
import Checkbox from '@Components/Formik/Checkbox';
import Text from '@Components/Formik/Text';
import Textarea from '@Components/Formik/Textarea';
import LogoUpload from '@Components/UploadImage/LogoUpload';
import { Scope, Heading, Button } from '@Components/ui';
import InvoicePreviewModal from './InvoicePreviewModal';
import {
	dateOptions,
	dateShowOptions,
	displayInvoiceButtonOptions,
	emailAttachMentsOptions,
	paperSizes,
	viewPdfOptions,
} from './helper';

import './styles.scss';

const numberResetOptions = [
	{ value: 'none', label: __( 'Never (continuous)', 'storeengine' ) },
	{ value: 'yearly', label: __( 'Yearly', 'storeengine' ) },
];

const Invoice = () => {
	const { values, setFieldValue } = useFormikContext();
	const { invoice } = values;
	const [ isPreviewOpen, setIsPreviewOpen ] = useState( false );

	return (
		<Scope>
			<div className="storeengine-content-section">
				<div className="flex items-center justify-between w-full border-0 border-b border-solid border-se-border mb-6 pb-4">
					<h2 className="text-lg leading-[25.2px] m-0 text-se-text">
						{ __( 'Invoice', 'storeengine' ) }
					</h2>
					<Button
						type="button"
						preset="outline"
						icon="storeengine-icon--eye"
						onClick={ () => setIsPreviewOpen( true ) }
					>
						{ __( 'Preview Invoice', 'storeengine' ) }
					</Button>
				</div>
				<div className="storeengine-content-section storeengine-tab-content--section">
					<Heading>
						{ __( 'Add Logo', 'storeengine' ) }
					</Heading>
					<div className="storeengine-tab-content-brandAndStyle__logo">
						<div className="logo-upload-section">
							<LogoUpload
								name={ 'invoice.logo' }
								saveValueHandler={ setFieldValue }
								value={ invoice?.logo }
								imageSize={ _x(
									'512X512 pixels',
									'Image size recommendation.',
									'storeengine'
								) }
								supportedFile={ __(
									'Support: PNG, JPG or jpeg.',
									'storeengine'
								) }
							/>
						</div>
					</div>
				</div>
				<h2 className="storeengine-title storeengine-mb-2">
					{ __( 'Paper Size', 'storeengine' ) }
				</h2>
				<Select
					id="invoice_paper_size"
					name={ 'invoice.invoice_paper_size' }
					className="storeengine-select storeengine-mb-6"
					classNamePrefix="storeengine-react-select"
					placeholder={ __( 'Select Paper Size', 'storeengine' ) }
					isSearchable={ true }
					value={
						values.invoice
							? paperSizes?.find(
									( item ) =>
										item.value ===
										values.invoice.invoice_paper_size
							)
							: {}
					}
					options={ paperSizes }
					onChange={ ( option ) =>
						setFieldValue( 'invoice.invoice_paper_size', option?.value )
					}
				/>
				<h2 className="storeengine-title storeengine-mb-2">
					{ __( 'Date Formats', 'storeengine' ) }
				</h2>
				<Select
					id="date_format"
					name={ 'invoice.date_format' }
					className="storeengine-select storeengine-mb-6"
					classNamePrefix="storeengine-react-select"
					placeholder={ __( 'Select Date format', 'storeengine' ) }
					isSearchable={ true }
					value={
						invoice
							? dateOptions?.find(
									( item ) => item.value === invoice.date_format
							)
							: {}
					}
					options={ dateOptions }
					onChange={ ( option ) =>
						setFieldValue( 'invoice.date_format', option?.value )
					}
				/>
				<h2 className="storeengine-title storeengine-mb-2">
					{ __( 'Display Invoice Button', 'storeengine' ) }
				</h2>
				<Select
					id="invoice_front_btn"
					name={ 'invoice.invoice_front_btn' }
					className="storeengine-select storeengine-mb-6"
					classNamePrefix="storeengine-react-select"
					placeholder={ __(
						'Select Display Invoice Button',
						'storeengine'
					) }
					isSearchable={ true }
					value={
						values.invoice
							? displayInvoiceButtonOptions?.find(
									( item ) =>
										item.value ===
										values.invoice.invoice_front_btn
							)
							: {}
					}
					options={ displayInvoiceButtonOptions }
					onChange={ ( option ) =>
						setFieldValue( 'invoice.invoice_front_btn', option?.value )
					}
				/>
				<h2 className="storeengine-title storeengine-mb-2">
					{ __( 'Invoice Attach to', 'storeengine' ) }
				</h2>
				<Select
					id="invoice_mail_attachment"
					name={ 'invoice.invoice_mail_attachment' }
					className="storeengine-select storeengine-mb-6"
					classNamePrefix="storeengine-react-select"
					placeholder={ __( 'Select Invoice Attach to', 'storeengine' ) }
					isSearchable={ true }
					isMulti={ true }
					value={
						invoice
							? emailAttachMentsOptions?.filter( ( item ) =>
									invoice.invoice_mail_attachment.includes(
										item.value
									)
							)
							: []
					}
					options={ emailAttachMentsOptions }
					onChange={ ( selectedOptions ) =>
						setFieldValue(
							'invoice.invoice_mail_attachment',
							selectedOptions?.map( ( item ) => item.value ) || []
						)
					}
				/>

				<div className="storeengine-mb-6">
					<h3 className="storeengine-title storeengine-mb-2">
						{ __( 'View Pdf', 'storeengine' ) }
					</h3>
					<div className="storeengine-flex storeengine-flex-gap-12">
						{ viewPdfOptions.map( ( item, index ) => (
							<label
								className="storeengine-radio-option"
								key={ index }
								htmlFor={ `invoice_front_view-${ index }` }
							>
								<Field
									id={ `invoice_front_view-${ index }` }
									name="invoice.invoice_front_view"
									type="radio"
									className="storeengine-radio"
									value={ item.value }
								/>
								<span>{ item.label }</span>
							</label>
						) ) }
					</div>
				</div>
				<div className="storeengine-mb-6">
					<h3 className="storeengine-title storeengine-mb-2">
						{ __( 'Date to show in the invoice', 'storeengine' ) }
					</h3>
					<div className="storeengine-flex storeengine-flex-gap-12">
						{ dateShowOptions.map( ( item, index ) => (
							<label
								className="storeengine-radio-option"
								key={ index }
								htmlFor={ `invoice_date_from-${ index }` }
							>
								<Field
									id={ `invoice_date_from-${ index }` }
									name="invoice.invoice_date_from"
									type="radio"
									className="storeengine-radio"
									value={ item.value }
								/>
								<span>{ item.label }</span>
							</label>
						) ) }
					</div>
				</div>
				<Checkbox
					title={ __( 'Show product image', 'storeengine' ) }
					name="invoice.invoice_show_product_image"
				/>
				<Text
					title={ __( 'Invoice Note', 'storeengine' ) }
					placeholder="Write your note"
					name="invoice.invoice_default_note"
					readOnly={ false }
				/>
				<Textarea
					name="invoice.invoice_footer_text"
					title={ __( 'Footer Text', 'storeengine' ) }
					placeholder={ __( 'Enter Your Text Here', 'storeengine' ) }
					suffix="plain"
				/>
			</div>

			<div className="storeengine-content-section">
				<Heading>
					{ __( 'Legal / Germany (§14 UStG)', 'storeengine' ) }
				</Heading>

				<h3 className="storeengine-title storeengine-mb-2">
					{ __( 'Invoice numbering', 'storeengine' ) }
				</h3>
				<Text
					title={ __( 'Number prefix', 'storeengine' ) }
					placeholder="RE-"
					name="invoice.invoice_number_prefix"
					readOnly={ false }
				/>
				<Text
					title={ __( 'Minimum digits (zero-padding)', 'storeengine' ) }
					placeholder="4"
					name="invoice.invoice_number_padding"
					readOnly={ false }
				/>
				<Text
					title={ __( 'Next number (start)', 'storeengine' ) }
					placeholder="1"
					name="invoice.invoice_number_next"
					readOnly={ false }
				/>
				<h3 className="storeengine-title storeengine-mb-2">
					{ __( 'Reset numbering', 'storeengine' ) }
				</h3>
				<Select
					id="invoice_number_reset"
					name="invoice.invoice_number_reset"
					className="storeengine-select storeengine-mb-6"
					classNamePrefix="storeengine-react-select"
					value={ numberResetOptions.find(
						( item ) => item.value === invoice?.invoice_number_reset
					) }
					options={ numberResetOptions }
					onChange={ ( option ) =>
						setFieldValue(
							'invoice.invoice_number_reset',
							option?.value
						)
					}
				/>

				<h3 className="storeengine-title storeengine-mb-2">
					{ __( 'Seller legal details', 'storeengine' ) }
				</h3>
				<Text
					title={ __( 'Legal company name', 'storeengine' ) }
					placeholder={ __( 'e.g. Muster GmbH', 'storeengine' ) }
					name="invoice.invoice_seller_legal_name"
					readOnly={ false }
				/>
				<Text
					title={ __( 'Tax number (Steuernummer)', 'storeengine' ) }
					name="invoice.invoice_tax_number"
					readOnly={ false }
				/>
				<Text
					title={ __( 'VAT ID (USt-IdNr.)', 'storeengine' ) }
					name="invoice.invoice_vat_id"
					readOnly={ false }
				/>
				<Textarea
					name="invoice.invoice_seller_extra"
					title={ __(
						'Additional legal info (register court, HRB, managing director…)',
						'storeengine'
					) }
				/>

				<h3 className="storeengine-title storeengine-mb-2">
					{ __( 'Tax notes', 'storeengine' ) }
				</h3>
				<Checkbox
					title={ __(
						'Show delivery/service date note',
						'storeengine'
					) }
					name="invoice.invoice_show_delivery_note"
				/>
				<Checkbox
					title={ __(
						'Small business (Kleinunternehmer §19 UStG) — do not show VAT',
						'storeengine'
					) }
					name="invoice.invoice_kleinunternehmer"
				/>
				<Text
					title={ __( 'Small-business note', 'storeengine' ) }
					name="invoice.invoice_kleinunternehmer_note"
					readOnly={ false }
					prefix={"plain"}
				/>
			</div>

			<InvoicePreviewModal
				isOpen={ isPreviewOpen }
				onRequestClose={ () => setIsPreviewOpen( false ) }
				invoice={ invoice }
			/>
		</Scope>
	);
};

export default Invoice;
