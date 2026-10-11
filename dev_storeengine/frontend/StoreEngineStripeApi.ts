import { __ } from '@wordpress/i18n';
import {
	CheckoutLocale,
	CreatePaymentMethodData,
	loadStripe,
	PaymentMethod,
	Stripe,
	StripeConstructorOptions,
	StripeElementLocale,
	StripeElements,
	StripeElementsOptionsMode,
	StripeError,
	StripePaymentElement,
	StripePaymentElementOptions,
} from '@stripe/stripe-js';
import { formatDecimal, getSeGlobal } from '@Utils/helper';
import { CurrencyCode } from '@Utils/currencies';

type RequestOptions = Record< string, unknown >;
type RequestFunction = (
	endpoint: string,
	data?: RequestOptions
) => Promise< Record< string, unknown > >;

export interface StoreEngineStripeApiOptions {
	key: string;
	locale: string;
	theme_name?: string;
	apiVersion?: string;

	[ key: string ]: unknown;
}

interface AjaxErrorResponse extends Partial< Error > {
	statusText?: 'timeout' | 'abort' | 'error' | string;
	responseJSON?: {
		message?: string;
	};
}

interface ConfirmIntentResponse {
	request: Promise< string >;
	// isChangingPayment: boolean;
}

interface PaymentIntentUpdateResponse {
	result: 'success' | 'failure';
	messages?: string;
	return_url?: string;

	[ key: string ]: unknown;
}

interface SetupIntentServerResponse {
	status: 'succeeded' | 'requires_action' | string;
	next_action?: {
		type: 'redirect_to_url';
		redirect_to_url: {
			url: string;
		};
	};
	client_secret?: string;

	[ key: string ]: unknown;
}

/**
 * Handles generic connections to the server and Stripe.
 */
export default class StoreEngineStripeApi {
	private stripe: Stripe | null = null;
	private readonly options: StoreEngineStripeApiOptions;
	private readonly request: RequestFunction;

	/**
	 * Prepares the API.
	 *
	 * @param options Options for the initialization.
	 * @param request A function to use for AJAX requests.
	 */
	constructor(
		options: StoreEngineStripeApiOptions,
		request: RequestFunction
	) {
		this.options = options;
		this.request = request;
	}

	/**
	 * Construct WC AJAX endpoint URL.
	 *
	 * @param endpoint Request endpoint URL.
	 * @return URL with interpolated endpoint.
	 */
	getAjaxUrl( endpoint: string ): string {
		return endpoint;
	}

	#getFriendlyErrorMessage( error: AjaxErrorResponse ): string {
		// @TODO move these to makeRequest2 error handler.
		// error is a jqXHR and statusText is one of "timeout", "error", "abort", and "parsererror".
		switch ( error.statusText ) {
			case 'timeout':
				return __(
					'A timeout occurred while connecting to the server. Please try again.',
					'storeengine'
				);
			case 'abort':
				return __(
					'The connection to the server was aborted. Please try again.',
					'storeengine'
				);
			case 'error':
			default:
				return __(
					'An error occurred while connecting to the server. Please try again.',
					'storeengine'
				);
		}
	}

	#handle_error_response( error: AjaxErrorResponse | Error ): never {
		if ( error instanceof Error ) {
			throw error;
		}
		if ( error.message ) {
			throw new Error( error.message );
		} else {
			// Covers the case of error on the Ajax request.
			throw new Error( this.#getFriendlyErrorMessage( error ) );
		}
	}

	/**
	 * Generates a new instance of Stripe.
	 * @return Promise resolving to Stripe instance
	 */
	async getStripe() {
		const { key, locale } = this.options;
		if ( ! this.stripe ) {
			this.stripe = await this.createStripe( key, locale );
		}

		if ( ! this.stripe ) {
			throw new Error(
				'Stripe JS SDK was not loaded. Please reload and try again.'
			);
		}

		return this.stripe;
	}

	/**
	 * Radar Session.
	 *
	 * @return Promise resolving to radar session ID
	 * @throws {StripeError}
	 */
	async createStripeRadarSession(): Promise< string > {
		const stripe = await this.getStripe();

		const { radarSession, error } = await stripe.createRadarSession();

		if ( error ) {
			throw error;
		}

		return radarSession?.id;
	}

	/**
	 * Create Payment Method.
	 *
	 * @param {CreatePaymentMethodData} options Payment method creation options
	 * @return Promise resolving to PaymentMethod instance
	 * @throws {StripeError}
	 */
	async createPaymentMethod(
		options: CreatePaymentMethodData
	): Promise< PaymentMethod > {
		const stripe = await this.getStripe();

		const { paymentMethod, error } =
			await stripe.createPaymentMethod( options );

		if ( error ) {
			throw error;
		}

		if ( ! paymentMethod ) {
			throw new Error( 'Payment method creation failed' );
		}

		return paymentMethod;
	}

	/**
	 * Get Stripe Elements instance
	 * @param options Elements options
	 * @return Promise resolving to StripeElements instance
	 */
	async getStripeElements(
		options: StripeElementsOptionsMode | undefined
	): Promise< StripeElements > {
		const stripe = await this.getStripe();
		return stripe.elements( options );
	}

	async createStripeElement(
		elementsOptions: StripeElementsOptionsMode | undefined,
		paymentOptions?: StripePaymentElementOptions
	): Promise< {
		elements: StripeElements;
		element: StripePaymentElement;
	} > {
		const stripe = await this.getStripe();
		const elements = stripe.elements( elementsOptions );
		const element = elements.create( 'payment', paymentOptions );

		return { elements, element };
	}

	/**
	 * Create Stripe instance
	 * @param          key    Publishable key
	 * @param {stripe} locale Locale string
	 * @return Promise resolving to Stripe instance or null
	 */
	createStripe( key: string, locale: string ) {
		const options: StripeConstructorOptions = {
			locale: locale as StripeElementLocale | CheckoutLocale,
			// apiVersion: this.options.apiVersion,
		};

		// return loadStripe( key, options );
		// @ts-ignore
		return new window.Stripe( key, options );
	}

	/**
	 * Creates an intent based on a payment method.
	 *
	 * @param orderId           The id of the order if creating the intent on Order Pay page.
	 * @param paymentMethodType The type of payment method.
	 * @param save_method       if true payment intent will be created with `setup_future_usage=off_session`.
	 * @return Promise resolving to server response
	 */
	async createPaymentIntent(
		orderId: number | null = null,
		paymentMethodType: string | null = null,
		save_method: boolean = false
	): Promise< {
		paymentIntentId: string;
		clientSecret: string;
	} > {
		return ( await this.request( 'create-payment-intent', {
			stripe_order_id: orderId,
			save_payment_method: save_method,
			payment_method_type: paymentMethodType,
		} ) ) as {
			paymentIntentId: string;
			clientSecret: string;
		};
	}

	/**
	 * Creates and confirms a setup intent.
	 *
	 * @param payload Additional data to send with the request.
	 * @return Promise containing the setup intent.
	 */
	async createSetupIntent( payload: Record< string, unknown > = {} ) {
		return ( await this.request( 'create-setup-intent', payload ) ) as {
			setupIntentId: string;
			clientSecret: string;
			status: string;
			next_action: Record< string, any >;
			return_url: string;
		};
	}

	/**
	 * Creates and confirms a setup intent.
	 *
	 * @param payload Additional data to send with the request.
	 * @return Promise containing the setup intent.
	 */
	async setupIntent(
		payload: Record< string, unknown > = {}
	): Promise< SetupIntentServerResponse | string | undefined > {
		try {
			const response = ( await this.request(
				'create_and_confirm_setup_intent',
				payload
			) ) as SetupIntentServerResponse;
			if ( response.status === 'succeeded' ) {
				// No need for further authentication.
				return response;
			}

			if (
				response.status === 'requires_action' &&
				response.next_action?.type === 'redirect_to_url'
			) {
				window.location.href = response.next_action.redirect_to_url.url;
				return response.next_action.type;
			}

			const stripe = await this.getStripe();

			// Card Payments.
			const { setupIntent, error } = await stripe.confirmSetup( {
				clientSecret: response.client_secret!,
				redirect: 'if_required',
			} );

			if ( error ) {
				this.#handle_error_response( error );
			}

			return setupIntent as unknown as SetupIntentServerResponse;
		} catch ( err ) {
			this.#handle_error_response( err as AjaxErrorResponse );
		}
	}

	async confirmPayment() {
		const stripe = await this.getStripe();
	}

	/**
	 * Updates a payment intent with data from order: customer, level3 data and and maybe sets the payment for future use.
	 *
	 * @param intentId               The id of the payment intent.
	 * @param orderId                The id of the order.
	 * @param savePaymentMethod      'yes' if saving.
	 * @param selectedUPEPaymentType The name of the selected UPE payment type or empty string.
	 * @return Promise resolving to server response
	 */
	updateIntent(
		intentId: string,
		orderId: number,
		savePaymentMethod: string,
		selectedUPEPaymentType: string
	): Promise< PaymentIntentUpdateResponse | undefined > {
		// Don't update setup intents.
		if ( intentId.includes( 'seti_' ) ) {
			return Promise.resolve( undefined );
		}

		return this.request( 'update_payment_intent', {
			stripe_order_id: orderId,
			payment_intent_id: intentId,
			save_payment_method: savePaymentMethod,
			selected_payment_type: selectedUPEPaymentType,
		} )
			.then( ( response ) => {
				const typedResponse = response as PaymentIntentUpdateResponse;
				if ( typedResponse.result === 'failure' ) {
					throw new Error( typedResponse.messages );
				}
				return typedResponse;
			} )
			.catch( this.#handle_error_response );
	}

	/**
	 * Saves the Stripe Payment Elements appearance settings in a transient on server.
	 *
	 * @param appearance      The appearance settings.
	 * @param isBlockCheckout Whether the request is from the block checkout.
	 * @return Promise resolving to boolean indicating success
	 */
	saveAppearance(
		appearance: Record< string, unknown >,
		isBlockCheckout: string = 'false'
	): Promise< boolean > {
		return this.request( 'save_appearance', {
			appearance: JSON.stringify( appearance ),
			is_block_checkout: isBlockCheckout,
			theme_name: this.options?.theme_name,
		} )
			.then( ( response: { success?: boolean } ) => {
				return !! response.success;
			} )
			.catch( this.#handle_error_response );
	}

	static #zero_decimal_currencies: string[] = [
		'BIF', // Burundian Franc
		'CLP', // Chilean Peso
		'DJF', // Djiboutian Franc
		'GNF', // Guinean Franc
		'JPY', // Japanese Yen
		'KMF', // Comorian Franc
		'KRW', // South Korean Won
		'MGA', // Malagasy Ariary
		'PYG', // Paraguayan Guaraní
		'RWF', // Rwandan Franc
		//'UGX', // Ugandan Shilling
		'VND', // Vietnamese Đồng
		'VUV', // Vanuatu Vatu
		'XAF', // Central African Cfa Franc
		'XOF', // West African Cfa Franc
		'XPF', // Cfp Franc
	];

	static #three_decimal_currencies: string[] = [
		'BHD', // Bahraini Dinar
		'JOD', // Jordanian Dinar
		'KWD', // Kuwaiti Dinar
		'OMR', // Omani Rial
		'TND', // Tunisian Dinar
	];

	/**
	 *
	 * @param total
	 * @param currency
	 */
	static get_stripe_amount(
		total: number | string,
		currency: CurrencyCode
	): number {
		if ( ! currency ) {
			currency = getSeGlobal( 'currency_options.currency', 'USD' );
		}

		if ( this.#zero_decimal_currencies.includes( currency ) ) {
			return Math.abs( Math.round( Number( total ) ) );
		}

		if ( this.#three_decimal_currencies.includes( currency ) ) {
			const price_decimals = getSeGlobal(
				'currency_options.currency_decimal_limit',
				2
			);
			const amount = Math.abs(
				Number(
					formatDecimal( Number( total ) * 1000, price_decimals )
				)
			); // For three decimal currencies.

			return amount - ( amount % 10 ); // Round the last digit down. See https://docs.stripe.com/currencies?presentment-currency=AE#three-decimal
		}

		return Math.abs(
			Number(
				formatDecimal(
					Number( total ) * 100,
					getSeGlobal( 'currency_options.currency_decimal_limit' )
				)
			)
		); // In cents.
	}
}
