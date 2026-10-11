import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
	API,
	current_user_can,
	current_user_id,
	namespace,
	is_admin,
	makeRequest,
	makeRequest2,
} from '@Utils/helper';
import { __ } from '@wordpress/i18n';
import { showNotification } from '../notificationSlice/notificationSlice';

export const createNewAffiliate = createAsyncThunk(
	'storeengine/createNewAffiliate',
	async ( formData, thunkAPI ) => {
		try {
			const data = await makeRequest2( 'add_an_affiliate', {
				...formData,
			} );
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

export const addNewAffiliate = createAsyncThunk(
	'storeengine/addNewAffiliate',
	async ( id, thunkAPI ) => {
		try {
			const data = await makeRequest2( 'add_an_affiliate_by_id', {
				user_id: id,
			} );
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

export const getAffiliate = createAsyncThunk(
	'storeengine/getAffiliate',
	async ( ID, thunkAPI ) => {
		try {
			const response = await API.get(
				`${ namespace }storeengine_product/${ parseInt( ID ) }`
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

export const updateAffiliate = createAsyncThunk(
	'storeengine/updateAffiliate',
	async ( { id, status }, thunkAPI ) => {
		try {
			await makeRequest2( 'update_an_affiliates_status', {
				affiliate_id: id,
				status,
			} );
			thunkAPI.dispatch(
				showNotification( {
					message: __(
						'Affiliate Status Updated Successfully',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
			return { id, status };
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

export const deleteAffiliate = createAsyncThunk(
	'storeengine/deleteAffiliate',
	async ( { ID }, thunkAPI ) => {
		try {
			const response = await API.delete(
				`${ namespace }storeengine_product/${ parseInt( ID ) }`
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Affiliate deleted', 'storeengine' ),
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

export const restoreAffiliate = createAsyncThunk(
	'storeengine/restoreAffiliate',
	async ( formData, thunkAPI ) => {
		const updatedFormData = {
			...formData,
			product_content: formData?.product_content?.raw ?? '',
		};

		try {
			const response = await API.post(
				`${ namespace }storeengine_product/${ parseInt(
					formData.ID
				) }`,
				updatedFormData
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Affiliate restored', 'storeengine' ),
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

export const fetchAllAffiliates = createAsyncThunk(
	'storeengine/fetchAllAffiliates',
	async (
		{ status = 'all', page = 1, per_page = 10, search = '' },
		thunkAPI
	) => {
		let params = {
			status: status === 'all' ? 'any' : status,
			page,
			per_page,
			context: 'edit',
		};
		if ( ! is_admin || current_user_can.manage_options === false ) {
			params = { ...params, author: current_user_id };
		}

		if ( search ) {
			params = { ...params, search };
		}
		try {
			const response = await makeRequest( 'get_all_affiliates', {
				...params,
			} );
			return {
				data: response.data.data,
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

const affiliatesSlice = createSlice( {
	name: 'affiliates',
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
			// create an affiliate
			.addCase( fetchAllAffiliates.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( fetchAllAffiliates.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = action.payload.data;
				state.totalItems = action.payload.totalItems;
				state.rowsPerPage = action.payload.rowsPerPage;
				state.page = action.payload.page;
				state.status = action.payload.status;
				state.search = action.payload.search;
			} )
			.addCase( fetchAllAffiliates.rejected, ( state ) => {
				state.loading = false;
			} )
			// create an affiliate
			.addCase( createNewAffiliate.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( createNewAffiliate.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload ) {
				} else {
					state.data = [ action.payload, ...state.data ];
				}
			} )
			.addCase( createNewAffiliate.rejected, ( state ) => {
				state.loading = false;
			} )
			// add new affiliates
			.addCase( addNewAffiliate.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( addNewAffiliate.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload ) {
				} else {
					state.data = [ action.payload, ...state.data ];
				}
			} )
			.addCase( addNewAffiliate.rejected, ( state ) => {
				state.loading = false;
			} )
			// get affiliate
			.addCase( getAffiliate.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( getAffiliate.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload ) {
					return;
				}
				state.data = [ action.payload ];
			} )
			.addCase( getAffiliate.rejected, ( state ) => {
				state.loading = false;
			} )
			// update affiliate
			.addCase( updateAffiliate.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( updateAffiliate.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item.affiliate_id ) ===
						parseInt( action.payload.id )
					) {
						return { ...item, status: action.payload.status };
					}
					return item;
				} );
			} )
			.addCase( updateAffiliate.rejected, ( state ) => {
				state.loading = false;
			} )
			// delete affiliate
			.addCase( deleteAffiliate.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( deleteAffiliate.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = [
					...state.data.filter(
						( item ) =>
							parseInt( item.affiliate_id ) !==
							parseInt( action.payload.affiliate_id )
					),
				];
			} )
			.addCase( deleteAffiliate.rejected, ( state ) => {
				state.loading = false;
			} )
			// restore affiliate
			.addCase( restoreAffiliate.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( restoreAffiliate.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = [
					...state.data.map( ( item ) => {
						if (
							parseInt( item.affiliate_id ) ===
							parseInt( action.payload.affiliate_id )
						) {
							return {
								...item,
								...action.payload,
							};
						}
						return item;
					} ),
				];
			} )
			.addCase( restoreAffiliate.rejected, ( state ) => {
				state.loading = false;
			} );
	},
} );

export default affiliatesSlice.reducer;
