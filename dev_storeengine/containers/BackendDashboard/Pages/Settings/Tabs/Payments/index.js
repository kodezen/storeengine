import { useFormikContext, FieldArray } from 'formik';
import { arrayMoveImmutable } from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { __ } from '@wordpress/i18n';
import PaymentOption from './PaymentOption';
import AddonsForm from './AddonsForm';
import { useSelector } from 'react-redux';
import { Scope, Heading } from '@Components/ui';

import './styles.scss';
import { shouldCancelStart as defaultShouldCancelStart } from '@Utils/sortable';

// Only allow a sort to start from the dedicated drag-handle icon. Pressing
// anywhere else on the card (toggle, expand arrow, title, description) cancels
// the drag — reordering the whole row on any click caused accidental moves and
// broke the toggle/expand UX. We keep the whole card as the drag ghost (so the
// full row follows the cursor); the handle is just the allowed grab point.
const shouldCancelStart = ( event ) => {
	const target = event.target;
	if (
		! target ||
		typeof target.closest !== 'function' ||
		! target.closest( '.storeengine-payments--item__drag-handle' )
	) {
		return true;
	}
	return defaultShouldCancelStart( event );
};

const SortablePaymentItem = SortableElement( ( { item, itemIndex } ) => (
	<div key={ `item-${ itemIndex }` } className="bg-se-white">
		<PaymentOption { ...item } index={ itemIndex } />
	</div>
) );

const SortablePaymentItemContainer = SortableContainer( ( props ) => (
	<div className="storeengine-payments-settings__payment-types">
		{ props.children }
	</div>
) );

export default function Payments() {
	const { values, setFieldValue } = useFormikContext();
	const settings = useSelector( ( state ) => state.settings );

	const onSortEnd = ( { oldIndex, newIndex } ) => {
		const sortedPayments = arrayMoveImmutable(
			Object.entries( values.payments ),
			oldIndex,
			newIndex
		).reduce( ( acc, [ key, item ], index ) => {
			acc[ key ] = { ...item, index };
			return acc;
		}, {} );
		setFieldValue( 'payments', sortedPayments );
	};

	return (
		<Scope>
			<div className="storeengine-content-section storeengine-content-section--payment-method">
				<Heading>
					{ __( 'Payment Methods', 'storeengine' ) }
				</Heading>
				<FieldArray
					name="payments"
					render={ () => (
						<SortablePaymentItemContainer
							shouldCancelStart={ shouldCancelStart }
							onSortEnd={ onSortEnd }
							useDragHandle={ false }
						>
							{ values?.payments &&
								Object.entries( values?.payments ).map(
									( [ key ], index ) => {
										const item =
											settings.data.payment_gateways.find(
												( gateway ) =>
													gateway.id === key
											);
										if ( ! item ) {
											return null;
										}
										return (
											<SortablePaymentItem
												key={ `item-${ index }` }
												item={ item }
												itemIndex={ index }
												index={ index }
											/>
										);
									}
								) }
						</SortablePaymentItemContainer>
					) }
				/>
			</div>
			<AddonsForm />
		</Scope>
	);
}
