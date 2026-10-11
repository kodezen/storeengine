import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { makeRequest2 } from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';

export const getStoreEngineStatus = createAsyncThunk(
	'storeengine/getStoreEngineStatus',
	async ( thunkAPI ) => {
		try {
			return await makeRequest2( 'fetch_storeengine_status' );
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

export const getStoreEnginePages = createAsyncThunk(
	'storeengine/getStoreEnginePages',
	async ( thunkAPI ) => {
		try {
			return await makeRequest2( 'fetch_storeengine_pages' );
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

const toolsSlice = createSlice( {
	name: 'tools',
	initialState: {
		status: false,
		pages: false,
		loading: true,
	},
	extraReducers: ( builder ) => {
		builder
			// fetch status
			.addCase( getStoreEngineStatus.fulfilled, ( state, action ) => {
				state.loading = false;
				state.status = action.payload;
			} )
			// fetch pages
			.addCase( getStoreEnginePages.fulfilled, ( state, action ) => {
				state.loading = false;
				state.pages = action.payload;
			} );
	},
} );

export default toolsSlice.reducer;
