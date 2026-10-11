import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import { Scope, Heading, Button } from '@Components/ui';
import Number from '@Components/Formik/Number';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { Select } from '@Components/ui/Select';
import { Field, useFormikContext } from 'formik';
import ReactModal from '@Components/Modal/ReactModal';
import { SortableConfigOptions } from './SortableConfigOption';

import './styles.scss';

const layoutOptions = [
	{
		label: __('None', 'storeengine'),
		value: 'none',
	},
	{
		label: __('Left Sidebar', 'storeengine'),
		value: 'left',
	},
	{
		label: __('Right Sidebar', 'storeengine'),
		value: 'right',
	},
];

const productArchiveOrder = [
	{
		label: __('Default Sorting', 'storeengine'),
		value: '',
	},
	{
		label: __('Sort By Menu Order', 'storeengine'),
		value: 'menu_order',
	},
	{
		label: __('Sort By Product Name', 'storeengine'),
		value: 'title',
	},
	{
		label: __('Sort By Publish Date', 'storeengine'),
		value: 'date',
	},
	{
		label: __('Sort By Modified Date', 'storeengine'),
		value: 'modified',
	},
	{
		label: __('Sort By ID', 'storeengine'),
		value: 'ID',
	},
];

const multiPriceDisplaySettings = [
	{
		label: __('Dropdown', 'storeengine'),
		value: 'dropdown',
	},
	{
		label: __('Price Range', 'storeengine'),
		value: 'price-range',
	},
];

const singlePriceDisplaySettings = [
	{
		label: __('Radio Buttons', 'storeengine'),
		value: 'radio',
	},
	{
		label: __('Dropdown', 'storeengine'),
		value: 'dropdown',
	},
];

const galleryLayoutSettings = [
	{
		label: __('Carousel + thumbnails', 'storeengine'),
		value: 'carousel',
	},
	{
		label: __('Stacked (vertical scroll)', 'storeengine'),
		value: 'stacked',
	},
	{
		label: __('Grid (2 columns)', 'storeengine'),
		value: 'grid',
	},
];

const quickViewPositionOptions = [
	{ label: __('Center modal', 'storeengine'), value: 'center' },
	{ label: __('Left sidebar', 'storeengine'), value: 'left' },
	{ label: __('Right sidebar', 'storeengine'), value: 'right' },
];

const quickViewAnimationOptions = [
	{ label: __('Fade', 'storeengine'), value: 'fade' },
	{ label: __('Zoom', 'storeengine'), value: 'zoom' },
	{ label: __('Slide', 'storeengine'), value: 'slide' },
	{ label: __('None', 'storeengine'), value: 'none' },
];

const defaultShippingTypeOptions = [
	{
		label: __('Physical product', 'storeengine'),
		value: 'physical',
	},
	{
		label: __('Digital product', 'storeengine'),
		value: 'digital',
	},
];

const reviewPermissionOptions = [
	{
		label: __('Buyers after completed order', 'storeengine'),
		value: 'completed_order',
	},
	{
		label: __('Anyone who purchased', 'storeengine'),
		value: 'purchased',
	},
	{
		label: __('Everyone (no purchase needed)', 'storeengine'),
		value: 'everyone',
	},
];

const reviewApprovalOptions = [
	{
		label: __('Auto approve', 'storeengine'),
		value: 'auto',
	},
	{
		label: __('Hold for approval (pending)', 'storeengine'),
		value: 'pending',
	},
];

const faqModeOptions = [
	{
		label: __('Global (FAQ groups + category/brand targeting)', 'storeengine'),
		value: 'global',
	},
	{
		label: __('Product only (add FAQs per product)', 'storeengine'),
		value: 'product_only',
	},
];

const Products = () => {
	const { values, setFieldValue, initialValues } = useFormikContext();

	// Changing FAQ options requires a page reload: the admin menu (FAQs submenu)
	// is rendered server-side, and the product editor reads these flags from the
	// page-load window global — neither updates live after an AJAX save.
	const faqSettingsChanged =
		( values?.enable_faqs ?? true ) !== ( initialValues?.enable_faqs ?? true ) ||
		( values?.faq_mode ?? 'global' ) !== ( initialValues?.faq_mode ?? 'global' );

	// The settings option may not yet contain `default_product_shipping_type`
	// for older installs, so Formik state lands at undefined / ''. Coerce to
	// the schema default ('digital') once on mount so:
	//   1. the react-select dropdown can render the selected option (find()
	//      needs an exact match â empty string matches nothing), and
	//   2. submit always sends a non-empty value to the server.
	useEffect(() => {
		const v = values?.default_product_shipping_type;
		if (v !== 'digital' && v !== 'physical') {
			setFieldValue('default_product_shipping_type', 'digital', false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [values?.default_product_shipping_type]);

	const [modalIsOpen, setIsOpen] = useState(false);
	const [productFilterWidgets, setProductFilterWidgets] = useState([
		{
			label: __('Search', 'storeengine'),
			slug: 'search',
			status: values?.product_archive_filters?.search?.status ?? true,
			order: values?.product_archive_filters?.search?.order ?? 0,
		},
		{
			label: __('Category', 'storeengine'),
			slug: 'category',
			status: values?.product_archive_filters?.category?.status ?? true,
			order: values?.product_archive_filters?.category?.order ?? 0,
		},
		{
			label: __('Tags', 'storeengine'),
			slug: 'tags',
			status: values?.product_archive_filters?.tags?.status ?? true,
			order: values?.product_archive_filters?.tags?.order ?? 0,
		},
	]);

	function closeModal() {
		setIsOpen(false);
	}

	return (
		<Scope>
			<div className="storeengine-content-section storeengine-content-section--products storeengine-pb-0">
				<Heading>
					{__('Products', 'storeengine')}
				</Heading>

				<div className="storeengine-flex gap-4 storeengine-mb-6">
					<div className="storeengine-title-subtitle">
						<h3 className="storeengine-title">
							{__('Default product type', 'storeengine')}
						</h3>
						<p className="storeengine-sub-title">
							{__(
								'Applied when creating a new product. Digital products skip the inventory section; physical products show it by default.',
								'storeengine'
							)}
						</p>
					</div>
					<Select
						name="default_product_shipping_type"
						className="storeengine-select storeengine-select--default-product-type"
						classNamePrefix="storeengine-react-select"
						options={defaultShippingTypeOptions}
						// Use `||` (not `??`) so empty string / 0 fall back too â
						// the saved option key can legitimately be empty on
						// pre-fix installs that hit the form once.
						value={
							defaultShippingTypeOptions.find(
								(item) =>
									item.value ===
									(values?.default_product_shipping_type || 'digital')
							) || defaultShippingTypeOptions[1]
						}
						onChange={(opt) =>
							setFieldValue(
								'default_product_shipping_type',
								opt?.value || 'digital'
							)
						}
					/>
				</div>

				<Checkbox
					title={__('Enable Direct Checkout', 'storeengine')}
					name="enable_direct_checkout"
					subtitle={__(
						'Adds a Buy Now button alongside Add to Cart. When the Instant Checkout addon is active, Buy Now opens the Quick Checkout modal instead of redirecting to the checkout page.',
						'storeengine'
					)}
				/>
				<Checkbox
					title={__('Hide quantity selector', 'storeengine')}
					name="hide_quantity_selector"
					subtitle={__(
						'Forces quantity to 1. Ideal for digital products that are bought one at a time.',
						'storeengine'
					)}
				/>
				<Checkbox
					title={__('Hide Add to Cart (Buy Now only)', 'storeengine')}
					name="hide_add_to_cart"
					subtitle={__(
						'Hides the Add to Cart button and shows only the Buy Now button for instant checkout.',
						'storeengine'
					)}
				/>
				<Checkbox
					title={ __( 'Sticky Add to Cart', 'storeengine' ) }
					name="sticky_add_to_cart"
					subtitle={ __(
						'Shows a fixed bottom bar on single product pages with the thumbnail, name, live price and an Add to Cart button, once the main button scrolls out of view. Applies on all screen sizes.',
						'storeengine'
					) }
				/>
				<Checkbox
					title={ __( 'Recently viewed products', 'storeengine' ) }
					name="enable_recently_viewed"
					subtitle={ __(
						'Shows a "Recently viewed" row on single product pages, built from the shopper’s own browsing (stored in their browser).',
						'storeengine'
					) }
				/>
				<Checkbox
					title={ __( 'Size guide', 'storeengine' ) }
					name="enable_size_guide"
					subtitle={ __(
						'Shows a "Size guide" link on product pages and in Quick View. Build measurement tables under Products → Size Charts and assign each one to categories, brands or specific products — a product shows the most specific match, and no link at all when nothing matches.',
						'storeengine'
					) }
				/>
				<Checkbox
					title={ __( 'Product compare', 'storeengine' ) }
					name="enable_product_compare"
					subtitle={ __(
						'Adds a "Compare" toggle over the product image on shop cards, plus one on product pages and in Quick View. Picks collect in a docked tray, and the side-by-side table opens in a modal — no page to set up. Use [storeengine_compare_count] for a badge, or [storeengine_compare] to embed the table in a page.',
						'storeengine'
					) }
				/>
				<Checkbox
					title={ __( 'Wishlist', 'storeengine' ) }
					name="enable_wishlist"
					subtitle={ __(
						'Adds a wishlist (heart) button on shop cards, product pages and Quick View. Saved to the account for logged-in shoppers, and to the browser for guests. Use the [storeengine_wishlist] shortcode for the wishlist page.',
						'storeengine'
					) }
				/>
				<Checkbox
					title={ __( 'Shop cards: image carousel', 'storeengine' ) }
					name="product_archive_card_carousel"
					subtitle={ __(
						'Let shoppers browse a product gallery images on the shop card (arrows, dots and swipe).',
						'storeengine'
					) }
				/>
				<Checkbox
					title={ __( 'Shop cards: variant swatches', 'storeengine' ) }
					name="product_archive_card_swatches"
					subtitle={ __(
						'Show color/image swatches on shop cards; picking one swaps the card image.',
						'storeengine'
					) }
				/>
				<Checkbox
					title={ __( 'Shop cards: Quick View', 'storeengine' ) }
					name="product_archive_quick_view"
					subtitle={ __(
						'Adds a Quick View button that opens a mini product page (gallery, price, variants, add to cart) in a modal.',
						'storeengine'
					) }
				/>
				{ ( values?.product_archive_quick_view ?? false ) && (
					<>
						<div className="storeengine-flex mb-6">
							<div className="storeengine-title-subtitle">
								<h3 className="storeengine-title">
									{ __( 'Quick View position', 'storeengine' ) }
								</h3>
								<p className="storeengine-sub-title">
									{ __(
										'Where the Quick View opens: a centered modal, or a panel docked to the left/right edge.',
										'storeengine'
									) }
								</p>
							</div>
							<Select
								name="quick_view_position"
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								options={ quickViewPositionOptions }
								value={
									quickViewPositionOptions.find(
										( item ) =>
											item.value ===
											values?.quick_view_position
									) || quickViewPositionOptions[ 0 ]
								}
								onChange={ ( option ) => {
									setFieldValue(
										'quick_view_position',
										option.value
									);
								} }
							/>
						</div>
						<div className="storeengine-flex mb-6">
							<div className="storeengine-title-subtitle">
								<h3 className="storeengine-title">
									{ __( 'Quick View animation', 'storeengine' ) }
								</h3>
								<p className="storeengine-sub-title">
									{ __(
										'How the Quick View animates in when opened.',
										'storeengine'
									) }
								</p>
							</div>
							<Select
								name="quick_view_animation"
								className="storeengine-select"
								classNamePrefix="storeengine-react-select"
								options={ quickViewAnimationOptions }
								value={
									quickViewAnimationOptions.find(
										( item ) =>
											item.value ===
											values?.quick_view_animation
									) || quickViewAnimationOptions[ 0 ]
								}
								onChange={ ( option ) => {
									setFieldValue(
										'quick_view_animation',
										option.value
									);
								} }
							/>
						</div>
					</>
				) }
				<Checkbox
					title={__('Enable reviews', 'storeengine')}
					name="enable_product_reviews"
					suffix="all-checkbox"
				/>
				{ ( values?.enable_product_reviews ?? false ) && (
					<>
						<div className="storeengine-flex storeengine-mb-6">
							<div className="storeengine-title-subtitle">
								<h3 className="storeengine-title">
									{__('Who can review', 'storeengine')}
								</h3>
								<p className="storeengine-sub-title">
									{__(
										'Choose who may leave a product review.',
										'storeengine'
									)}
								</p>
							</div>
							<Select
								name="review_permission"
								className="storeengine-select storeengine-select--default-product-type"
								classNamePrefix="storeengine-react-select"
								options={reviewPermissionOptions}
								value={
									reviewPermissionOptions.find(
										(item) =>
											item.value ===
											(values?.review_permission ||
												'completed_order')
									) || reviewPermissionOptions[0]
								}
								onChange={(opt) =>
									setFieldValue(
										'review_permission',
										opt?.value || 'completed_order'
									)
								}
							/>
						</div>
						<Number
							title={__('Max media per review', 'storeengine')}
							name="review_media_max"
							subtitle={__(
								'Maximum photos/videos a reviewer can attach (0 = unlimited).',
								'storeengine'
							)}
							min={0}
							suffix="align-row"
						/>
						<div className="storeengine-flex storeengine-mb-6">
							<div className="storeengine-title-subtitle">
								<h3 className="storeengine-title">
									{__('Review approval', 'storeengine')}
								</h3>
								<p className="storeengine-sub-title">
									{__(
										'Auto-approve new reviews, or hold them for manual approval under Products → Reviews.',
										'storeengine'
									)}
								</p>
							</div>
							<Select
								name="review_approval"
								className="storeengine-select storeengine-select--default-product-type"
								classNamePrefix="storeengine-react-select"
								options={reviewApprovalOptions}
								value={
									reviewApprovalOptions.find(
										(item) =>
											item.value ===
											(values?.review_approval || 'auto')
									) || reviewApprovalOptions[0]
								}
								onChange={(opt) =>
									setFieldValue(
										'review_approval',
										opt?.value || 'auto'
									)
								}
							/>
						</div>
					</>
				) }
				<Checkbox
					title={__('Enable Comments', 'storeengine')}
					name="enable_product_comments"
					suffix="all-checkbox"
				/>
				<Checkbox
					title={__('Enable FAQs', 'storeengine')}
					name="enable_faqs"
					suffix="all-checkbox"
				/>
				{ ( values?.enable_faqs ?? true ) && (
					<div className="storeengine-flex storeengine-mb-6">
						<div className="storeengine-title-subtitle">
							<h3 className="storeengine-title">
								{__('FAQ management', 'storeengine')}
							</h3>
							<p className="storeengine-sub-title">
								{__(
									'“Global” unlocks the FAQ Groups library with category, brand and product targeting. “Product only” hides the library and lets you add FAQs directly on each product.',
									'storeengine'
								)}
							</p>
						</div>
						<Select
							name="faq_mode"
							className="storeengine-select storeengine-select--default-product-type"
							classNamePrefix="storeengine-react-select"
							options={faqModeOptions}
							value={
								faqModeOptions.find(
									(item) =>
										item.value ===
										(values?.faq_mode || 'global')
								) || faqModeOptions[0]
							}
							onChange={(opt) =>
								setFieldValue(
									'faq_mode',
									opt?.value || 'global'
								)
							}
						/>
					</div>
				) }
				{ faqSettingsChanged && (
					<div className="storeengine-faq-reload-notice">
						<span
							className="storeengine-icon storeengine-icon--info"
							aria-hidden={true}
						/>
						<span>
							{__(
								'Reload the page after saving to apply the FAQ settings — the admin menu and product editor update on reload.',
								'storeengine'
							)}
						</span>
					</div>
				) }
				{ /*<Checkbox
				title={ __( 'Enable related products', 'storeengine' ) }
				name="enable_related_products"
				suffix="all-checkbox"
			/>*/ }
			</div>

			{ /* ââ SKU & Barcode auto-generation âââââââââââââââââââââââ */}
			<div className="storeengine-content-section storeengine-content-section--products storeengine-pb-0">
				<Heading>
					{__('SKU & Barcode', 'storeengine')}
				</Heading>

				<Checkbox
					title={__('Auto-generate SKU', 'storeengine')}
					name="auto_generate_sku"
					subtitle={__(
						'When a product is saved without a SKU, generate one from the pattern below.',
						'storeengine'
					)}
				/>

				{values?.auto_generate_sku && (
					<>
						<div className="storeengine-d-flex storeengine-mb-6">
							<p className="storeengine-title-subtitle">
								<span className="storeengine-title">
									{__('SKU pattern', 'storeengine')}
								</span>
								<span className="storeengine-sub-title">
									{__(
										'Tokens: {category}, {name}, {number}, {year}. Example: {category}-{number} â APPAREL-0001',
										'storeengine'
									)}
								</span>
							</p>
							<Field
								name="sku_pattern"
								type="text"
								className="storeengine-input"
								placeholder="{category}-{number}"
							/>
						</div>
						<Number
							name="sku_number_padding"
							title={__('Number padding (digits)', 'storeengine')}
							min={1}
							suffix="sku-padding"
						/>
					</>
				)}

				<Checkbox
					title={__('Auto-generate barcode', 'storeengine')}
					name="auto_generate_barcode"
					subtitle={__(
						'When a product is saved without a barcode, assign an internal EAN-13 barcode.',
						'storeengine'
					)}
				/>

				{values?.auto_generate_barcode && (
					<div className="storeengine-d-flex storeengine-mb-6">
						<p className="storeengine-title-subtitle">
							<span className="storeengine-title">
								{__('Barcode in-store prefix', 'storeengine')}
							</span>
							<span className="storeengine-sub-title">
								{__(
									'Digits only — EAN-13 barcodes cannot contain letters. Use 20-29 for in-store / private barcodes; letters are ignored.',
									'storeengine'
								)}
							</span>
						</p>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							maxLength={6}
							className="storeengine-input"
							placeholder="20"
							value={values?.barcode_ean_prefix ?? ''}
							onChange={(e) =>
								setFieldValue(
									"barcode_ean_prefix",
									e.target.value.replace(/[^0-9]/g, '')
								)
							}
						/>
					</div>
				)}
			</div>

			<div className="storeengine-content-section storeengine-content-section--products storeengine-pb-0">
				<Heading>
					{__('Product Archive', 'storeengine')}
				</Heading>

				<Number
					name="product_archive_products_per_page"
					title={__('Product Archive Per Page', 'storeengine')}
					min={1}
					suffix="archive-per-page"
				/>
				<div className="storeengine-flex storeengine-mb-6">
					<div className="storeengine-title-subtitle">
						<h3 className="storeengine-title">
							{__('Multi Price Display Settings', 'storeengine')}
						</h3>
					</div>
					<Select
						name="product_archive_multi_price_display"
						className="storeengine-select storeengine-select--multi-price-display"
						classNamePrefix="storeengine-react-select"
						options={multiPriceDisplaySettings}
						value={multiPriceDisplaySettings.find(
							(item) =>
								item.value ===
								values?.product_archive_multi_price_display
						)}
						onChange={(option) => {
							setFieldValue(
								'product_archive_multi_price_display',
								option.value
							);
						}}
					/>
				</div>

				<div className="storeengine-flex">
					<div className="storeengine-title-subtitle">
						<h3 className="storeengine-title">
							{__(
								'Single Product Price Display',
								'storeengine'
							)}
						</h3>
						<p className="storeengine-sub-title">
							{__(
								'How multiple prices are shown on the single product page.',
								'storeengine'
							)}
						</p>
					</div>
					<Select
						name="product_single_price_display"
						className="storeengine-select storeengine-select--single-price-display"
						classNamePrefix="storeengine-react-select"
						options={singlePriceDisplaySettings}
						value={
							singlePriceDisplaySettings.find(
								(item) =>
									item.value ===
									values?.product_single_price_display
							) || singlePriceDisplaySettings[0]
						}
						onChange={(option) => {
							setFieldValue(
								'product_single_price_display',
								option.value
							);
						}}
					/>
				</div>

				<StoreEngineSeparator isBottom={true} />

				<div className="storeengine-flex">
					<div className="storeengine-title-subtitle">
						<h3 className="storeengine-title">
							{__('Product Gallery Layout', 'storeengine')}
						</h3>
						<p className="storeengine-sub-title">
							{__(
								'How product images and videos are shown on the single product page.',
								'storeengine'
							)}
						</p>
					</div>
					<Select
						name="single_product_gallery_layout"
						className="storeengine-select storeengine-select--gallery-layout"
						classNamePrefix="storeengine-react-select"
						options={galleryLayoutSettings}
						value={
							galleryLayoutSettings.find(
								(item) =>
									item.value ===
									values?.single_product_gallery_layout
							) || galleryLayoutSettings[0]
						}
						onChange={(option) => {
							setFieldValue(
								'single_product_gallery_layout',
								option.value
							);
						}}
					/>
				</div>

				<StoreEngineSeparator isBottom={true} />

				<div className="storeengine-d-flex storeengine-mb-6">
					<p className="storeengine-title-subtitle">
						<span className="storeengine-title">
							{__(
								'Product Archive Per Row (Desktop)',
								'storeengine'
							)}
						</span>
						<span className="storeengine-sub-title">
							{__(
								'Set the number of products to show on the desktop view.',
								'storeengine'
							)}
						</span>
					</p>
					<Field
						name="product_archive_products_per_row.desktop"
						type="number"
						min={1}
						className="storeengine-input"
					/>
				</div>

				<div className="storeengine-d-flex storeengine-mb-6">
					<p className="storeengine-title-subtitle">
						<span className="storeengine-title">
							{__(
								'Product Archive Per Row (Tablet)',
								'storeengine'
							)}
						</span>
						<span className="storeengine-sub-title">
							{__(
								'Set the number of products to show on the mobile view.',
								'storeengine'
							)}
						</span>
					</p>
					<Field
						name="product_archive_products_per_row.tablet"
						type="number"
						min={1}
						className="storeengine-input"
					/>
				</div>

				<div className="storeengine-d-flex storeengine-mb-6">
					<p className="storeengine-title-subtitle">
						<span className="storeengine-title">
							{__(
								'Product Archive Per Row (Mobile)',
								'storeengine'
							)}
						</span>
						<span className="storeengine-sub-title">
							{__(
								'Set the number of products to show on the mobile view.',
								'storeengine'
							)}
						</span>
					</p>
					<Field
						name="product_archive_products_per_row.mobile"
						type="number"
						min={1}
						className="storeengine-input"
					/>
				</div>

				<StoreEngineSeparator isBottom={true} />

				<div className="storeengine-flex storeengine-settings-config-filters storeengine-mb-6">
					<p className="storeengine-title-subtitle">
						<span className="storeengine-title">
							{__('Product archive filters', 'storeengine')}
						</span>
						<span className="storeengine-sub-title">
							{__(
								'Choose preferred filter options to display on the product archive page.',
								'storeengine'
							)}
						</span>
					</p>

					<Button
						onClick={() => setIsOpen(true)}
						preset="ghost"
						size="md"
						icon="storeengine-icon--build"
					>
						{__('Config Filters', 'storeengine')}
					</Button>
				</div>

				<ReactModal
					isOpen={modalIsOpen}
					onRequestClose={closeModal}
					title={__('Config filter', 'storeengine')}
					size="small"
					suffix="settings-sort"
				>
					<SortableConfigOptions
						name="product_archive_filters"
						value={productFilterWidgets}
						setProductFilterWidgets={setProductFilterWidgets}
					/>
				</ReactModal>

				<div className="storeengine-d-flex storeengine-mb-6">
					<h3 className="storeengine-title">
						{__('Product Archive Sidebar Widgets', 'storeengine')}
					</h3>
					<div className="storeengine-flex storeengine-flex-gap-12">
						{layoutOptions.map((item, index) => (
							<label
								className="storeengine-radio-option"
								key={index}
								htmlFor={`product_archive_sidebar_position-${index}`}
							>
								<Field
									id={`product_archive_sidebar_position-${index}`}
									name="product_archive_sidebar_position"
									type="radio"
									value={item.value}
									className="storeengine-radio"
								/>
								<span>{item.label}</span>
							</label>
						))}
					</div>
				</div>

				<div className="storeengine-flex storeengine-mb-6">
					<div className="storeengine-title-subtitle">
						<h3 className="storeengine-title">
							{__('Product Archive Order', 'storeengine')}
						</h3>
						<span className="storeengine-sub-title">
							{__(
								'Select product Archive default order',
								'storeengine'
							)}
						</span>
					</div>
					<Select
						name="product_archive_products_order"
						className="storeengine-select storeengine-select--archive-order"
						classNamePrefix="storeengine-react-select"
						options={productArchiveOrder}
						value={productArchiveOrder.find(
							(item) =>
								item.value ===
								values?.product_archive_products_order
						)}
						onChange={(option) => {
							setFieldValue(
								'product_archive_products_order',
								option.value
							);
						}}
						menuPlacement='top'
					/>
				</div>
			</div>
		</Scope>
	);
};

export default Products;
