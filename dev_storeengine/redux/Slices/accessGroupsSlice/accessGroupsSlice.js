import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
	namespace,
	API,
	is_admin,
	current_user_can,
	current_user_id,
	resourceRequestContext,
} from '@Utils/helper';
import { __ } from '@wordpress/i18n';
import { showNotification } from '../notificationSlice/notificationSlice';

export const fetchAllAccessGroups = createAsyncThunk(
	'storeengine/fetchAllAccessGroups',
	async (
		{ status = 'all', page = 1, per_page = 10, search = '' },
		thunkAPI
	) => {
		let params = {
			status: status === 'all' ? 'any' : status,
			page,
			per_page,
			context: resourceRequestContext( 'memberships' ),
		};
		if ( ! is_admin || current_user_can.manage_options === false ) {
			params = { ...params, author: current_user_id };
		}

		if ( search ) {
			params = { ...params, search };
		}

		try {
			const response = await API.get(
				`${ namespace }storeengine_groups`,
				{
					params,
				}
			);
			return {
				data: response.data,
				totalItems: parseInt( response.headers[ 'x-wp-total' ] ),
				rowsPerPage: per_page,
				page,
				status,
				search,
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

export const createNewAccessGroup = createAsyncThunk(
	'storeengine/createNewAccessGroup',
	async ( formData, thunkAPI ) => {
		try {
			const response = await API.post(
				namespace + 'storeengine_groups',
				formData
			);
			if ( response.status === 201 ) {
				thunkAPI.dispatch(
					showNotification( {
						message: __(
							'Access Group Created Successfully',
							'storeengine'
						),
						isShow: true,
						type: 'success',
					} )
				);
				return response.data;
			}
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

export const updateAccessGroup = createAsyncThunk(
	'storeengine/updateAccessGroup',
	async ( formData, thunkAPI ) => {
		try {
			const response = await API.post(
				`${ namespace }storeengine_groups/${ parseInt( formData.id ) }`,
				{ ...formData.values }
			);
			if ( response.status === 200 ) {
				thunkAPI.dispatch(
					showNotification( {
						message: __(
							'Access Group updated Successfully',
							'storeengine'
						),
						isShow: true,
						type: 'success',
					} )
				);
				return response.data;
			}
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

export const getAccessGroup = createAsyncThunk(
	'storeengine/getAccessGroup',
	async ( ID, thunkAPI ) => {
		try {
			const response = await API.get(
				`${ namespace }storeengine_groups/${ parseInt( ID ) }`,
				{ params: { context: resourceRequestContext( 'memberships' ) } }
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

export const moveAccessGroupsToTrash = createAsyncThunk(
	'storeengine/moveAccessGroupsToTrash',
	async ( ID, thunkAPI ) => {
		try {
			const response = await API.post(
				`${ namespace }storeengine_groups/${ parseInt( ID ) }`,
				{ force: false },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Moved to trash!', 'storeengine' ),
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

export const restoreAccessGroups = createAsyncThunk(
	'storeengine/restoreAccessGroups',
	async ( formData, thunkAPI ) => {
		const updatedFormData = { ...formData };
		try {
			const response = await API.post(
				`${ namespace }storeengine_groups/${ parseInt( formData.ID ) }`,
				updatedFormData
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Group Restored!', 'storeengine' ),
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

export const deleteAccessGroup = createAsyncThunk(
	'storeengine/deleteAccessGroup',
	async ( { ID }, thunkAPI ) => {
		try {
			const response = await API.post(
				`${ namespace }storeengine_groups/${ parseInt( ID ) }`,
				{ force: true },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Group Deleted!', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return response.data.previous.id;
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

const accessGroupsSlice = createSlice( {
	name: 'accessGroups',
	initialState: {
		data: [],
		page: 1,
		rowsPerPage: 10,
		status: 'all',
		search: '',
		loading: false,
	},
	extraReducers: ( builder ) => {
		builder
			// create access groups
			.addCase( fetchAllAccessGroups.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( fetchAllAccessGroups.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = action.payload.data;
				state.totalItems = action.payload.totalItems;
				state.rowsPerPage = action.payload.rowsPerPage;
				state.page = action.payload.page;
				state.status = action.payload.status;
				state.search = action.payload.search;
			} )
			.addCase( fetchAllAccessGroups.rejected, ( state ) => {
				state.loading = false;
			} )
			// create access groups
			.addCase( createNewAccessGroup.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( createNewAccessGroup.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = [ action.payload, ...state.data ];
			} )
			.addCase( createNewAccessGroup.rejected, ( state ) => {
				state.loading = false;
			} )
			.addCase( updateAccessGroup.fulfilled, ( state, action ) => {
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
			// get access groups
			.addCase( getAccessGroup.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( getAccessGroup.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload ) {
					return;
				}
				/** Should not use map. If we use map then initial reload the data will not display, cause state.data is an empty array */
				// state.data = state.data.map((item) => {
				//   if (parseInt(item.id) === parseInt(action.payload.id)) {
				//     return action.payload;
				//   }
				//   return item;
				// });
				state.data = [ action.payload ];
			} )
			.addCase( getAccessGroup.rejected, ( state ) => {
				state.loading = false;
			} )
			// move access groups trash
			.addCase( moveAccessGroupsToTrash.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( moveAccessGroupsToTrash.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item.id ) === parseInt( action.payload.id )
					) {
						return { ...item, status: 'trash' };
					}
					return item;
				} );
			} )
			.addCase( moveAccessGroupsToTrash.rejected, ( state ) => {
				state.loading = false;
			} )
			// restore access groups
			.addCase( restoreAccessGroups.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( restoreAccessGroups.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item.id ) === parseInt( action.payload.id )
					) {
						return { ...item, status: 'draft' };
					}
					return item;
				} );
			} )
			.addCase( restoreAccessGroups.rejected, ( state ) => {
				state.loading = false;
			} )
			// delete access groups
			.addCase( deleteAccessGroup.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( deleteAccessGroup.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.filter(
					( item ) => item.id !== action.payload
				);
			} )
			.addCase( deleteAccessGroup.rejected, ( state ) => {
				state.loading = false;
			} );
	},
} );

export default accessGroupsSlice.reducer;
