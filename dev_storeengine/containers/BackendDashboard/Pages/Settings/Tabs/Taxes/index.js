import React, { useState, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Scope, Button } from '@Components/ui';
import ReactModal from '@Components/Modal/ReactModal';
import ListTable from '@Components/ListTable';
import OptionMenu from '@Components/OptionMenu';
import { Form, Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import CountryStateFormInner from './CountryStateFromInner';
import GlobalTax from './GlobalTax';
import {
	createNewTax,
	deleteTax,
	fetchAllTax,
	updateTax,
} from '@Redux/Slices/settingsSlice/taxActions';
import {
	updateTaxItemPerPage,
	updateCurrentTaxPage,
} from '@Redux/Slices/settingsSlice/settingsSlice';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import countries from '@Utils/countries';
import states from '@Utils/states';

import './styles.scss';

const taxSchema = {
	country: '*',
	state: '*',
	postcode: '*',
	city: '*',
	rate: 0,
	name: '',
	priority: 1,
	compound: false,
	shipping: true,
	order: 0,
	class: 'standard',
};

const Taxes = () => {
	const taxes = useSelector( ( state ) => state?.settings?.taxes );
	const {
		values: { enable_product_tax, enable_stripe_tax },
	} = useFormikContext();
	const isTaxEnabled = !! enable_product_tax;
	const isStripeTaxEnabled = !! enable_stripe_tax;
	// Per-jurisdiction rate table is irrelevant while Stripe is calculating tax,
	// but the rates remain in storage so they can act as a fallback if the user
	// opts in to `stripe_tax_fallback_to_local`.
	const showRatesTable = isTaxEnabled && ! isStripeTaxEnabled;
	const [ openModal, setOpenModal ] = useState( false );
	const [ loading, setLoading ] = useState( false );
	const [ initialValues, setInitialValues ] = useState( taxSchema );
	const dispatch = useDispatch();
	useEffect( () => {
		( async () => {
			if (
				! taxes?.data ||
				( taxes?.data && taxes?.data?.length <= 1 )
			) {
				await dispatch( fetchAllTax( {} ) );
			}
		} )();
	}, [ dispatch ] );

	const onRequestClose = () => {
		setOpenModal( false );
		setInitialValues( taxSchema );
	};

	const handleEdit = ( params = null ) => {
		if ( params ) {
			setInitialValues( params );
		}

		setOpenModal( true );
	};

	const onSubmitHandler = async ( values, actions ) => {
		actions.setSubmitting( true );

		if ( ! values?.country ) {
			dispatch(
				showNotification( {
					message: __( 'Tax country is required', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
			return;
		}
		if ( ! values?.state ) {
			dispatch(
				showNotification( {
					message: __(
						'Tax state/province is required',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
			return;
		}
		if ( ! values?.rate ) {
			dispatch(
				showNotification( {
					message: __( 'Tax rate is required', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
			return;
		}

		if ( values.id ) {
			await dispatch( updateTax( values ) );
		} else {
			await dispatch( createNewTax( values ) );
		}

		actions.resetForm();
		onRequestClose();
	};

	const handleDelete = async ( id ) => {
		await dispatch( deleteTax( id ) );
	};

	const handleTableDataFetch = async ( page = 1, itemPerPage = 10 ) => {
		setLoading( true );
		await dispatch( fetchAllTax( { page, per_page: itemPerPage } ) );
		setLoading( false );
	};

	const handleItemsPage = async ( itemsPerPage = 10, page = 1 ) => {
		dispatch( updateTaxItemPerPage( itemsPerPage ) );
		await handleTableDataFetch( page, itemsPerPage ); // Pass the URL params
	};

	const handlePageChange = async ( page = 1, itemPerPage = 10 ) => {
		dispatch( updateCurrentTaxPage( page ) );
		await handleTableDataFetch( page, itemPerPage );
	};

	const columns = [
		{
			name: __( 'Country', 'storeengine' ),
			cell: ( row ) => (
				<p className="storeengine-table-title">
					{ countries.find( ( item ) => item.value === row?.country )
						?.label ||
						row?.country ||
						__( 'Any Country', 'storeengine' ) }
				</p>
			),
		},
		{
			name: __( 'State/Province', 'storeengine' ),
			cell: ( row ) => (
				<p className="storeengine-table-title">
					{ ( row?.country &&
						states[ row?.country ]?.find(
							( item ) => item.value === row?.state
						)?.label ) ||
						row?.state ||
						__( 'Any State/Province', 'storeengine' ) }
				</p>
			),
		},
		{
			name: __( 'Tax Rate (%)', 'storeengine' ),
			cell: ( row ) => (
				<p className="storeengine-table-title">
					{
						// translators: %s: Tax Rate
						sprintf( __( '%s%%', 'storeengine' ), row?.rate )
					}
				</p>
			),
		},
		{
			name: __( 'Tax Name', 'storeengine' ),
			cell: ( row ) => (
				<p className="storeengine-table-title">{ row?.name }</p>
			),
		},
		{
			name: __( 'Priority', 'storeengine' ),
			cell: ( row ) => (
				<p className="storeengine-table-title">{ row?.priority }</p>
			),
		},
		{
			name: __( 'Actions', 'storeengine' ),
			cell: ( row ) => (
				<OptionMenu
					options={ [
						{
							type: 'button',
							label: <span>{ __( 'Edit', 'storeengine' ) }</span>,
							icon: (
								<span
									className="storeengine-icon storeengine-icon--edit"
									aria-hidden="true"
								/>
							),
							onClick: () => handleEdit( row ),
						},
						{
							type: 'button',
							label: (
								<span>{ __( 'Delete', 'storeengine' ) }</span>
							),
							suffix: 'trash',
							icon: (
								<span
									className="storeengine-icon storeengine-icon--trash"
									aria-hidden="true"
								/>
							),
							onClick: () => handleDelete( row.id ),
						},
					] }
				/>
			),
		},
	];

	return (
		<Scope>
			<div className="storeengine-content-section">
				<GlobalTax />

				<Formik
					initialValues={ initialValues }
					enableReinitialize={ true }
					onSubmit={ onSubmitHandler }
				>
					{ () => (
						<Form>
							<ReactModal
								isEnabledHeader={ true }
								isOpen={ openModal }
								onRequestClose={ onRequestClose }
								title={
									initialValues.id
										? __( 'Edit Tax Rate', 'storeengine' )
										: __( 'Add Tax Rate', 'storeengine' )
								}
								suffix="tax-rate"
								size="small"
							>
								<CountryStateFormInner
									setOpenModal={ setOpenModal }
									loading={ loading }
								/>
							</ReactModal>
						</Form>
					) }
				</Formik>
			</div>

			{ isTaxEnabled && isStripeTaxEnabled && (
				<div className="storeengine-content-section storeengine-stripe-tax-rates-hidden">
					<p>
						{ __(
							'Stripe Automatic Tax is calculating tax for this store. Rates configured below are kept as a fallback only.',
							'storeengine'
						) }
					</p>
				</div>
			) }

			{ showRatesTable && (
				<div
					id="settingsTaxes"
					className="storeengine-content-section storeengine-content-section--taxes"
				>
					<div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-se-border">
						<h3 className="m-0 text-lg font-medium text-se-text">
							{ __( 'Store Tax', 'storeengine' ) }
						</h3>
						<Button
							onClick={ () => {
								setInitialValues( taxSchema );
								setOpenModal( true );
							} }
							disabled={ ! isTaxEnabled }
							type="button"
							preset="primary"
							icon="storeengine-icon--add"
						>
							{ __( 'Add Tax Rate', 'storeengine' ) }
						</Button>
					</div>

					<ListTable
						columns={ columns }
						data={ taxes?.data }
						showSubHeader={ false }
						isRowSelectable={ false }
						noDataText={ __(
							'No tax rates found.',
							'storeengine'
						) }
						showColumnFilter={ false }
						showPagination={ taxes?.totalItems >= 10 }
						onChangePage={ handlePageChange }
						onChangeItemsPerPage={ handleItemsPage }
						totalItems={ taxes?.totalItems }
						totalRows={ taxes?.data?.length }
						currentPageNumber={ taxes?.currentPage }
						rowsPerPage={ taxes?.itemPerPage }
						suffix="tax-settings"
					/>
				</div>
			) }
		</Scope>
	);
};

export default Taxes;
