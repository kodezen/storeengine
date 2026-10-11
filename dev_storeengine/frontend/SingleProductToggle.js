import { StoreEngineDQ } from '@Utils/helper';

export default function () {
	const priceSelector =
		'.storeengine-single-product-price,.storeengine-single-product-price-details';
	const planWrapper = '.storeengine-installment-plan-wrapper';
	const planDetails = '.storeengine-installment-plan-details';
	const planHeader = '.storeengine-installment-plan-header';
	const headerIcon = planHeader + ' .storeengine-icon';
	const installmentPlanDetails = {
		init() {
			const plans = StoreEngineDQ( planWrapper + ' ' + planDetails );
			if ( ! plans.length ) {
				return false;
			}

			plans.css( {
				overflow: 'hidden',
				transition: 'max-height 0.35s ease',
				maxHeight: 0,
			} );

			return true;
		},
		/**
		 *
		 * @param {StoreEngineDQ} el
		 */
		isOpen( el ) {
			return el
				.closest( priceSelector )
				.find( planWrapper )
				.hasClass( 'is-open' );
		},
		/**
		 *
		 * @param {StoreEngineDQ} el
		 */
		open( el ) {
			const wrapper = el.closest( priceSelector ).find( planWrapper );
			const details = wrapper.find( planDetails );
			wrapper.addClass( 'is-open' );
			details.css( { maxHeight: details.get( 0 ).scrollHeight + 'px' } );
			wrapper.find( headerIcon ).css( { transform: 'rotate(180deg)' } );
		},
		/**
		 *
		 * @param {StoreEngineDQ} el
		 */
		close( el ) {
			const wrapper = el.closest( priceSelector ).find( planWrapper );
			const details = wrapper.find( planDetails );
			wrapper.removeClass( 'is-open' );
			details.css( { maxHeight: '0px' } );
			wrapper.find( headerIcon ).css( { transform: 'rotate(0deg)' } );
		},
		/**
		 *
		 * @param {StoreEngineDQ} el
		 */
		closeOthers( el ) {
			el.closest( priceSelector )
				.siblings()
				.each( function () {
					installmentPlanDetails.close( StoreEngineDQ( this ) );
				} );
		},
	};

	StoreEngineDQ( document ).on(
		'click',
		'.storeengine-installment-future-payments',
		function ( e ) {
			e.preventDefault();
			const self = StoreEngineDQ( this );

			const parent = self.closest( 'table' );
			const payments = parent.find(
				'.order-installment-remaining--installments'
			);

			if ( parent.hasClass( 'is-open' ) ) {
				parent.removeClass( 'is-open' );
				payments.css( { maxHeight: 0 } );
				self.find( '.storeengine-icon' ).css( {
					transform: 'rotate(0deg)',
				} );
			} else {
				payments.css( {
					maxHeight: payments.get( 0 ).scrollHeight + 'px',
				} );
				parent.addClass( 'is-open' );
				self.find( '.storeengine-icon' ).css( {
					transform: 'rotate(180deg)',
				} );
			}
		}
	);

	if ( ! installmentPlanDetails.init() ) {
		return;
	}

	StoreEngineDQ( document ).on(
		'click change',
		priceSelector + ' input[name="price_id"]',
		function () {
			// On price select close all other open installment-plan-details.
			installmentPlanDetails.closeOthers( StoreEngineDQ( this ) );
		}
	);

	StoreEngineDQ( document ).on( 'click', planHeader, function ( event ) {
		event.preventDefault();
		const self = StoreEngineDQ( this );

		if ( installmentPlanDetails.isOpen( self ) ) {
			installmentPlanDetails.close( self );
			return;
		}

		installmentPlanDetails.closeOthers( self );
		installmentPlanDetails.open( self );
	} );
}
