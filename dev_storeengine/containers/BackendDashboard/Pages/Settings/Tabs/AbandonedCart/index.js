import { __ } from '@wordpress/i18n';
import Label from '@Components/Formik/Label';
import Checkbox from '@Components/Formik/Checkbox';
import { ContentSection } from '@Containers/BackendDashboard/Pages/Settings/Layouts';
import { Select } from '@Components/ui/Select';
import { Field, useFormikContext } from 'formik';
import Number from '@Components/Formik/Number';
import {
	discountTypes,
	emailOptions,
	discountNotificationOptions,
} from './helper';
import { Link } from 'react-router-dom';
import { route_path } from '@Utils/helper';
import Notice from '@Components/Notice';
import { Scope } from '@Components/ui';

import './styles.scss';

const AbandonedCart = () => {
	const {
		values: {
			abandoned_cart = {
				cut_off_time: 30, // in minutes
				early_track: false,
				first_email: true,
				first_email_delay: 3600, // in seconds
				second_email: true,
				second_email_delay: 86400, // in seconds
				third_email: true,
				third_email_delay: 432000, // in seconds
				enable_discount: false,
				discount_type: 'percentage',
				discount_amount: 10,
				expire_discount: true,
				discount_expire: 7, // in days
				offer_discount_on: 'second_email',
			},
		},
		setFieldValue,
	} = useFormikContext();

	return (
		<Scope
			id="settingsAbandonedCart"
			className="storeengine-tab-content--abandoned-cart"
		>
			<ContentSection
				slug={ 'abandoned_cart' }
				label={ __( 'Abandoned Cart & Checkout', 'storeengine' ) }
			>
				<Number
					htmlFor="abandoned_cart.cut_off_time"
					title={ __( 'Cart cut off time', 'storeengine' ) }
					tooltip={ __(
						'The time interval (in minutes) after which an active cart is considered abandoned if no further activity is detected.',
						'storeengine'
					) }
					name="abandoned_cart.cut_off_time"
					suffix="cart-abn"
					unit={ __( 'Minutes', 'storeengine' ) }
					step={ 1 }
					min={ 0 }
					isRequired
				/>
				{ abandoned_cart.cut_off_time < 15 && (
					<Notice
						notice={ {
							classes: [ 'storeengine-mb-6' ],
							type: 'warning',
							icon: 'notify-warning',
							message: (
								<p>
									{ __(
										'A very low cut-off time may mark active carts as abandoned too soon, leading to inaccurate tracking and unnecessary recovery emails.',
										'storeengine'
									) }
								</p>
							),
						} }
						style={ {
							border: '1px solid var(--storeengine-warning-color)',
							borderRadius: '5px',
						} }
					/>
				) }
				<Checkbox
					title={ __(
						'Start Tracking When User Add To Cart',
						'storeengine'
					) }
					tooltip={ __(
						'Abandoned cart tracking usually starts after checkout details are entered. This option tracks logged-in users’ carts earlier, right after an item is added.',
						'storeengine'
					) }
					name="abandoned_cart.early_track"
					suffix={ 'plain' }
				/>
			</ContentSection>

			<div className='storeengine-content-section storeengine-content-section--abandoned_cart'>
				<div className='flex items-center justify-between w-full border-0 border-b border-solid border-se-border mb-6 pb-4'>
					<h3 className='text-lg leading-[25.2px] m-0 text-se-text'>
						{ __( 'Email Settings', 'storeengine' ) }
					</h3>

					<Link
						to={ `${ route_path }admin.php?page=storeengine-settings&path=email` }
						className="storeengine-tab-content--abandoned-cart_email-link"
					>
						{ __( 'Configure Email', 'storeengine' ) }
					</Link>
				</div>

				<div className='flex flex-col gap-6'>
					{ emailOptions.map( ( option, index ) => (
						<div
							key={ index }
							className="flex items-start justify-between gap-4"
						>
							<div className="storeengine-width-50">
								<Label
									htmlFor={ option.value + '_delay' }
									title={ __( `${ option.label } Delay`, 'storeengine' ) }
									isRequired
								/>
								<Select
									name={
										'abandoned_cart.' + option.value + '_delay'
									}
									className="storeengine-select storeengine-select-abandoned-cart"
									classNamePrefix="storeengine-react-select"
									placeholder={ __(
										'Select Delay',
										'storeengine'
									) }
									value={
										option.delays.find(
											( o ) =>
												o.value ===
												abandoned_cart[
													option.value + '_delay'
												]
										) || option.delays[ option.default ]
									}
									options={ option.delays }
									onChange={ ( o ) =>
										setFieldValue(
											'abandoned_cart.' +
												option.value +
												'_delay',
											o.value
										)
									}
									isDisabled={ ! abandoned_cart[ option.value ] }
								/>
							</div>
							<Checkbox
								// title={ option.label }
								name={ 'abandoned_cart.' + option.value }
								suffix={ 'abn-cart' }
							/>
						</div>
					) ) }
				</div>
			</div>

			<ContentSection
				slug="abandoned_cart_discount"
				label={ __( 'Discount Settings', 'storeengine' ) }
			>
				<Checkbox
					title={ __( 'Enable Discount', 'storeengine' ) }
					name="abandoned_cart.enable_discount"
					suffix="plain"
				/>
				{ abandoned_cart?.enable_discount && (
					<>
						<div className="storeengine-flex storeengine-mb-4 mt-6">
							<div className="storeengine-width-50">
								<h3 className="storeengine-title">
									{ __( 'Choose a type', 'storeengine' ) }
								</h3>
								<div className="storeengine-flex storeengine-flex-gap-12 storeengine-mt-2 storeengine-mb-4">
									{ discountTypes.map( ( item, index ) => (
										<label
											key={ index }
											className="storeengine-radio-option"
											htmlFor={ `abandoned_cart_discount_type-${ index }` }
										>
											<Field
												id={ `abandoned_cart_discount_type-${ index }` }
												name="abandoned_cart.discount_type"
												type="radio"
												value={ item.value }
												className="storeengine-radio"
											/>
											<span>{ item.label }</span>
										</label>
									) ) }
								</div>
							</div>
							<div className="storeengine-width-50">
								<Label
									htmlFor="abandoned_cart_percentage_off"
									title={ __(
										'Discount Amount',
										'storeengine'
									) }
									isRequired
								/>
								<Number
									name="abandoned_cart.discount_amount"
									percentage={
										abandoned_cart?.discount_type ===
										'percentage'
									}
									currency={
										abandoned_cart?.discount_type !==
										'percentage'
									}
									suffix="cart-abn"
									isRequired
								/>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Checkbox
								title={ __(
									'Discount Expires(Number of days until expiration)',
									'storeengine'
								) }
								name="abandoned_cart.expire_discount"
								suffix={ 'plain' }
							/>
							<Number
								name="abandoned_cart.discount_expire"
								suffix="cart-abn"
								unit={ __( 'Days', 'storeengine' ) }
								isDisabled={
									! abandoned_cart?.expire_discount
								}
								isRequired
							/>
						</div>
						<div className="storeengine-d-flex storeengine-flex-align-end storeengine-flex-gap-24">
							<Label
								htmlFor="abandoned_cart.offer_discount_on"
								title={ __(
									'When to send the discount coupon?',
									'storeengine'
								) }
								isRequired
							/>
							<div className="storeengine-width-50">
								<Select
									name="abandoned_cart.offer_discount_on"
									className="storeengine-select storeengine-select-abandoned-cart"
									classNamePrefix="storeengine-react-select"
									placeholder={ __(
										'Select',
										'storeengine'
									) }
									value={
										discountNotificationOptions.find(
											( o ) =>
												o.value ===
												abandoned_cart?.offer_discount_on
										) || discountNotificationOptions[ 1 ]
									}
									options={ discountNotificationOptions }
									onChange={ ( option ) =>
										setFieldValue(
											'abandoned_cart.offer_discount_on',
											option.value
										)
									}
									isRequired
									menuPlacement='top'
								/>
							</div>
						</div>
					</>
				) }
			</ContentSection>
		</Scope>
	);
};

export default AbandonedCart;
