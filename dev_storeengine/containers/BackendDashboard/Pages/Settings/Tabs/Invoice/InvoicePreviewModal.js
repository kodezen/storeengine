import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import ReactModal from '@Components/Modal/ReactModal';
import Currency from '@Components/Currency';
import { API } from '@Utils/helper';
import { dateOptions } from './helper';

// Approximate CSS px width (@96dpi) for each paper size, used to give the
// preview a realistic sense of scale relative to the chosen paper size.
const PAPER_WIDTH = {
	a4: 794,
	a3: 1123,
	letter: 816,
};

/**
 * Mirrors addons/invoice/templates/invoice/template.php + style.css exactly
 * (markup structure, classes' intent, spacing), but rendered with Tailwind
 * and dummy data — so settings can be previewed before any order exists and
 * without requiring already-saved values.
 */
const InvoicePreviewModal = ( { isOpen, onRequestClose, invoice } ) => {
	const [ logoUrl, setLogoUrl ] = useState( '' );

	useEffect( () => {
		if ( ! isOpen ) {
			return;
		}

		if ( invoice?.logo ) {
			API.get( `wp/v2/media/${ invoice.logo }` )
				.then( ( res ) => setLogoUrl( res.data?.source_url || '' ) )
				.catch( () => setLogoUrl( '' ) );
		} else {
			setLogoUrl( '' );
		}
	}, [ isOpen, invoice?.logo ] );

	const dateLabel =
		dateOptions.find( ( item ) => item.value === invoice?.date_format )
			?.label || dateOptions[ 0 ].label;

	const paperWidth =
		PAPER_WIDTH[ invoice?.invoice_paper_size ] || PAPER_WIDTH.a4;

	const invoiceNumber =
		( invoice?.invoice_number_prefix || '' ) +
		String( invoice?.invoice_number_next || 1 ).padStart(
			Number( invoice?.invoice_number_padding ) || 4,
			'0'
		);

	const isKleinunternehmer = !! invoice?.invoice_kleinunternehmer;
	const showProductImage = !! invoice?.invoice_show_product_image;
	const showDelivery = !! invoice?.invoice_show_delivery_note;
	// Mirrors `$show_tax = ! $kleinunternehmer && ! empty( $order->get_taxes() )`
	// — the sample order is assumed taxable so the tax columns are demoed.
	const showTax = ! isKleinunternehmer;

	const sampleSubtotal = 49;
	const sampleTax = showTax ? 4.9 : 0;
	const sampleTotal = sampleSubtotal + sampleTax;

	return (
		<ReactModal
			isOpen={ isOpen }
			onRequestClose={ onRequestClose }
			title={ __( 'Invoice Preview', 'storeengine' ) }
			subtitle={ __(
				'Sample layout using dummy data — mirrors the generated PDF.',
				'storeengine'
			) }
			suffix="invoice-preview"
			size="medium"
			overlayClose
			isEnabledResizer={false}
		>
			<div className="se-admin-tw p-6 bg-[#f1f1f1] overflow-x-auto">
				<div
					className="bg-white mx-auto text-[14px] text-black leading-normal"
					style={ {
						width: `${ paperWidth }px`,
					} }
				>
					{ /* .invoice-header */ }
					<div className="flex justify-between items-start w-full mb-[30px]">
						<div className="w-1/2 text-left">
							{ logoUrl && (
								<img
									src={ logoUrl }
									alt="Logo"
									className="h-[30px] w-auto object-contain bg-transparent"
								/>
							) }
						</div>
						<div className="w-1/2 text-right">
							<h3 className="text-2xl font-bold m-0">
								{ __( 'INVOICE', 'storeengine' ) }
							</h3>
							<table className="ml-auto text-sm leading-[1.5] mt-2">
								<tbody>
									<tr>
										<th className="font-normal pr-[10px] text-right">
											{ __(
												'Invoice Number:',
												'storeengine'
											) }
										</th>
										<td className="text-right">
											{ invoiceNumber }
										</td>
									</tr>
									<tr>
										<th className="font-normal pr-[10px] text-right">
											{ __(
												'Invoice Date:',
												'storeengine'
											) }
										</th>
										<td className="text-right">
											{ dateLabel }
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					{ /* .order-data-addresses */ }
					<div className="w-full text-left align-top">
						<h4 className="text-base font-bold m-0 mb-2">
							{ __( 'Invoice To:', 'storeengine' ) }
						</h4>
						<div className="grid grid-cols-3 gap-6 text-sm leading-[2]">
							<div>
								<p className="m-0">
									{ __( 'Jane Doe', 'storeengine' ) }
								</p>
								<p className="m-0">
									{ __(
										'456 Customer Ave, Customer City',
										'storeengine'
									) }
								</p>
								<p className="m-0">+1 555-0100</p>
								<p className="m-0">jane@example.com</p>
							</div>
							<div>
								<p className="m-0">
									{ __( 'Jane Doe', 'storeengine' ) }
								</p>
								<p className="m-0">
									{ __(
										'456 Customer Ave, Customer City',
										'storeengine'
									) }
								</p>
							</div>
							<div className="text-right">
								<h4 className="m-0 font-bold">
									{ invoice?.invoice_seller_legal_name ||
										__( 'Your Store', 'storeengine' ) }
								</h4>
								<p className="m-0">
									{ __(
										'123 Example Street, Sample City',
										'storeengine'
									) }
								</p>
								{ invoice?.invoice_tax_number && (
									<p className="m-0">
										{ __( 'Tax number:', 'storeengine' ) }{ ' ' }
										{ invoice.invoice_tax_number }
									</p>
								) }
								{ ! isKleinunternehmer &&
									invoice?.invoice_vat_id && (
										<p className="m-0">
											{ __( 'VAT ID:', 'storeengine' ) }{ ' ' }
											{ invoice.invoice_vat_id }
										</p>
									) }
								{ invoice?.invoice_seller_extra && (
									<p className="m-0 whitespace-pre-line">
										{ invoice.invoice_seller_extra }
									</p>
								) }
							</div>
						</div>
					</div>

					{ /* .products-table */ }
					<table className="w-full border-collapse text-sm mt-[30px]">
						<thead className="bg-[#323232] text-left">
							<tr>
								{ showProductImage && <th className="p-2"></th> }
								<th className="p-2 text-white font-normal text-center">
									{ __( 'Product', 'storeengine' ) }
								</th>
								<th className="p-2 text-white font-normal text-center">
									{ __( 'Price', 'storeengine' ) }
								</th>
								<th className="p-2 text-white font-normal text-center">
									{ __( 'Qty', 'storeengine' ) }
								</th>
								<th className="p-2 text-white font-normal text-center">
									{ __( 'Subtotal', 'storeengine' ) }
								</th>
								{ showTax && (
									<th className="p-2 text-white font-normal text-center">
										{ __( 'Tax', 'storeengine' ) }
									</th>
								) }
							</tr>
						</thead>
						<tbody>
							<tr>
								{ showProductImage && (
									<td className="p-2 border-0 border-b border-solid border-[#ddd] text-center">
										<span className="inline-block w-[50px] h-[50px] bg-[#f1f1f1] align-middle" />
									</td>
								) }
								<td className="p-2 border-0 border-b border-solid border-[#ddd] text-center">
									{ __( 'Sample Product', 'storeengine' ) }
								</td>
								<td className="p-2 border-0 border-b border-solid border-[#ddd] text-center">
									<Currency value={ sampleSubtotal } />
								</td>
								<td className="p-2 border-0 border-b border-solid border-[#ddd] text-center">
									1
								</td>
								<td className="p-2 border-0 border-b border-solid border-[#ddd] text-center">
									<Currency value={ sampleSubtotal } />
								</td>
								{ showTax && (
									<td className="p-2 border-0 border-b border-solid border-[#ddd] text-center">
										<Currency value={ sampleTax } />
									</td>
								) }
							</tr>
						</tbody>
					</table>

					{ /* .order-totals */ }
					<table className="ml-auto mt-2">
						<tbody>
							<tr>
								<td className="font-bold text-right pr-2">
									{ __( 'Subtotal', 'storeengine' ) }
								</td>
								<td className="text-right">
									<Currency value={ sampleSubtotal } />
								</td>
							</tr>
							{ showTax && (
								<tr>
									<td className="font-bold text-right pr-2">
										{ __( 'Tax', 'storeengine' ) }
									</td>
									<td className="text-right">
										<Currency value={ sampleTax } />
									</td>
								</tr>
							) }
							<tr>
								<td className="font-bold text-right pr-2">
									{ __( 'Total', 'storeengine' ) }
								</td>
								<td className="text-right">
									<Currency value={ sampleTotal } />
								</td>
							</tr>
						</tbody>
					</table>

					{ /* .tax-breakdown */ }
					{ showTax && (
						<table className="w-full border-collapse text-sm mt-4">
							<thead>
								<tr>
									<th className="text-left font-normal">
										{ __( 'VAT rate', 'storeengine' ) }
									</th>
									<th className="text-left font-normal">
										{ __( 'Net', 'storeengine' ) }
									</th>
									<th className="text-left font-normal">
										{ __( 'VAT amount', 'storeengine' ) }
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>
										{ __(
											'Standard rate (10%)',
											'storeengine'
										) }
									</td>
									<td>
										<Currency value={ sampleSubtotal } />
									</td>
									<td>
										<Currency value={ sampleTax } />
									</td>
								</tr>
							</tbody>
						</table>
					) }

					{ isKleinunternehmer && (
						<p className="mt-4">
							{ invoice?.invoice_kleinunternehmer_note ||
								__(
									'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.',
									'storeengine'
								) }
						</p>
					) }

					{ /* .order-info */ }
					<table className="text-sm leading-[1.5] mt-4">
						<tbody>
							<tr>
								<th className="text-left font-normal pr-[10px]">
									{ __( 'Order Number:', 'storeengine' ) }
								</th>
								<td>#1024</td>
							</tr>
							<tr>
								<th className="text-left font-normal pr-[10px]">
									{ __( 'Order Date:', 'storeengine' ) }
								</th>
								<td>{ dateLabel }</td>
							</tr>
							{ showDelivery && (
								<tr>
									<th className="text-left font-normal pr-[10px]">
										{ __(
											'Delivery / service date:',
											'storeengine'
										) }
									</th>
									<td>
										{ __(
											'Same as the invoice date.',
											'storeengine'
										) }
									</td>
								</tr>
							) }
						</tbody>
					</table>

					{ invoice?.invoice_default_note && (
						<div className="my-5">
							<h4 className="text-base font-bold m-0">
								{ __( 'Notes', 'storeengine' ) }
							</h4>
							<p className="text-sm m-0 whitespace-pre-line">
								{ invoice.invoice_default_note }
							</p>
						</div>
					) }

					{ invoice?.invoice_footer_text && (
						<div className="border-t-2 border-solid border-[#eee] pt-[10px] text-center mt-8">
							{ invoice.invoice_footer_text }
						</div>
					) }
				</div>
			</div>
		</ReactModal>
	);
};

export default InvoicePreviewModal;
