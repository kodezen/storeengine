import React from 'react';
import Notice from '@Components/Notice';
import { removeAdminNotice } from '@Redux/Slices/adminNoticeSlice/adminNoticeSlice';
import { useSelector, useDispatch } from 'react-redux';

import './styles.scss';

const AdminNotices = () => {
	const adminNotices = useSelector( ( state ) => state.adminNotice.notices );
	const dispatch = useDispatch();

	return adminNotices.map( ( notice, index ) => {
		return (
			<Notice
				key={ index }
				notice={ notice }
				onDismiss={ ( key ) => dispatch( removeAdminNotice( key ) ) }
			/>
		);
	} );
};

export default AdminNotices;
