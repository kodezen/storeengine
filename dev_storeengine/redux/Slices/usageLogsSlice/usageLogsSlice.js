import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { __ } from '@wordpress/i18n';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';

export const getUsageLog = createAsyncThunk(
	'storeengine/getUsageLog',
	async ( ID, thunkAPI ) => {
		try {
			const { data } = await API.get(
				`${ namespace }usage-logs/${ ID }`,
				{
					params: { context: 'edit' },
				}
			);

			return data;
		} catch ( error ) {
			thunkAPI.dispatch(
				showNotification( {
					message: error,
					isShow: true,
					type: 'error',
				} )
			);
		}
	}
);

export const deleteUsageLog = createAsyncThunk(
	'storeengine/deleteUsageLog',
	async ( ID, thunkAPI ) => {
		try {
			await API.delete( `${ namespace }usage-logs/${ ID }` );

			thunkAPI.dispatch(
				showNotification( {
					message: __(
						'Usage Log successfully deleted!',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
			return ID;
		} catch ( error ) {
			thunkAPI.dispatch(
				showNotification( {
					message: error,
					isShow: true,
					type: 'error',
				} )
			);
		}
	}
);

export const fetchAllUsageLogs = createAsyncThunk(
	'storeengine/fetchAllUsageLogs',
	async ( { page = 1, per_page = 10, search = '' }, thunkAPI ) => {
		try {
			const params = { page, per_page, context: 'edit' };

			if ( search ) {
				params.search = search;
			}

			const res = await API.get( `${ namespace }usage-logs`, {
				params,
			} );
			return {
				data: res.data,
				rowsPerPage: per_page,
				page,
				search,
				totalItems: res.headers.get( 'X-WP-TOTAL', parseInt ),
			};
		} catch ( error ) {
			thunkAPI.dispatch(
				showNotification( {
					message: error,
					isShow: true,
					type: 'error',
				} )
			);
		}
	}
);

const usageLogsSlice = createSlice( {
	name: 'usageLogs',
	initialState: {
		data: [],
		rowsPerPage: 10,
		page: 1,
		status: 'all',
		license: null,
		search: '',
		totalItems: 0,
	},
	reducers: {},
	extraReducers: ( builder ) => {
		builder
			.addCase( fetchAllUsageLogs.fulfilled, ( state, action ) => {
				state.data = action.payload.data;
				state.rowsPerPage = action.payload.rowsPerPage;
				state.page = action.payload.page;
				state.status = action.payload.status;
				state.search = action.payload.search;
				state.totalItems = action.payload.totalItems;
			} )
			.addCase( getUsageLog.fulfilled, ( state, action ) => {
				if ( ! action.payload ) {
					return;
				}
				if ( state.data.length ) {
					if (
						state.data.find(
							( log ) => log.id === action.payload.id
						)
					) {
						state.data = state.data.map( ( log ) => {
							if ( log.id === action.payload.id ) {
								return action.payload;
							}
							return log;
						} );
						return;
					}
					state.data = [ action.payload, ...state.data ];
					return;
				}

				state.data = [ action.payload ];
			} )
			.addCase( deleteUsageLog.fulfilled, ( state, action ) => {
				state.data = state.data.filter(
					( item ) =>
						parseInt( item.id ) !== parseInt( action.payload )
				);
				if ( state.totalItems ) {
					state.totalItems -= 1;
				}
			} );
	},
} );

export default usageLogsSlice.reducer;
