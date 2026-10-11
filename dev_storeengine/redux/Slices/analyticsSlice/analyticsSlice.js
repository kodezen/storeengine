import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API, makeRequest2, namespace } from '@Utils/helper';
import { __ } from '@wordpress/i18n';
import { gmdate } from '@wordpress/date';
import { showNotification } from '../notificationSlice/notificationSlice';

export const getAnalytics = createAsyncThunk(
	'storeengine/getAnalytics',
	async ( { from, to, compare, currency }, thunkAPI ) => {
		try {
			const params = { context: 'view', from, to, compare };
			if ( currency ) {
				params.currency = currency;
			}
			const { data } = await API.get( `${ namespace }analytics`, {
				params,
			} );
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
		// try {
		// 	const response = await API.get(`${namespace}analytics`, {
		// 		params: {
		// 			context: 'edit',
		// 			start_date: gmdate('Y-m-d H:i', start),
		// 			end_date: gmdate('Y-m-d H:i', end),
		// 		},
		// 	});
		// 	return response.data;
		// } catch (error) {
		// 	thunkAPI.dispatch(
		// 		showNotification({
		// 			message: error?.response?.data?.message ?? error?.message,
		// 			isShow: true,
		// 			type: 'error',
		// 		})
		// 	);
		// }
	}
);

export const getProductAnalytics = createAsyncThunk(
	'storeengine/getProductAnalytics',
	async ( { id, from, to, compare, currency }, thunkAPI ) => {
		try {
			const params = { context: 'view', from, to, compare };
			if ( currency ) {
				params.currency = currency;
			}
			const { data } = await API.get(
				`${ namespace }product-analytics/${ id }`,
				{ params }
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
			return thunkAPI.rejectWithValue( error );
		}
	}
);

export const getProductAnalyticsList = createAsyncThunk(
	'storeengine/getProductAnalyticsList',
	async ( { from, to, currency, search, page, per_page }, thunkAPI ) => {
		try {
			const params = { context: 'view', from, to, page, per_page };
			if ( currency ) {
				params.currency = currency;
			}
			if ( search ) {
				params.search = search;
			}
			const { data } = await API.get( `${ namespace }product-analytics`, {
				params,
			} );
			return data;
		} catch ( error ) {
			thunkAPI.dispatch(
				showNotification( {
					message: error,
					isShow: true,
					type: 'error',
				} )
			);
			return thunkAPI.rejectWithValue( error );
		}
	}
);

export const getTopProducts = createAsyncThunk(
	'storeengine/getTopProducts',
	async ( thunkAPI ) => {
		try {
			return await makeRequest2( 'top_products' );
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

export const getTopCustomers = createAsyncThunk(
	'storeengine/getTopCustomers',
	async ( thunkAPI ) => {
		try {
			return await makeRequest2( 'top_customers' );
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

const analyticsSlice = createSlice( {
	name: 'analytics',
	initialState: {
		data: null,
		loading: false,
		product: null,
		productLoading: false,
		productList: null,
		productListLoading: false,
	},
	extraReducers: ( builder ) => {
		builder
			// get all analytics
			.addCase( getAnalytics.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = action.payload;
			} )
			// per-product analytics
			.addCase( getProductAnalytics.pending, ( state ) => {
				state.productLoading = true;
			} )
			.addCase( getProductAnalytics.fulfilled, ( state, action ) => {
				state.productLoading = false;
				state.product = action.payload;
			} )
			.addCase( getProductAnalytics.rejected, ( state ) => {
				state.productLoading = false;
			} )
			// all-products overview
			.addCase( getProductAnalyticsList.pending, ( state ) => {
				state.productListLoading = true;
			} )
			.addCase( getProductAnalyticsList.fulfilled, ( state, action ) => {
				state.productListLoading = false;
				state.productList = action.payload;
			} )
			.addCase( getProductAnalyticsList.rejected, ( state ) => {
				state.productListLoading = false;
			} )
			// get top products
			.addCase( getTopProducts.fulfilled, ( state, action ) => {
				state.loading = false;
				state.topProducts = action.payload;
			} )
			// get top customers
			.addCase( getTopCustomers.fulfilled, ( state, action ) => {
				state.loading = false;
				state.topCustomers = action.payload;
			} );
	},
} );

export default analyticsSlice.reducer;
