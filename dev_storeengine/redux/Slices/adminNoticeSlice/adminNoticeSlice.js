import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { makeRequest2 } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

export const removeAdminNotice = createAsyncThunk(
	'storeengine/removeAdminNotice',
	async ( notice, thunkAPI ) => {
		try {
			await makeRequest2( 'hide-notice', { notice } );
			return notice;
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'success',
				} )
			);
		}
	}
);

const adminNoticeSlice = createSlice( {
	name: 'adminNotice',
	initialState: {
		notices: [ ...( window?.StoreEngineGlobal?.admin_notices || [] ) ],
	},
	reducers: {
		addAdminNotices: ( state, { payload } ) => {
			state.notices = [ ...payload ];
		},
	},
	extraReducers: ( builder ) => {
		builder.addCase(
			removeAdminNotice.fulfilled,
			( state, { payload } ) => {
				state.notices = state.notices.filter(
					( item ) => item.key !== payload
				);
			}
		);
	},
} );

export default adminNoticeSlice.reducer;
export const { addAdminNotices } = adminNoticeSlice.actions;
