import { __ } from '@wordpress/i18n';

export const getInitialValues = ( id = null, data ) => {
	data = data?.find( ( item ) => parseInt( item?.id ) === parseInt( id ) );
	const schema = {
		title: '',
		status: 'publish',
		prices: [],
		meta: {
			_storeengine_membership_features: [],
			_storeengine_membership_content_protect_types: {
				rules: [],
				specifics: [],
			},
			_storeengine_membership_content_protect_excluded_items: [],
			_storeengine_membership_authorization: {
				type: 'onetime',
				redirect_url: '',
				message: __( 'This content is restricted', 'storeengine' ),
				btn_text: __( 'Read more', 'storeengine' ),
				btn_url: '',
				is_enable_login_btn: false,
			},
			_storeengine_membership_user_roles: [],
			_storeengine_membership_priority: '',
			_storeengine_membership_expiration: {
				is_enable_expiration: false,
				date_type: '',
				fixed_date_duration: 0,
				specific_date: '',
			},
			_storeengine_membership_attachments: [],
			_storeengine_membership_drip_contents: [
				{ post_id: '', specific_date: '' },
			],
			_storeengine_membership_purchase_redirect_type: 'default',
			_storeengine_membership_purchase_redirect_url: '',
		},
	};

	if ( id && data ) {
		const { title, status, prices, meta } = data;

		return {
			id,
			title: title?.rendered,
			status,
			prices,
			meta: {
				_storeengine_membership_features:
					meta?._storeengine_membership_features || [],
				_storeengine_membership_content_protect_types:
					meta?._storeengine_membership_content_protect_types,
				_storeengine_membership_content_protect_excluded_items:
					meta?._storeengine_membership_content_protect_excluded_items,
				_storeengine_membership_authorization:
					meta?._storeengine_membership_authorization,
				_storeengine_membership_user_roles:
					meta?._storeengine_membership_user_roles,
				_storeengine_membership_priority:
					meta?._storeengine_membership_priority,
				_storeengine_membership_expiration:
					meta?._storeengine_membership_expiration,
				_storeengine_membership_attachments:
					meta?._storeengine_membership_attachments,
				_storeengine_membership_drip_contents:
					meta?._storeengine_membership_drip_contents,
				_storeengine_membership_purchase_redirect_type:
					meta?._storeengine_membership_purchase_redirect_type,
				_storeengine_membership_purchase_redirect_url:
					meta?._storeengine_membership_purchase_redirect_url,
			},
		};
	}
	return schema;
};
