import React, { useEffect, useState } from 'react';
import { getAddonActiveStatus, isProInstalled } from '@Utils/helper';
import { FormikWizard } from 'formik-wizard-form';
import SetupFormSteps from './Component/SetUpFormSteps';
import { __ } from '@wordpress/i18n';
import { useSelector, useDispatch } from 'react-redux';
import {
	fetchSettings,
	updateSettings,
} from '@Redux/Slices/settingsSlice/settingsSlice';
import Preloader from '@Components/Loader/Preloader';
import Product from './formSteps/Product';
import StoreDetails from './formSteps/StoreDetails';
import Theme from './formSteps/Theme';
import StoreCategory from './formSteps/StoreCategory';
import Payments from './formSteps/Payments';
import { useNavigate } from 'react-router-dom';
import SetupPages from './formSteps/SetupPages';
import FormFooter from '@Containers/BackendDashboard/SetupWizard/setupForm/Component/FormFooter';
import { saveAddon } from '@Redux/Slices/addonSlice/addonSlice';
import FormikWizardContext from './Context/FormikWizardContext';
import { useLocationQuery } from '@Hooks';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import localeInfo from '@Utils/locale-info';

import './styles.scss';

export default function SetupForm() {
	const location = useLocationQuery();
	const path = location.get( 'path' );
	const [ loading, isLoading ] = useState( false );
	const [ settingsUpdatingLoading, setSettingsUpdatingLoading ] =
		useState( false );
	const settingsFormValues = useSelector( ( state ) => state.settings.data );
	const allAddons = useSelector( ( state ) => state.addons );
	const dispatch = useDispatch();
	const navigate = useNavigate();

	useEffect( () => {
		if ( ! settingsFormValues ) {
			isLoading( true );
			dispatch( fetchSettings( { is_setup: true } ) ).then( () => {
				isLoading( false );
			} );
		}
	}, [] );

	const savedStepIndex = () => {
		switch ( path ) {
			case 'details':
				return 0;
			case 'product':
				return 1;
			case 'category':
				return 2;
			case 'payments':
				return 3;
			case 'setup-pages':
				return 4;
			case 'theme':
				return 5;
			default:
				return 0;
		}
	};

	const steps = [
		{
			title: __( 'Store details', 'storeengine' ),
			component: StoreDetails,
		},
		{
			title: __( 'What you sell', 'storeengine' ),
			component: Product,
		},
		{
			title: __( 'Industry', 'storeengine' ),
			component: StoreCategory,
		},
		{
			title: __( 'Payments', 'storeengine' ),
			component: Payments,
		},
		{
			title: __( 'Pages', 'storeengine' ),
			component: SetupPages,
		},
		{
			title: __( 'Theme', 'storeengine' ),
			component: Theme,
		},
	];

	const handleNavigate = ( path = '' ) => {
		navigate( `/settings?path=${ path }` );
	};

	const activateAddon = async ( name, slug ) =>
		dispatch(
			saveAddon( {
				addon_name: name,
				addon_slug: slug,
				status: true,
				required_plugin: false,
			} )
		);

	return (
		<>
			{ loading ? (
				<Preloader />
			) : (
				<FormikWizard
					enableReinitialize={ true }
					onSubmit={ ( values ) => {} }
					initialValues={ {
						settings: settingsFormValues,
						override_woo_pages: false,
						// product types. `primary_type` is the required single
						// choice (physical | digital | both, default both); the
						// physical/digital booleans are derived from it on submit.
						primary_type: 'both',
						digital_products: false,
						physical_products: false,
						service_products: false,
						decide_later: false,
						membership_support: getAddonActiveStatus(
							allAddons,
							'membership'
						),
						affiliate_support: getAddonActiveStatus(
							allAddons,
							'affiliate'
						),
						// payment gateways (Payments step).
						enable_stripe: getAddonActiveStatus(
							allAddons,
							'stripe'
						),
						enable_paypal: getAddonActiveStatus(
							allAddons,
							'paypal'
						),
						enable_cod: getAddonActiveStatus( allAddons, 'cod' ),
						// extra capability addons (What-you-sell step).
						enable_funnel: getAddonActiveStatus(
							allAddons,
							'funnel-builder'
						),
						enable_multicurrency: getAddonActiveStatus(
							allAddons,
							'multi-currency'
						),
						enable_pos: getAddonActiveStatus( allAddons, 'pos' ),
						// store category.
						store_category: {
							ecommerce: false,
							education: false,
							business: false,
							agency: false,
							personal: false,
							blog: false,
							saas: false,
							other: false,
						},
					} }
					validateOnNext
					activeStepIndex={ savedStepIndex }
					steps={ steps }
				>
					{ ( {
						currentStepIndex,
						renderComponent,
						handlePrev,
						handleNext,
						isPrevDisabled,
						isLastStep,
						resetForm,
						values,
					} ) => {
						useEffect( () => {
							switch ( currentStepIndex ) {
								case 0:
									handleNavigate( 'details' );
									break;
								case 1:
									handleNavigate( 'product' );
									break;
								case 2:
									handleNavigate( 'category' );
									break;
								case 3:
									handleNavigate( 'payments' );
									break;
								case 4:
									handleNavigate( 'setup-pages' );
									break;
								case 5:
									handleNavigate( 'theme' );
									break;
								default:
									break;
							}
						}, [ currentStepIndex ] );

						return (
							<FormikWizardContext.Provider
								value={ {
									currentStepIndex,
									handlePrev,
									handleNext,
									isPrevDisabled,
									isLastStep,
									resetForm,
								} }
							>
								{ settingsFormValues && (
									<React.Fragment>
										<SetupFormSteps
											steps={ steps }
											currentStepIndex={
												currentStepIndex
											}
											handleNext={ handleNext }
											resetForm={ resetForm }
										/>

										<div
											className={ `storeengine-setup-form step-index-${ currentStepIndex }` }
										>
											<div className="storeengine-setup-form__content">
												{ renderComponent() }
												<FormFooter
													isPrevDisabled={
														isPrevDisabled
													}
													isLastStep={ isLastStep }
													handlePrev={ handlePrev }
													handleNext={ async () => {
														if (
															values?.settings
																?.store_name ===
															''
														) {
															dispatch(
																showNotification(
																	{
																		message:
																			__(
																				'Store Name is required.',
																				'storeengine'
																			),
																		isShow: true,
																		type: 'error',
																	}
																)
															);
															return;
														} else if (
															values?.settings
																?.global_primary_color ===
															''
														) {
															dispatch(
																showNotification(
																	{
																		message:
																			__(
																				'Primary Color is required.',
																				'storeengine'
																			),
																		isShow: true,
																		type: 'error',
																	}
																)
															);
															return;
														} else if (
															values?.settings
																?.store_currency ===
															''
														) {
															dispatch(
																showNotification(
																	{
																		message:
																			__(
																				'Currency is required.',
																				'storeengine'
																			),
																		isShow: true,
																		type: 'error',
																	}
																)
															);
															return;
														} else if (
															values?.settings
																?.store_country ===
															''
														) {
															dispatch(
																showNotification(
																	{
																		message:
																			__(
																				'Country is required.',
																				'storeengine'
																			),
																		isShow: true,
																		type: 'error',
																	}
																)
															);
															return;
														}
														setSettingsUpdatingLoading(
															true
														);
														try {
															switch (
																currentStepIndex
															) {
																case 0: // Store Details Step.
																case 4: // Page Setup Step.
																	await dispatch(
																		updateSettings(
																			{
																				values: values.settings,
																			}
																		)
																	);
																	break;

																case 3: // Payments Step.
																	if (
																		values.enable_stripe
																	) {
																		await activateAddon(
																			__(
																				'Stripe',
																				'storeengine'
																			),
																			'stripe'
																		);
																	}
																	if (
																		values.enable_paypal
																	) {
																		await activateAddon(
																			__(
																				'PayPal',
																				'storeengine'
																			),
																			'paypal'
																		);
																	}
																	if (
																		values.enable_cod
																	) {
																		await activateAddon(
																			__(
																				'Cash on Delivery',
																				'storeengine'
																			),
																			'cod'
																		);
																	}
																	break;

																case 1: // Product Type Step.
																	const {
																		primary_type = 'both',
																		service_products = false,
																		membership_support = false,
																		affiliate_support = false,
																	} = values;
																	const physical_products =
																		'physical' === primary_type ||
																		'both' === primary_type;
																	const digital_products =
																		'digital' === primary_type ||
																		'both' === primary_type;

																	{
																		if (
																			physical_products
																		) {
																			await activateAddon(
																				__(
																					'PayPal',
																					'storeengine'
																				),
																				'paypal'
																			);
																			await activateAddon(
																				__(
																					'Stripe',
																					'storeengine'
																				),
																				'stripe'
																			);
																		}

																		if (
																			service_products
																		) {
																			await activateAddon(
																				__(
																					'PayPal',
																					'storeengine'
																				),
																				'paypal'
																			);
																			await activateAddon(
																				__(
																					'Stripe',
																					'storeengine'
																				),
																				'stripe'
																			);
																			await activateAddon(
																				__(
																					'Subscription',
																					'storeengine'
																				),
																				'subscription'
																			);
																		}

																		if (
																			digital_products
																		) {
																			await activateAddon(
																				__(
																					'Stripe',
																					'storeengine'
																				),
																				'stripe'
																			);
																			await activateAddon(
																				__(
																					'Subscription',
																					'storeengine'
																				),
																				'subscription'
																			);
																			if (
																				isProInstalled()
																			) {
																				await activateAddon(
																					__(
																						'License Management',
																						'storeengine'
																					),
																					'license-management'
																				);
																			}
																		}
																	}

																	if (
																		membership_support
																	) {
																		await activateAddon(
																			__(
																				'Membership',
																				'storeengine'
																			),
																			'membership'
																		);
																	}

																	if (
																		affiliate_support
																	) {
																		await activateAddon(
																			__(
																				'Affiliate',
																				'storeengine'
																			),
																			'affiliate'
																		);
																	}

																	if (
																			values.enable_funnel
																	) {
																		await activateAddon(
																			__(
																				'Funnel Builder',
																				'storeengine'
																			),
																			'funnel-builder'
																		);
																	}

																	if (
																			values.enable_multicurrency
																	) {
																		await activateAddon(
																			__(
																				'Multi-currency',
																				'storeengine'
																			),
																			'multi-currency'
																		);
																	}

																	if (
																			values.enable_pos &&
																			isProInstalled()
																	) {
																		await activateAddon(
																			__(
																				'Point of Sale',
																				'storeengine'
																			),
																			'pos'
																		);
																	}

																	break;

																case 2: // Store Category Step.
																	const {
																		store_category:
																			{
																				ecommerce = false,
																				education = false,
																				business = false,
																				agency = false,
																				personal = false,
																				blog = false,
																				saas = false,
																				other = false,
																			},
																	} = values;

																	if (
																		! other
																	) {
																		if (
																			saas ||
																			agency
																		) {
																			await activateAddon(
																				__(
																					'PayPal',
																					'storeengine'
																				),
																				'paypal'
																			);
																			await activateAddon(
																				__(
																					'Stripe',
																					'storeengine'
																				),
																				'stripe'
																			);
																			await activateAddon(
																				__(
																					'Subscription',
																					'storeengine'
																				),
																				'subscription'
																			);
																		}

																		if (
																			ecommerce ||
																			business
																		) {
																			if (
																				isProInstalled()
																			) {
																				await activateAddon(
																					__(
																						'Abandoned Cart',
																						'storeengine'
																					),
																					'abandoned-cart'
																				);
																			}
																		}

																		if (
																			education
																		) {
																			await activateAddon(
																				__(
																					'Membership',
																					'storeengine'
																				),
																				'membership'
																			);
																		}
																	}

																	break;
															}

															handleNext();
														} finally {
															setSettingsUpdatingLoading(
																false
															);
														}
													} }
													loading={
														settingsUpdatingLoading
													}
												/>
											</div>
										</div>
									</React.Fragment>
								) }
							</FormikWizardContext.Provider>
						);
					} }
				</FormikWizard>
			) }
		</>
	);
}
