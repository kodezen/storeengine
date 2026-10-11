import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { makeRequest2 } from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';

export const fetchAllUser = createAsyncThunk(
	'storeengine/fetchAllUser',
	async ( thunkAPI ) => {
		try {
			const data = await makeRequest2( 'get_all_users' );
			return data;
		} catch ( error ) {
			thunkAPI.dispatch(
				showNotification( {
					message: error?.response?.data?.message ?? error?.message,
					isShow: true,
					type: 'error',
				} )
			);
		}
	}
);

const userSlice = createSlice( {
	name: 'user',
	initialState: {
		data: [],
	},
	extraReducers: ( builder ) => {
		builder
			// fetch user
			.addCase( fetchAllUser.fulfilled, ( state, action ) => {
				state.data = action.payload;
			} );
	},
} );

export default userSlice.reducer;
