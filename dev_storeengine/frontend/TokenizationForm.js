import { StoreEngineDQ as f } from '@Utils/helper';

const hidden = { visibility: 'hidden', opacity: '0', height: '0', margin: '0' };
const visible = { visibility: '', opacity: '', height: '', margin: '' };

/**
 * TokenizationForm — saved-payment-method picker.
 *
 * Vanilla JS via the StoreEngineDQ helper (no jQuery). `$target` is a
 * StoreEngineDQ collection wrapping the payment-box form element.
 *
 * @type {(target: StoreEngineDQ) => void}
 */
const TokenizationForm = function ( $target ) {
	this.$target = $target;
	this.$formWrap = $target.closest( '.storeengine-payment-box' );

	// Params.
	this.params = {
		is_registration_required: false,
		is_logged_in: false,
		...( StoreEngineGlobal?.tokenization_data || {} ),
	};

	// Bind functions to this.
	this.onDisplay = this.onDisplay.bind( this );
	this.hideForm = this.hideForm.bind( this );
	this.showForm = this.showForm.bind( this );
	this.showSaveNewCheckbox = this.showSaveNewCheckbox.bind( this );
	this.hideSaveNewCheckbox = this.hideSaveNewCheckbox.bind( this );

	const self = this;

	// When a radio button is changed, make sure to show/hide our new CC info area.
	this.$target.on(
		'click change',
		'input.storeengine-saved-payment-methods-token-input',
		function () {
			if ( 'new' === f( this ).val() ) {
				self.showForm();
				self.showSaveNewCheckbox();
			} else {
				self.hideForm();
				self.hideSaveNewCheckbox();
			}
		}
	);

	// OR if create account is checked.
	f( 'input#createaccount' ).on( 'change', function () {
		if ( f( this ).is( ':checked' ) ) {
			self.showSaveNewCheckbox();
		} else {
			self.hideSaveNewCheckbox();
		}
	} );

	// First display.
	this.onDisplay();
};

TokenizationForm.prototype.onDisplay = function () {
	// Make sure a radio button is selected if there is no is_default for this payment method..
	if (
		0 ===
		this.$target.find(
			'input.storeengine-saved-payment-methods-token-input:checked'
		).length
	) {
		this.$target
			.find( 'input.storeengine-saved-payment-methods-token-input' )
			.last()
			.prop( 'checked', true );
	}

	// Don't show the "use new" radio button if we only have one method..
	if ( 0 === this.$target.data( 'count' ) ) {
		this.$target.find( '.storeengine-saved-payment-methods-new' ).remove();
	}

	// Hide "save card" if "Create Account" is not checked and registration is not forced.
	const createAccountElement = f( 'input#createaccount' );
	const hasCreateAccountCheckbox = 0 < createAccountElement.length;
	const createAccount =
		hasCreateAccountCheckbox && createAccountElement.is( ':checked' );

	if (
		createAccount ||
		this.params.is_logged_in ||
		this.params.is_registration_required
	) {
		this.showSaveNewCheckbox();
	} else {
		this.hideSaveNewCheckbox();
	}

	// Trigger change event
	this.$target
		.find(
			'input.storeengine-saved-payment-methods-token-input:checked'
		)
		.trigger( 'change' );
};

TokenizationForm.prototype.hideForm = function () {
	this.$formWrap
		.find( '.storeengine-payment-form' )
		.removeClass( 'storeengine-mt-4 storeengine-mb-4' )
		.css( hidden );
};

TokenizationForm.prototype.showForm = function () {
	this.$formWrap
		.find( '.storeengine-payment-form' )
		.addClass( 'storeengine-mt-4 storeengine-mb-4' )
		.css( visible );
};

TokenizationForm.prototype.hideSaveNewCheckbox = function () {
	this.$formWrap.find( '.storeengine-save-new-payment-method' ).css( {
		display: 'none',
	} );
};

TokenizationForm.prototype.showSaveNewCheckbox = function () {
	this.$formWrap.find( '.storeengine-save-new-payment-method' ).css( {
		display: '',
	} );
};

export default TokenizationForm;
