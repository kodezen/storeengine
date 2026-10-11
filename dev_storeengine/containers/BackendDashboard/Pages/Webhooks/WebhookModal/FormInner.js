import React from 'react';
import PostTitle from '@Components/PostTitle';
import Text from '@Components/Formik/Text';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import { Scope } from '@Components/ui';
import { rest_url, namespace } from '@Utils/helper';
import {
	webhookTypes,
	webhookEvents,
	webhookEventsFlat,
	webhookStatus,
	actionOptions,
	authTypes,
	incomingStatus,
	getActionDescription,
	formatEventLabel,
} from './helper';

const RequiredMark = () => (
	<abbr
		className="text-se-error no-underline"
		title={ __( 'Required', 'storeengine' ) }
	>
		*
	</abbr>
);

const buildEndpointUrl = ( key ) =>
	key ? `${ rest_url }${ namespace }incoming/${ key }` : '';

const WebhookFormInner = ( { isEdit = false } ) => {
	const { values, setFieldValue } = useFormikContext();
	const isIncoming = 'incoming' === values.__type;
	const action = values?.meta?._storeengine_incoming_action;
	const authType = values?.meta?._storeengine_incoming_auth_type;
	const endpointUrl = buildEndpointUrl(
		values?.meta?._storeengine_incoming_endpoint_key
	);
	const statusOptions = isIncoming ? incomingStatus : webhookStatus;

	const copy = ( text ) => {
		if ( text && navigator?.clipboard ) {
			navigator.clipboard.writeText( text );
		}
	};

	return (
		<Scope className="storeengine-hook-form flex flex-col">
			{ /* Webhook type — the first choice; defaults to Outgoing. */ }
			<div className="storeengine-hook-form__type mb-6 flex flex-col">
				<label
					htmlFor="webhook-type"
					className="text-sm font-medium text-se-text mb-2"
				>
					{ __( 'Webhook Type', 'storeengine' ) }
					<RequiredMark />
				</label>
				<Select
					id="webhook-type"
					options={ webhookTypes }
					value={ webhookTypes.find(
						( o ) => o.value === values.__type
					) }
					isDisabled={ isEdit }
					onChange={ ( option ) =>
						setFieldValue( '__type', option.value )
					}
					className="storeengine-select storeengine-select--full"
					classNamePrefix="storeengine-react-select"
				/>
				<span className="text-xs text-se-subtitle mt-2">
					{ isIncoming
						? __(
								'External systems send requests to StoreEngine (fulfillment, stock, no-code tools).',
								'storeengine'
						  )
						: __(
								'StoreEngine sends events to an external URL when things happen in your store.',
								'storeengine'
						  ) }
				</span>
			</div>

			{ /* Name (shared). */ }
			<div className="storeengine-hook-form__title mb-6">
				<label
					htmlFor="webhook-title"
					className="text-sm font-medium text-se-text"
				>
					{ __( 'Webhook Name', 'storeengine' ) }
					<RequiredMark />
				</label>
				<PostTitle
					id="webhook-title"
					name="title"
					label={ __( 'Add hooks title here', 'storeengine' ) }
					defaultValue={ values.title }
					saveValueHandler={ setFieldValue }
				/>
			</div>

			{ isIncoming ? (
				<>
					<div className="storeengine-hook-form--event mb-6 flex flex-col">
						<label
							htmlFor="incoming-action"
							className="text-sm font-medium text-se-text mb-2"
						>
							{ __( 'Action', 'storeengine' ) }
							<RequiredMark />
						</label>
						<Select
							id="incoming-action"
							placeholder={ __(
								'Select an action',
								'storeengine'
							) }
							options={ actionOptions }
							value={ actionOptions.find(
								( o ) => o.value === action
							) }
							onChange={ ( option ) =>
								setFieldValue(
									'meta._storeengine_incoming_action',
									option.value
								)
							}
							className="storeengine-select storeengine-select--full"
							classNamePrefix="storeengine-react-select"
						/>
						{ getActionDescription( action ) && (
							<span className="text-xs text-se-subtitle mt-2">
								{ getActionDescription( action ) }
							</span>
						) }
					</div>

					<div className="storeengine-hook-form__auth mb-6 flex flex-col">
						<label
							htmlFor="incoming-auth"
							className="text-sm font-medium text-se-text mb-2"
						>
							{ __( 'Authentication', 'storeengine' ) }
						</label>
						<Select
							id="incoming-auth"
							options={ authTypes }
							value={ authTypes.find(
								( o ) => o.value === authType
							) }
							onChange={ ( option ) =>
								setFieldValue(
									'meta._storeengine_incoming_auth_type',
									option.value
								)
							}
							className="storeengine-select storeengine-select--full"
							classNamePrefix="storeengine-react-select"
						/>
						<span className="text-xs text-se-subtitle mt-2">
							{ 'hmac' === authType
								? __(
										'Sign the raw JSON body with HMAC-SHA256 in the X-StoreEngine-Signature header.',
										'storeengine'
								  )
								: __(
										'Send the secret as: Authorization: Bearer <secret>.',
										'storeengine'
								  ) }
						</span>
					</div>

					{ endpointUrl && (
						<div className="storeengine-hook-form__endpoint mb-6 flex flex-col">
							<label className="text-sm font-medium text-se-text mb-2">
								{ __( 'Endpoint URL', 'storeengine' ) }
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									readOnly
									value={ endpointUrl }
									onFocus={ ( e ) => e.target.select() }
									className="storeengine-input"
									style={ { flex: 1 } }
								/>
								<button
									type="button"
									className="storeengine-btn storeengine-btn--sm"
									onClick={ () => copy( endpointUrl ) }
								>
									{ __( 'Copy', 'storeengine' ) }
								</button>
							</div>
							<span className="text-xs text-se-subtitle mt-2">
								{ __(
									'Point your external system (3PL, ERP, Zapier/Make/n8n) at this URL.',
									'storeengine'
								) }
							</span>
						</div>
					) }
				</>
			) : (
				<>
					<div className="storeengine-hook-form--event mb-6">
						<div className="flex flex-col">
							<label
								htmlFor="webhook-events"
								className="text-sm font-medium text-se-text mb-2"
							>
								{ __( 'Events Type', 'storeengine' ) }
								<RequiredMark />
							</label>
						</div>
						<Select
							id="webhook-events"
							placeholder={ __( 'Select Event', 'storeengine' ) }
							options={ webhookEvents }
							value={ webhookEventsFlat.filter( ( item ) =>
								values?.meta?._storeengine_webhook_events?.includes(
									item.value
								)
							) }
							onChange={ ( options ) =>
								setFieldValue(
									'meta._storeengine_webhook_events',
									options.map( ( item ) => item.value )
								)
							}
							// Grouped options intentionally use short per-group
							// labels ("Created", "Updated"…) so the dropdown stays
							// scannable — but once picked, the chips lose that
							// group context and several genuinely different
							// events can look identical. Qualify the chip (not
							// the dropdown row) with the full "Order Created"
							// style label so each selection stays distinguishable.
							formatOptionLabel={ ( option, meta ) =>
								meta.context === 'value'
									? formatEventLabel( option.value )
									: option.label
							}
							// isClearable={ true }
							isMulti={ true }
							className="storeengine-select storeengine-select--full"
							classNamePrefix="storeengine-react-select"
						/>
					</div>

					<div className="storeengine-hook-form--delivery">
						<Text
							title={ __( 'Delivery URL', 'storeengine' ) }
							name="meta._storeengine_webhook_delivery_url"
							type="url"
							placeholder={ __( 'Add url here', 'storeengine' ) }
							defaultValue={
								values?.meta?._storeengine_webhook_delivery_url
							}
							saveValueHandler={ setFieldValue }
							isRequired={ true }
						/>
					</div>
				</>
			) }

			{ /* Status (shared, type-appropriate options). */ }
			<div className="storeengine-hook-form__flex-item mb-6 flex justify-between">
				<div className="flex flex-col">
					<label
						htmlFor="webhook-status"
						className="text-sm font-medium text-se-text"
					>
						{ __( 'Status', 'storeengine' ) }
						<RequiredMark />
					</label>
					<span className="text-xs text-se-subtitle">
						{ isIncoming
							? __(
									'Only active endpoints accept requests. Paused endpoints return 403.',
									'storeengine'
							  )
							: __(
									'Only publish webhooks will trigger selected events.',
									'storeengine'
							  ) }
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<Select
						id="webhook-status"
						options={ statusOptions }
						value={ statusOptions.find(
							( item ) => item.value === values.status
						) }
						onChange={ ( option ) =>
							setFieldValue( 'status', option.value )
						}
						className="storeengine-select storeengine-select--full"
						classNamePrefix="storeengine-react-select"
					/>
				</div>
			</div>

			{ /* Secret (shared, different meta key per type). */ }
			<div className="storeengine-hook-form__secret">
				<Text
					title={
						isIncoming
							? endpointUrl
								? __( 'Secret', 'storeengine' )
								: __(
										'Secret (auto-generated on save if blank)',
										'storeengine'
								  )
							: __( 'Secret (optional)', 'storeengine' )
					}
					name={
						isIncoming
							? 'meta._storeengine_incoming_secret'
							: 'meta._storeengine_webhook_secret'
					}
					placeholder={ __( 'Add secret here', 'storeengine' ) }
					defaultValue={
						isIncoming
							? values?.meta?._storeengine_incoming_secret
							: values?.meta?._storeengine_webhook_secret
					}
					saveValueHandler={ setFieldValue }
				/>
			</div>
		</Scope>
	);
};

export default WebhookFormInner;
