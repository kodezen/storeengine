import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelector } from 'react-redux';
import { useFormikContext } from 'formik';
import { decodeEntities } from '@wordpress/html-entities';
import ReactModal from '@Components/Modal/ReactModal';
import OptionMenu from '@Components/OptionMenu';
import StoreEngineSelect from '@Components/StoreEngineSelect';
import {
	Scope,
	Card,
	Row,
	Title,
	SubTitle,
	Button,
	Table,
	THead,
	TH,
	TR,
	TD,
} from '@Components/ui';
import {
	CURRENCY_OPTIONS,
	getCurrencyFlag,
	formatPreview,
	formatRate,
} from '../helper';
import { currencies } from '@Utils/helper';

const CurrencyTable = () => {
	const { values, setFieldValue } = useFormikContext();
	const settings = useSelector( ( state ) => state.settings );
	const multiCurrencyRates = useSelector(
		( state ) => state.settings?.multiCurrencyRates ?? {}
	);
	const enabledCurrencies = values?.multi_currency?.enabled_currencies ?? [];
	const currencyRates = multiCurrencyRates?.currency_rates ?? {};

	const baseCurrencyCode = (
		settings?.data?.store_currency || 'USD'
	).toUpperCase();
	const baseCurrencyData = currencies?.find(
		( c ) => c.code === baseCurrencyCode
	) ?? {
		code: baseCurrencyCode,
		name: baseCurrencyCode,
		symbol: '$',
	};

	const addableCurrencyOptions = CURRENCY_OPTIONS.filter(
		( o ) =>
			o.value !== baseCurrencyCode &&
			! enabledCurrencies.some( ( c ) => c.code === o.value )
	);

	const [ isAddModalOpen, setIsAddModalOpen ] = useState( false );
	const [ selectedNewCurrency, setSelectedNewCurrency ] = useState( null );
	const [ editingCode, setEditingCode ] = useState( null );
	const [ draftRate, setDraftRate ] = useState( '' );

	const handleAddCurrency = () => {
		if ( ! selectedNewCurrency ) {
			return;
		}
		const code = selectedNewCurrency.value;
		if (
			code === baseCurrencyCode ||
			enabledCurrencies.some( ( c ) => c.code === code )
		) {
			setIsAddModalOpen( false );
			setSelectedNewCurrency( null );
			return;
		}
		const currencyInfo = selectedNewCurrency._currency;
		const newEntry = {
			code: currencyInfo.code,
			label: currencyInfo.name,
			symbol: decodeEntities( currencyInfo.symbol ),
		};
		setFieldValue( 'multi_currency.enabled_currencies', [
			...enabledCurrencies,
			newEntry,
		] );
		setIsAddModalOpen( false );
		setSelectedNewCurrency( null );
	};

	const handleDeleteCurrency = ( code ) => {
		setFieldValue(
			'multi_currency.enabled_currencies',
			enabledCurrencies.filter( ( c ) => c.code !== code )
		);
	};

	const handleEditRate = ( code, currentCustomRate ) => {
		setEditingCode( code );
		setDraftRate(
			currentCustomRate != null ? String( currentCustomRate ) : ''
		);
	};

	const handleCancelEdit = () => {
		setEditingCode( null );
		setDraftRate( '' );
	};

	const handleSaveRate = ( code ) => {
		const parsed = parseFloat( draftRate );
		const newRate = ! isNaN( parsed ) && parsed > 0 ? parsed : null;
		setFieldValue(
			'multi_currency.enabled_currencies',
			enabledCurrencies.map( ( c ) =>
				c.code === code ? { ...c, custom_rate: newRate } : c
			)
		);
		handleCancelEdit();
	};

	const handleClearRate = ( code ) => {
		setFieldValue(
			'multi_currency.enabled_currencies',
			enabledCurrencies.map( ( c ) =>
				c.code === code ? { ...c, custom_rate: null } : c
			)
		);
	};

	return (
		<Card>
			<Row justify="between" align="center" className="pb-4 mb-6 border-b border-se-border mb-6">
				<div className='flex flex-col gap-1'>
					<h2 className="text-lg font-medium text-se-text m-0">
						{ __( 'Currency Management', 'storeengine' ) }
					</h2>
					<SubTitle>
						{ __(
							'Configure and manage the specific currencies available for customer transactions on your storefront.',
							'storeengine'
						) }
					</SubTitle>
				</div>
				<Button
					type="button"
					preset="primary"
					icon="storeengine-icon--add"
					onClick={ () => {
						setSelectedNewCurrency( null );
						setIsAddModalOpen( true );
					} }
				>
					{ __( 'Add New', 'storeengine' ) }
				</Button>
			</Row>

			<Table className="m-0">
				<THead>
					<TR>
						<TH className="whitespace-nowrap">{ __( 'Currency', 'storeengine' ) }</TH>
						<TH className="whitespace-nowrap">{ __( 'Label', 'storeengine' ) }</TH>
						<TH className="whitespace-nowrap">{ __( 'Live Rate', 'storeengine' ) }</TH>
						<TH className="whitespace-nowrap">{ __( 'Custom Rate', 'storeengine' ) }</TH>
						<TH className="whitespace-nowrap">{ __( 'Preview', 'storeengine' ) }</TH>
						<TH className="whitespace-nowrap">{ __( 'Actions', 'storeengine' ) }</TH>
					</TR>
				</THead>
				<tbody>
					{ /* ── Base currency row ── */ }
					<TR>
						<TD>
							<div className="flex items-center gap-2">
								<span aria-hidden="true">
									{ getCurrencyFlag( baseCurrencyCode ) }
								</span>
								<span>
									{ decodeEntities( baseCurrencyData.name ) }
								</span>
							</div>
						</TD>
						<TD>
							<span className="inline-flex px-2 py-0.5 rounded-se text-xs bg-se-primary-light text-se-primary">
								{ __( 'Default', 'storeengine' ) }
							</span>
						</TD>
						<TD>–</TD>
						<TD>–</TD>
						<TD>{ formatPreview( baseCurrencyData.symbol ) }</TD>
						<TD />
					</TR>

					{ /* ── Enabled additional currencies ── */ }
					{ enabledCurrencies.map( ( c ) => {
						const rateEntry = currencyRates[ c.code ];
						const liveRateStr = rateEntry?.has_live_rate
							? formatRate( rateEntry.live_rate )
							: null;
						const isEditing = editingCode === c.code;
						return (
							<TR key={ c.code }>
								<TD>
									<div className="flex items-center gap-2">
										<span aria-hidden="true">
											{ getCurrencyFlag( c.code ) }
										</span>
										<span>{ c.label || c.code }</span>
									</div>
								</TD>
								<TD>
									<span className="inline-flex px-2 py-0.5 rounded-se text-xs bg-se-bg text-se-text">
										{ c.code }
									</span>
								</TD>
								<TD>
									{ liveRateStr
										? `1 ${ baseCurrencyCode } = ${ liveRateStr } ${ c.code }`
										: '–' }
								</TD>
								<TD>
									{ isEditing ? (
										<div className="flex items-center gap-2">
											<input
												type="number"
												className="h-9 w-28 px-2 rounded-se border border-se-border text-sm text-se-text outline-none focus:border-se-primary"
												value={ draftRate }
												onChange={ ( e ) =>
													setDraftRate( e.target.value )
												}
												onKeyDown={ ( e ) => {
													if ( e.key === 'Enter' ) {
														handleSaveRate( c.code );
													}
													if ( e.key === 'Escape' ) {
														handleCancelEdit();
													}
												} }
												placeholder="e.g. 1.2500"
												min="0"
												step="any"
												// eslint-disable-next-line jsx-a11y/no-autofocus
												autoFocus
											/>
											<Button
												type="button"
												preset="outline"
												size="xs"
												icon="storeengine-icon--check"
												onClick={ () =>
													handleSaveRate( c.code )
												}
												title={ __(
													'Save rate',
													'storeengine'
												) }
											/>
											<Button
												type="button"
												preset="outline"
												size="xs"
												icon="storeengine-icon--close"
												onClick={ handleCancelEdit }
												title={ __(
													'Cancel',
													'storeengine'
												) }
											/>
										</div>
									) : (
										<div className="flex items-center gap-2">
											{ c.custom_rate ? (
												<>
													<span>
														{ formatRate(
															c.custom_rate
														) }
													</span>
													<Button
														type="button"
														preset="ghost"
														size="xs"
														icon="storeengine-icon--stoke-close"
														onClick={ () =>
															handleClearRate(
																c.code
															)
														}
														title={ __(
															'Reset to auto rate',
															'storeengine'
														) }
													/>
												</>
											) : (
												<span className="text-se-subtitle">
													{ __( 'Auto', 'storeengine' ) }
												</span>
											) }
											<Button
												type="button"
												preset="ghost"
												size="xs"
												icon="storeengine-icon--edit-pen"
												onClick={ () =>
													handleEditRate(
														c.code,
														c.custom_rate
													)
												}
												title={ __(
													'Set custom rate',
													'storeengine'
												) }
											/>
										</div>
									) }
								</TD>
								<TD>{ formatPreview( c.symbol ) }</TD>
								<TD className="flex items-center justify-center">
									<OptionMenu
										options={ [
											{
												type: 'button',
												label: (
													<span>
														{ __(
															'Delete',
															'storeengine'
														) }
													</span>
												),
												icon: (
													<span
														className="storeengine-icon storeengine-icon--trash"
														aria-hidden="true"
													/>
												),
												onClick: () =>
													handleDeleteCurrency( c.code ),
												suffix: 'trash',
											},
										] }
										suffix="currency-row"
									/>
								</TD>
							</TR>
						);
					} ) }

					{ enabledCurrencies.length === 0 && (
						<TR>
							<TD colSpan={ 6 } className="text-center text-se-subtitle">
								{ __(
									'No additional currencies added yet.',
									'storeengine'
								) }
							</TD>
						</TR>
					) }
				</tbody>
			</Table>

			<ReactModal
				isEnabledHeader={ true }
				isOpen={ isAddModalOpen }
				onRequestClose={ () => {
					setIsAddModalOpen( false );
					setSelectedNewCurrency( null );
				} }
				title={ __( 'Add Currency', 'storeengine' ) }
				suffix="add-currency"
				size="small"
			>
				<Scope className="pb-6">
					<StoreEngineSelect
						label={ __( 'Select Currency', 'storeengine' ) }
						placeholder={ __(
							'Search currencies…',
							'storeengine'
						) }
						options={ addableCurrencyOptions }
						value={ selectedNewCurrency }
						isSearchable={ true }
						onChangeHandler={ ( val ) => {
							const option = addableCurrencyOptions.find(
								( o ) => o.value === val
							);
							setSelectedNewCurrency( option ?? null );
						} }
						suffix="currencies-add-select"
					/>
					<Row justify="end" gap={ 3 } className="mt-4">
						<Button
							type="button"
							preset="outline"
							onClick={ () => {
								setIsAddModalOpen( false );
								setSelectedNewCurrency( null );
							} }
						>
							{ __( 'Cancel', 'storeengine' ) }
						</Button>
						<Button
							type="button"
							preset="primary"
							onClick={ handleAddCurrency }
							disabled={ ! selectedNewCurrency }
						>
							{ __( 'Add Currency', 'storeengine' ) }
						</Button>
					</Row>
				</Scope>
			</ReactModal>
		</Card>
	);
};

export default CurrencyTable;
