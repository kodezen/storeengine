import { current_user_id } from '@Utils/helper';
import { __ } from '@wordpress/i18n';

// Re-export the per-type option sources so the unified form has a single import.
export {
	webhookEvents,
	webhookEventsFlat,
	webhookStatus,
	formatEventLabel,
} from '../HooksModal/helper';
export {
	actionOptions,
	authTypes,
	incomingStatus,
	getActionDescription,
} from '../../IncomingWebhooks/HooksModal/helper';

export const webhookTypes = [
	{ label: __( 'Outgoing', 'storeengine' ), value: 'outgoing' },
	{ label: __( 'Incoming', 'storeengine' ), value: 'incoming' },
];

/**
 * Combined initial values for the unified create/edit form. Holds both the
 * outgoing and incoming meta fields plus a `__type` discriminator (UI-only,
 * stripped before the request). Defaults to outgoing.
 *
 * @param {string} type Initial webhook type ('outgoing' | 'incoming').
 * @param {Object|null} data Existing webhook being edited, or null to create.
 */
export const getInitialValues = ( type = 'outgoing', data = null ) => {
	const base = {
		__type: type,
		title: '',
		author: current_user_id,
		status: 'publish',
		meta: {
			// Outgoing.
			_storeengine_webhook_delivery_url: '',
			_storeengine_webhook_secret: '',
			_storeengine_webhook_events: [],
			// Incoming.
			_storeengine_incoming_action: 'automation',
			_storeengine_incoming_auth_type: 'hmac',
			_storeengine_incoming_secret: '',
			_storeengine_incoming_endpoint_key: '',
		},
	};

	if ( ! data ) {
		return base;
	}

	const meta = data.meta || {};

	return {
		...base,
		__type: type,
		title: data.title?.raw ?? row.title?.rendered ?? '',
		author: data.author,
		status: data.status,
		meta: {
			...base.meta,
			_storeengine_webhook_delivery_url:
				meta._storeengine_webhook_delivery_url || '',
			_storeengine_webhook_secret: meta._storeengine_webhook_secret || '',
			_storeengine_webhook_events: meta._storeengine_webhook_events || [],
			_storeengine_incoming_action:
				meta._storeengine_incoming_action || 'automation',
			_storeengine_incoming_auth_type:
				meta._storeengine_incoming_auth_type || 'hmac',
			_storeengine_incoming_secret:
				meta._storeengine_incoming_secret || '',
			_storeengine_incoming_endpoint_key:
				meta._storeengine_incoming_endpoint_key || '',
		},
	};
};
