import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { addons, makeRequest2 } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

export const fetchAddons = createAsyncThunk(
	'storeengine/fetchAddons',
	async ( thunkAPI ) => {
		try {
			return await makeRequest2( 'get_all_addons' );
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( { message: e, isShow: true, type: 'error' } )
			);
		}
	}
);

export const saveAddon = createAsyncThunk(
	'storeengine/saveAddon',
	async ( addon, thunkAPI ) => {
		try {
			return await makeRequest2( 'saved_addon_status', addon );
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( { message: e, isShow: true, type: 'error' } )
			);
		}
	}
);

const addonSlice = createSlice( {
	name: 'addons',
	initialState: addons,
	extraReducers: ( builder ) => {
		builder
			.addCase(
				fetchAddons.fulfilled,
				( state, action ) => action.payload
			)
			.addCase(
				saveAddon.fulfilled,
				( state, action ) => action.payload
			);
	},
} );

export default addonSlice.reducer;
