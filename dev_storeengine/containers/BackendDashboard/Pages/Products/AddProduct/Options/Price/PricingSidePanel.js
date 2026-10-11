import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import classNames from 'classnames';
import Modal from '@Components/Modal';
import OptionMenu from '@Components/OptionMenu';
import Currency from '@Components/Currency';
import Preloader from '@Components/Loader/Preloader';
import { Scope, Button } from '@Components/ui';
import EditPrice from './EditPrice';
import usePricingView from './usePricingView';
import ViewModeIcon from '../Variants/ViewModeIcon';

const typeLabel = ( type ) =>
	( {
		onetime: __( 'One time', 'storeengine' ),
		subscription: __( 'Subscription', 'storeengine' ),
		'installment-plan': __( 'Installment', 'storeengine' ),
	} )[ type ] ||
	( type ? type.replace( /-/g, ' ' ) : __( 'Price', 'storeengine' ) );

/**
 * Inline | Side panel switch for the Pricing heading (multi-price only).
 */
export const PricingViewToggle = () => {
	const { mode, setMode } = usePricingView();

	return (
		<div
			className="storeengine-variants__view-toggle"
			role="group"
			aria-label={ __( 'Pricing view', 'storeengine' ) }
		>
			{ [
				[ 'inline', __( 'Inline', 'storeengine' ) ],
				[ 'panel', __( 'Side panel', 'storeengine' ) ],
			].map( ( [ value, label ] ) => (
				<button
					key={ value }
					type="button"
					aria-pressed={ value === mode }
					className={ classNames( 'storeengine-variants__view-btn', {
						'is-active': value === mode,
					} ) }
					onClick={ () => setMode( value ) }
				>
					<ViewModeIcon mode={ value } />
					{ label }
				</button>
			) ) }
		</div>
	);
};

/**
 * Side panel view of a multi-price product: compact rows, and a two-pane
 * drawer (price list | the existing EditPrice form) to edit or add prices.
 *
 * @param {Object}   props
 * @param {number}   props.ID                     Product id.
 * @param {Function} props.handleDelete           Deletes a price.
 * @param {Function} props.handleVisibilityToggle Hides / shows a price.
 */
const PricingSidePanel = ( { ID, handleDelete, handleVisibilityToggle } ) => {
	const { values } = useFormikContext();
	const prices = values?.prices ?? [];
	// Drawer target: a price id, 'new' for the add form, or null (closed).
	const [ openId, setOpenId ] = useState( null );
	const [ formLoading, setFormLoading ] = useState( false );

	const current =
		'new' === openId
			? {}
			: prices.find( ( p ) => String( p?.id ) === String( openId ) );
	const isOpen = null !== openId && !! current;

	// EditPrice calls setEditingPrice(false) after a save and (null) on Cancel.
	// A save keeps the drawer open (a new price becomes the selected one);
	// Cancel closes it.
	const handleFormDone = ( next ) => {
		if ( false === next ) {
			if ( 'new' === openId ) {
				const last = ( values?.prices ?? [] ).slice( -1 )[ 0 ];
				setOpenId( last?.id ?? null );
			}
			return;
		}
		if ( null === next ) {
			setOpenId( null );
		}
	};

	return (
		<>
			<div className="storeengine-variants__summary-list">
				{ prices.map( ( price ) => (
					<div
						key={ price.id }
						className={ classNames( 'storeengine-variants__summary', {
							'is-price-hidden': price?.settings?.is_hidden,
						} ) }
					>
						<div className="storeengine-variants__summary-main">
							<span className="storeengine-variants__summary-name">
								{ price?.price_name }
								{ price?.settings?.is_hidden && (
									<span className="storeengine-variants__badge">
										{ __( 'Hidden', 'storeengine' ) }
									</span>
								) }
							</span>
							<span className="storeengine-variants__summary-meta">
								<span className="storeengine-variants__fact">
									<Currency value={ price?.price } />
								</span>
								<span className="storeengine-variants__fact">
									{ typeLabel( price?.price_type ) }
								</span>
								{ parseFloat( price?.compare_price ) > 0 && (
									<span className="storeengine-variants__fact">
										<span className="storeengine-variants__fact-label">
											{ __( 'Compare-at', 'storeengine' ) }
										</span>
										<Currency value={ price.compare_price } />
									</span>
								) }
							</span>
						</div>
						<Button
							type="button"
							preset="outline"
							size="xs"
							className="ml-auto"
							onClick={ () => setOpenId( price.id ) }
						>
							{ __( 'Edit', 'storeengine' ) }
						</Button>
						<OptionMenu
							suffix="product-price-menu"
							options={ [
								{
									type: 'button',
									label: price?.settings?.is_hidden
										? __( 'Show', 'storeengine' )
										: __( 'Hide', 'storeengine' ),
									onClick: () => handleVisibilityToggle( price ),
								},
								{
									type: 'button',
									label: __( 'Delete', 'storeengine' ),
									suffix: 'trash',
									onClick: () => handleDelete( price ),
								},
							] }
						/>
					</div>
				) ) }
			</div>

			<div className="storeengine-product-editor-pricing__add-btn">
				<Button
					icon="storeengine-icon--add"
					type="button"
					preset="outline"
					onClick={ () => setOpenId( 'new' ) }
				>
					{ __( 'Add Price', 'storeengine' ) }
				</Button>
			</div>

			{ isOpen &&
				createPortal(
					<Scope>
						<Modal
							open={ isOpen }
							placement="right"
							trapFocus
							size="lg"
							className="storeengine-variants-drawer"
							title={ __( 'Edit prices', 'storeengine' ) }
							onClose={ () => setOpenId( null ) }
							bodyClassName="storeengine-variants__panel-body"
							closeAriaLabel={ __( 'Close', 'storeengine' ) }
						>
							<div className="storeengine-variants__drawer">
								<aside className="storeengine-variants__drawer-list">
									<div className="storeengine-variants__drawer-list-head">
										<span className="storeengine-variants__drawer-product">
											{ ( 'string' === typeof values?.title
												? values.title
												: values?.title?.raw ) ||
												__( 'Product', 'storeengine' ) }
										</span>
										<span className="storeengine-variants__drawer-count">
											{ sprintf(
												/* translators: %d: number of prices */
												_n(
													'%d price',
													'%d prices',
													prices.length,
													'storeengine'
												),
												prices.length
											) }
										</span>
									</div>
									<nav
										className="storeengine-variants__drawer-items"
										aria-label={ __( 'Prices', 'storeengine' ) }
									>
										{ prices.map( ( price ) => {
											const active =
												String( price.id ) === String( openId );
											return (
												<button
													key={ price.id }
													type="button"
													className={ classNames(
														'storeengine-variants__drawer-item',
														{ 'is-active': active }
													) }
													aria-current={ active ? 'true' : undefined }
													onClick={ () => setOpenId( price.id ) }
												>
													<span className="storeengine-variants__drawer-item-text">
														<span className="storeengine-variants__drawer-item-name">
															{ price?.price_name }
														</span>
														<span className="storeengine-variants__drawer-item-meta">
															<Currency value={ price?.price } />
															{ ' · ' }
															{ typeLabel( price?.price_type ) }
														</span>
													</span>
												</button>
											);
										} ) }
									</nav>
									<button
										type="button"
										className={ classNames( 'storeengine-variants__drawer-add', {
											'is-active': 'new' === openId,
										} ) }
										onClick={ () => setOpenId( 'new' ) }
									>
										<span
											className="storeengine-icon storeengine-icon--add"
											aria-hidden={ true }
										/>
										{ __( 'Add price', 'storeengine' ) }
									</button>
								</aside>
								<section className="storeengine-variants__drawer-form storeengine-pricing-drawer__form">
									<h3 className="storeengine-variants__drawer-title">
										{ 'new' === openId
											? __( 'New price', 'storeengine' )
											: current?.price_name }
									</h3>
									{ formLoading ? (
										<Preloader />
									) : (
										<EditPrice
											key={ openId }
											ID={ ID }
											editingPrice={ current }
											setLoading={ setFormLoading }
											setEditingPrice={ handleFormDone }
										/>
									) }
								</section>
							</div>
						</Modal>
					</Scope>,
					document.body
				) }
		</>
	);
};

export default PricingSidePanel;
