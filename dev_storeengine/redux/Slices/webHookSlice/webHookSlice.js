import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
	API,
	current_user_can,
	current_user_id,
	namespace,
	is_admin,
} from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';
import { __ } from '@wordpress/i18n';

export const createNewHooks = createAsyncThunk(
	'storeengine/createNewHooks',
	async ( formData, thunkAPI ) => {
		try {
			const response = await API.post( namespace + 'webhook', formData );
			thunkAPI.dispatch(
				showNotification( {
					message: __(
						`WebHook Successfully Created.`,
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
			return response.data;
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

export const getHooks = createAsyncThunk(
	'storeengine/getHooks',
	async ( ID, thunkAPI ) => {
		try {
			const response = await API.get(
				`${ namespace }webhook/${ parseInt( ID ) }`,
				{ params: { context: 'edit' } }
			);
			return response.data;
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

export const updateHooks = createAsyncThunk(
	'storeengine/updateHooks',
	async ( { id, formData }, thunkAPI ) => {
		try {
			const response = await API.post(
				`${ namespace }webhook/${ parseInt( id ) }`,
				formData
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'WebHook Updated', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return response.data;
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

export const updateHooksStatus = createAsyncThunk(
	'storeengine/updateHooksStatus',
	async ( formData, thunkAPI ) => {
		try {
			const response = await API.post(
				`${ namespace }webhook/${ parseInt( formData.id ) }`,
				formData
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'WebHook Status Updated', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return response.data;
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

export const deleteHooks = createAsyncThunk(
	'storeengine/deleteHooks',
	async ( params, thunkAPI ) => {
		try {
			const response = await API.post(
				`${ namespace }webhook/${ parseInt( params.ID ) }`,
				{ force: true },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __(
						'WebHook Permanently Deleted!',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
			return response.data.previous;
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

export const moveHooksToTrash = createAsyncThunk(
	'storeengine/moveHooksToTrash',
	async ( params, thunkAPI ) => {
		try {
			const response = await API.post(
				`${ namespace }webhook/${ parseInt( params.id ) }`,
				{ force: false },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'WebHook Trashed!', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return response.data;
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

export const fetchAllHooks = createAsyncThunk(
	'storeengine/fetchAllHooks',
	async (
		{ status = 'all', page = 1, per_page = 10, search = '' },
		thunkAPI
	) => {
		try {
			const params = {
				status: status === 'all' ? 'any' : status,
				page,
				per_page,
				context: 'edit',
			};

			if ( ! is_admin || current_user_can.manage_options === false ) {
				params.author = current_user_id;
			}

			if ( search ) {
				params.search = search;
			}

			const response = await API.get( namespace + 'webhook', { params } );
			return {
				data: response.data,
				totalItems: parseInt( response.headers[ 'x-wp-total' ] ),
			};
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

export const restoreHooks = createAsyncThunk(
	'storeengine/restoreHooks',
	async ( formData, thunkAPI ) => {
		try {
			const updatedFormData = { ...formData, status: 'publish' };
			const response = await API.post(
				`${ namespace }webhook/${ parseInt( formData.id ) }`,
				updatedFormData
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( `WebHook Restored!`, 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return response.data;
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

const webHooksSlice = createSlice( {
	name: 'webHooks',
	initialState: {
		data: [],
		status: 'all',
		page: 1,
		itemsPerPage: 10,
		loading: false,
	},
	reducers: {
		updateHooksCurrentPage: ( state, actions ) => {
			state.currentPage = actions.payload;
		},
		updateHooksItemPerPage: ( state, actions ) => {
			state.itemsPerPage = actions.payload;
		},
	},
	extraReducers: ( builder ) => {
		builder
			.addCase( fetchAllHooks.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = action.payload.data;
				state.totalItems = action.payload.totalItems;
			} )
			.addCase( createNewHooks.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = [ action.payload, ...state.data ];
			} )
			.addCase( getHooks.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload ) {
					return;
				}
				state.data = [ action.payload ];
			} )
			.addCase( updateHooks.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item.id ) === parseInt( action.payload.id )
					) {
						return { ...item, ...action.payload };
					}
					return item;
				} );
			} )
			.addCase( updateHooksStatus.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item.id ) === parseInt( action.payload.id )
					) {
						return { ...item, ...action.payload };
					}
					return item;
				} );
			} )
			.addCase( deleteHooks.fulfilled, ( state, action ) => {
				state.data = [
					...state.data.filter(
						( item ) =>
							parseInt( item.id ) !==
							parseInt( action.payload.id )
					),
				];
			} );
		// .addCase(moveHooksToTrash.fulfilled, (state, action) => { //todo: test this reducer
		//   state.loading = false;
		//   state.data = [
		//     ...state.data.filter(
		//       (item) => parseInt(item.id) !== parseInt(action.payload.id),
		//     ),
		//   ]
		// })
		// .addCase(restoreHooks.fulfilled, (state, action) => { //todo: test this reducer
		//   state.loading = false;
		//   state.data = [
		//     ...state.data.filter(
		//       (item) => parseInt(item.id) !== parseInt(action.payload.id),
		//     ),
		//   ]
		// })
	},
} );

export const { updateHooksCurrentPage, updateHooksItemPerPage } =
	webHooksSlice.actions;
export default webHooksSlice.reducer;
