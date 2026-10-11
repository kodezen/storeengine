import { doAction, doActionAsync } from '@wordpress/hooks';
import { renderErrorNotification, StoreEngineDQ } from '@Utils/helper';

export const initAddPaymentMethod = () => {
	const form = StoreEngineDQ( 'form#add_payment_method' );
	if ( ! form.exists() ) {
		return;
	}

	const get_selected = () =>
		form.find( 'input[name="payment_method"]:checked' );

	doAction( 'storeengine.add-payment-method.init-form', form );

	form.on( 'change', 'input[name="payment_method"]', async function () {
		const self = StoreEngineDQ( this );
		const paymentBox = self
			.parent( 'li' )
			.find( '.storeengine-payment-box' );
		StoreEngineDQ( '.storeengine-payment-box' )
			.not( paymentBox )
			.css( 'display', 'none' );
		paymentBox.css( 'display', '' );

		doAction(
			'storeengine.add-payment-method.select-payment-method',
			self.val(),
			form
		);
	} );

	get_selected().trigger( 'change' );

	form.on( 'submit', async ( event ) => {
		event.preventDefault();
		form.addClass( 'processing' );
		try {
			await doActionAsync(
				'storeengine.add-payment-method.save-payment-method',
				get_selected().val(),
				form
			);
		} catch ( err ) {
			renderErrorNotification( err );
			throw err;
		} finally {
			form.removeClass( 'processing' );
		}
	} );
};
