import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';
import { __ } from '@wordpress/i18n';

// Brands are a flat product taxonomy (storeengine_product_brand) backed by the
// core WP_REST_Terms_Controller, so CRUD mirrors categorySlice — minus the
// parent/hierarchy handling. The brand logo + banner ride along in `meta`.

export const fetchAllBrands = createAsyncThunk(
	'storeengine/fetchAllBrands',
	async ( { status = 'all', page = 1, perPage = 10, search = '' }, thunkAPI ) => {
		try {
			let params = {
				status: status === 'all' ? 'any' : status,
				page,
				per_page: perPage,
			};
			if ( search ) {
				params = { ...params, search };
			}

			const res = await API.get( namespace + 'storeengine_product_brand', {
				params,
			} );
			return {
				data: res.data,
				totalItems: parseInt( res.headers[ 'x-wp-total' ] ),
				rowsPerPage: perPage,
				page,
				status,
				search,
			};
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( { message: e, isShow: true, type: 'error' } )
			);
		}
	}
);

export const createNewBrand = createAsyncThunk(
	'storeengine/createNewBrand',
	async ( data, thunkAPI ) => {
		try {
			const res = await API.post(
				namespace + 'storeengine_product_brand',
				data
			);
			return res?.data;
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( { message: e, isShow: true, type: 'error' } )
			);
		}
	}
);

export const updateBrand = createAsyncThunk(
	'storeengine/updateBrand',
	async ( data, thunkAPI ) => {
		try {
			const res = await API.post(
				namespace + 'storeengine_product_brand/' + parseInt( data.id ),
				data
			);
			return res?.data;
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( { message: e, isShow: true, type: 'error' } )
			);
		}
	}
);

export const deleteBrand = createAsyncThunk(
	'storeengine/deleteBrand',
	async ( ID, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }storeengine_product_brand/${ parseInt( ID ) }`,
				{ force: true },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Brand Deleted!', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res?.data?.previous;
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( { message: e, isShow: true, type: 'error' } )
			);
		}
	}
);

const brandSlice = createSlice( {
	name: 'brands',
	initialState: {
		data: [],
		totalItems: 0,
		rowsPerPage: 10,
		currentPage: 1,
		status: 'all',
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
			.addCase( fetchAllBrands.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( fetchAllBrands.rejected, ( state ) => {
				state.loading = false;
			} )
			.addCase( fetchAllBrands.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = action.payload.data;
				state.totalItems = action.payload.totalItems;
				state.rowsPerPage = action.payload.rowsPerPage;
				state.currentPage = action.payload.page;
				state.status = action.payload.status;
				state.search = action.payload.search;
			} )

			.addCase( createNewBrand.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = [ action.payload, ...state.data ];
			} )

			.addCase( updateBrand.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.map( ( item ) => {
					if ( parseInt( item.id ) === parseInt( action.payload.id ) ) {
						return { ...item, ...action.payload };
					}
					return item;
				} );
			} )

			.addCase( deleteBrand.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.filter(
					( item ) =>
						parseInt( item.id ) !== parseInt( action.payload.id )
				);
			} );
	},
} );

export const { updateCurrentPage, updateItemPerPage } = brandSlice.actions;
export default brandSlice.reducer;
