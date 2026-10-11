import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';
import { __ } from '@wordpress/i18n';

export const fetchAllTags = createAsyncThunk(
	'storeengine/fetchAllTags',
	async ( { search = '', page = 1, perPage = 10 }, thunkAPI ) => {
		try {
			let params = { page, per_page: perPage };
			if ( search ) {
				params = { ...params, search };
			}

			const res = await API.get( namespace + 'storeengine_product_tag', {
				params,
			} );
			return {
				data: res.data,
				totalItems: parseInt( res.headers[ 'x-wp-total' ] ),
				rowsPerPage: perPage,
				page,
				search,
			};
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( {
					message: e?.response?.data?.message ?? e?.message,
					isShow: true,
					type: 'error',
				} )
			);
		}
	}
);

export const createNewTags = createAsyncThunk(
	'storeengine/createNewTags',
	async ( data, thunkAPI ) => {
		try {
			const res = await API.post(
				namespace + 'storeengine_product_tag',
				data
			);
			return res.data;
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'error',
				} )
			);
		}
	}
);

export const updateTag = createAsyncThunk(
	'storeengine/updateTag',
	async ( data, thunkAPI ) => {
		try {
			const res = await API.post(
				namespace + 'storeengine_product_tag/' + parseInt( data.id ),
				data
			);
			return res.data;
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'error',
				} )
			);
		}
	}
);

export const deleteTag = createAsyncThunk(
	'storeengine/deleteTag',
	async ( ID, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }storeengine_product_tag/${ parseInt( ID ) }`,
				{ force: true },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Tag Deleted!', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data.previous;
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'error',
				} )
			);
		}
	}
);

const tagSlice = createSlice( {
	name: 'tags',
	initialState: {
		data: [],
		totalItems: 0,
		rowsPerPage: 10,
		currentPage: 1,
		search: '',
		loading: true,
	},
	reducers: {
		updateCurrentPage: ( state, action ) => {
			state.currentPage = action.payload;
		},
		updateItemPerPage: ( state, action ) => {
			state.rowsPerPage = action.payload;
		},
	},
	extraReducers: ( builder ) => {
		builder
			.addCase( fetchAllTags.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( fetchAllTags.rejected, ( state ) => {
				state.loading = false;
			} )
			.addCase( fetchAllTags.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = action.payload.data;
				state.totalItems = action.payload.totalItems;
				state.rowsPerPage = action.payload.rowsPerPage;
				state.currentPage = action.payload.page;
				state.search = action.payload.search;
			} )

			.addCase( createNewTags.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = [ action.payload, ...state.data ];
			} )

			.addCase( updateTag.fulfilled, ( state, action ) => {
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

			.addCase( deleteTag.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.filter(
					( item ) =>
						parseInt( item.id ) !== parseInt( action.payload.id )
				);
			} );
	},
} );

export const { updateCurrentPage, updateItemPerPage } = tagSlice.actions;
export default tagSlice.reducer;
