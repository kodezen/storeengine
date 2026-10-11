import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import ReactModal from '@Components/Modal/ReactModal';
import { Scope, Button } from '@Components/ui';
import { isSectionHidden, getProductFormField } from './productFormConfig';

const iconProps = {
	width: 20,
	height: 20,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	strokeWidth: 2,
	strokeLinecap: 'round',
	strokeLinejoin: 'round',
};

// Whether the product is shipped or delivered digitally — maps to the
// _storeengine_product_shipping_type meta. Variable vs. simple is decided
// later in the editor (by adding attributes/variants), so it's not asked here.
const SHIPPING_TYPES = [
	{
		value: 'physical',
		label: __( 'Physical product', 'storeengine' ),
		desc: __( 'Shipped to the customer.', 'storeengine' ),
		icon: (
			<svg { ...iconProps } aria-hidden="true">
				<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
				<polyline points="3.27 6.96 12 12.01 20.73 6.96" />
				<line x1="12" y1="22.08" x2="12" y2="12" />
			</svg>
		),
	},
	{
		value: 'digital',
		label: __( 'Digital product', 'storeengine' ),
		desc: __( 'Downloaded or accessed online.', 'storeengine' ),
		icon: (
			<svg { ...iconProps } aria-hidden="true">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="7 10 12 15 17 10" />
				<line x1="12" y1="15" x2="12" y2="3" />
			</svg>
		),
	},
];

/**
 * Onboarding step shown when a brand-new product is created: capture the title,
 * shipping type, and whether it's a bundle, then hand them back via onContinue
 * so the parent can persist a draft and the modal closes.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen
 * @param {boolean}  props.isSaving             Draft is being created — keep modal open + spinner.
 * @param {string}   props.defaultShippingType  Pre-selected box ('physical' | 'digital').
 * @param {Function} props.onClose              Dismiss without seeding.
 * @param {Function} props.onContinue           Called with ( { title, shippingType, bundleEnabled } ).
 */
const NewProductModal = ( {
	isOpen,
	isSaving,
	defaultShippingType = 'physical',
	onClose,
	onContinue,
} ) => {
	const [ title, setTitle ] = useState( '' );
	// Settings → Product form: when the Shipping section is hidden the type isn't
	// asked at all; the configured default (if any) is used instead.
	const typeHidden = isSectionHidden( 'shipping' );
	const configuredType = getProductFormField( 'shipping_type' )?.default;
	const [ shippingType, setShippingType ] = useState(
		'digital' === ( configuredType || defaultShippingType )
			? 'digital'
			: 'physical'
	);
	const [ bundleEnabled, setBundleEnabled ] = useState( false );

	const canContinue = '' !== title.trim();

	const handleContinue = () => {
		if ( ! canContinue || isSaving ) {
			return;
		}
		onContinue( { title: title.trim(), shippingType, bundleEnabled } );
	};

	const toggleBundle = () => setBundleEnabled( ( v ) => ! v );

	return (
		<ReactModal
			isOpen={ isOpen }
			onRequestClose={ onClose }
			title={ __( 'Create product', 'storeengine' ) }
			isEnabledResizer={ false }
			size="small"
			suffix="new-product"
		>
			{ /* react-modal portals outside the .se-admin-tw Tailwind scope, so
			     wrap the content to re-enable the utility classes. */ }
			<Scope>
				<div className="flex flex-col gap-6">
					<div>
						<label
							className="block text-sm font-semibold text-se-title mb-2"
							htmlFor="se-new-product-title"
						>
							{ __( 'Product title', 'storeengine' ) }
						</label>
						<input
							id="se-new-product-title"
							type="text"
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
							value={ title }
							onChange={ ( e ) => setTitle( e.target.value ) }
							onKeyDown={ ( e ) => {
								if ( 'Enter' === e.key ) {
									e.preventDefault();
									handleContinue();
								}
							} }
							placeholder={ __(
								'e.g. Classic Cotton T-shirt',
								'storeengine'
							) }
							className="w-full px-3 py-2.5 border border-solid border-se-border rounded-lg text-sm text-se-input bg-white transition-shadow focus:outline-none focus:border-se-primary focus:ring-2 focus:ring-se-primary"
						/>
					</div>

					{ ! typeHidden && (
					<div>
						<span className="block text-sm font-semibold text-se-title mb-2">
							{ __( 'Product type', 'storeengine' ) }
						</span>
						<div className="grid grid-cols-2 gap-3">
							{ SHIPPING_TYPES.map( ( t ) => {
								const selected = shippingType === t.value;
								return (
									<button
										type="button"
										key={ t.value }
										onClick={ () =>
											setShippingType( t.value )
										}
										aria-pressed={ selected }
										className={ `relative text-left p-4 rounded-xl border border-solid bg-white cursor-pointer transition-colors hover:border-se-primary ${
											selected
												? 'border-se-primary bg-se-primary-light'
												: 'border-se-border'
										}` }
									>
										<span
											className={ `inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2.5 transition-colors ${
												selected
													? 'bg-se-primary-light text-se-primary'
													: 'bg-se-bg text-se-subtitle'
											}` }
										>
											{ t.icon }
										</span>
										<span className="block text-sm font-semibold text-se-title">
											{ t.label }
										</span>
										<span className="block text-xs text-se-subtitle mt-0.5 leading-snug">
											{ t.desc }
										</span>
										{ selected && (
											<span
												className="absolute top-2.5 right-2.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-se-primary text-white"
												aria-hidden="true"
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="3"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<polyline points="20 6 9 17 4 12" />
												</svg>
											</span>
										) }
									</button>
								);
							} ) }
						</div>
					</div>
					) }

					{ /* Bundle toggle — switch on the left, then the label. */ }
					<button
						type="button"
						role="switch"
						aria-checked={ bundleEnabled }
						onClick={ toggleBundle }
						className={ `flex items-center gap-3 px-4 py-3 rounded-xl border border-solid bg-white cursor-pointer text-left transition-colors hover:border-se-primary ${
							bundleEnabled
								? 'border-se-primary bg-se-primary-light'
								: 'border-se-border'
						}` }
					>
						<span
							className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full"
							style={ {
								backgroundColor: bundleEnabled
									? 'var(--storeengine-primary-color)'
									: '#cbd5e1',
								transition: 'background-color 0.15s ease',
							} }
						>
							<span
								className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
								style={ {
									transform: bundleEnabled
										? 'translateX(18px)'
										: 'translateX(2px)',
									transition: 'transform 0.15s ease',
								} }
							/>
						</span>
						<span>
							<span className="block text-sm font-semibold text-se-title">
								{ __( 'Bundle', 'storeengine' ) }
							</span>
							<span className="block text-xs text-se-subtitle leading-snug">
								{ __(
									'Sell several products together as one bundle.',
									'storeengine'
								) }
							</span>
						</span>
					</button>

					<div className="flex justify-end pt-1">
						<Button
							type="button"
							preset="primary"
							disabled={ ! canContinue || isSaving }
							isLoading={ isSaving }
							onClick={ handleContinue }
						>
							{ __( 'Continue', 'storeengine' ) }
						</Button>
					</div>
				</div>
			</Scope>
		</ReactModal>
	);
};

NewProductModal.propTypes = {
	isOpen: PropTypes.bool,
	isSaving: PropTypes.bool,
	defaultShippingType: PropTypes.string,
	onClose: PropTypes.func,
	onContinue: PropTypes.func,
};

export default NewProductModal;
