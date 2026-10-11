import React from 'react';
import PostTitle from '@Components/PostTitle';
import Text from '@Components/Formik/Text';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import { Scope } from '@Components/ui';
import { webhookStatus, webhookEvents, webhookEventsFlat } from './helper';

const HooksFormInner = () => {
	const { values, setFieldValue } = useFormikContext();

	return (
		<Scope className="storeengine-hook-form flex flex-col">
			<div className="storeengine-hook-form__title mb-6">
				<label
					htmlFor="webhook-title"
					className="text-sm font-medium text-se-text"
				>
					{ __( 'Webhook Name', 'storeengine' ) }
					<abbr
						className="text-se-error no-underline"
						title={ __( 'Required', 'storeengine' ) }
					>
						*
					</abbr>
				</label>
				<PostTitle
					id="webhook-title"
					name="title"
					label={ __( 'Add hooks title here', 'storeengine' ) }
					defaultValue={ values.title }
					saveValueHandler={ setFieldValue }
				/>
			</div>

			<div className="storeengine-hook-form--event mb-6">
				<div className="flex flex-col">
					<label
						htmlFor="webhook-events"
						className="text-sm font-medium text-se-text mb-2"
					>
						{ __( 'Events Type', 'storeengine' ) }
						<abbr
							className="text-se-error no-underline"
							title={ __( 'Required', 'storeengine' ) }
						>
							*
						</abbr>
					</label>
				</div>
				<Select
					id="webhook-events"
					placeholder={ __( 'Select Event', 'storeengine' ) }
					options={ webhookEvents }
					// Resolve current selection against the flattened option
					// list so it works whether `webhookEvents` is the grouped
					// shape (PHP >= 1.10) or the legacy flat array.
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
					isMulti={ true }
					required={ true }
					className='storeengine-select storeengine-select--full'
					classNamePrefix='storeengine-react-select'
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
			<div className="storeengine-hook-form__flex-item mb-6 flex justify-between">
				<div className="flex flex-col">
					<label
						htmlFor="webhook-status"
						className="text-sm font-medium text-se-text"
					>
						{ __( 'Status', 'storeengine' ) }
						<abbr
							className="text-se-error no-underline"
							title={ __( 'Required', 'storeengine' ) }
						>
							*
						</abbr>
					</label>
					<span className="text-xs text-se-subtitle">
						{ __(
							'Only publish webhooks will trigger selected events.',
							'storeengine'
						) }
					</span>
				</div>
				<div className="flex flex-col gap-2">
					<Select
						id="webhook-status"
						options={ webhookStatus }
						value={ webhookStatus.find(
							( item ) => item.value === values.status
						) }
						onChange={ ( option ) =>
							setFieldValue( 'status', option.value )
						}
						isMulti={ false }
						required={ true }
						className='storeengine-select storeengine-select--full'
						classNamePrefix='storeengine-react-select'
					/>
				</div>
			</div>
			<div className="storeengine-hook-form__secret">
				<Text
					title={ __( 'Secret (optional)', 'storeengine' ) }
					name="meta._storeengine_webhook_secret"
					placeholder={ __( 'Add secret here', 'storeengine' ) }
					defaultValue={ values?.meta?._storeengine_webhook_secret }
					saveValueHandler={ setFieldValue }
				/>
			</div>
		</Scope>
	);
};

export default HooksFormInner;
