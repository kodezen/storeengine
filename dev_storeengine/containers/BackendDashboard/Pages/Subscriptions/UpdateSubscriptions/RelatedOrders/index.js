import { __ } from '@wordpress/i18n';
import ListTable from '@Components/ListTable';
import { useFormikContext } from 'formik';
import { get_route_path } from '@Utils/helper';
import { Link } from 'react-router-dom';
import Currency from '@Components/Currency';
import Status from '@Components/Status';
import Time from '@Components/Time';
import { Card, Heading } from '@Components/ui';

const RelatedOrders = () => {
	const { values } = useFormikContext();
	const columns = [
		{
			name: __( 'Order Number', 'storeengine' ),
			cell: ( row ) => {
				return (
					<Link
						to={ get_route_path( {
							page: 'storeengine-orders',
							id: row.id,
							action: 'edit',
						} ) }
						className="order-details"
					>
						#{ row.id }
					</Link>
				);
			},
		},
		{
			name: __( 'Relationship', 'storeengine' ),
			cell: ( row ) => {
				return (
					<>
						{ 'parent_order' === row.order_type
							? __( 'Parent Order', 'storeengine' )
							: __( 'Renewal Order', 'storeengine' ) }
					</>
				);
			},
		},
		{
			name: __( 'Date', 'storeengine' ),
			cell: ( row ) => {
				return (
					<div className="storeenging-table-title-wrap">
						<Time
							dateTime={ row?.order_placed_date }
							format="ago"
						/>
					</div>
				);
			},
		},
		{
			name: __( 'Status', 'storeengine' ),
			cell: ( row ) => <Status status={ row.status } />,
		},
		{
			name: __( 'TOTAL', 'storeengine' ),
			cell: ( row ) => (
				<Currency
					value={ row.total_amount }
					args={ { currency: row.currency } }
				/>
			),
		},
	];

	return (
		<Card className="mb-6">
			<Heading>{ __( 'Related Orders', 'storeengine' ) }</Heading>
			<ListTable
				columns={ columns }
				data={ values.related_orders }
				showColumnFilter={ false }
				showSubHeader={ false }
				isRowSelectable={ false }
				suffix="subscription-purchase-items"
			/>
		</Card>
	);
};
export default RelatedOrders;
