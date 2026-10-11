import React, { useState } from 'react';
import { makeRequest } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { Scope, Button } from '@Components/ui';
import PropTypes from 'prop-types';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';

const propTypes = {
	emplateName: PropTypes.string,
	templateSubName: PropTypes.string,
	disabled: PropTypes.bool,
};

export default function TestMail( { templateName, templateSubName, disabled = false } ) {
	const [ isLoading, setLoading ] = useState( false );
	const dispatch = useDispatch();
	const sendTestMailHandler = () => {
		setLoading( true );
		makeRequest(
			'test_email',
			{
				templateName,
				templateSubName,
			},
			false,
			'_email'
		).then( ( res ) => {
			setLoading( false );
			if ( res.data.success ) {
				dispatch(
					showNotification( {
						message: res.data?.data,
						isShow: true,
						type: 'success',
					} )
				);
			} else {
				dispatch(
					showNotification( {
						message: res.data?.data,
						isShow: true,
						type: 'error',
					} )
				);
			}
		} );
	};

	return (
		<Scope as="span">
			<Button
				preset="soft"
				size="sm"
				isLoading={ isLoading }
				disabled={ disabled }
				icon="storeengine-icon--email"
				onClick={ sendTestMailHandler }
			>
				{ __( 'Send Test Mail', 'storeengine' ) }
			</Button>
		</Scope>
	);
}

TestMail.propTypes = propTypes;
