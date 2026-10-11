import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { __ } from '@wordpress/i18n';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';

export const getAbandonedCart = createAsyncThunk(
	'storeengine/getAbandonedCart',
	async ( ID, thunkAPI ) => {
		try {
			const res = await API.get(
				`${ namespace }abandoned-cart/${ parseInt( ID ) }`,
				{
					params: { context: 'edit' },
				}
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

export const updateAbandonedCart = createAsyncThunk(
	'storeengine/updateAbandonedCart',
	async ( { ID, formData }, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }order/${ parseInt( ID ) }`,
				formData
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Updated Orders Successfully', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data.data;
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

export const deleteAbandonedCart = createAsyncThunk(
	'storeengine/deleteAbandonedCart',
	async ( { ID }, thunkAPI ) => {
		try {
			await API.delete(
				`${ namespace }order/${ parseInt( ID ) }`,
				{ data: { force: true } },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Order Deleted', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return ID;
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

export const markAbandonedCartPaid = createAsyncThunk(
	'storeengine/markAbandonedCartPaid',
	async ( { ID }, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }abandoned-cart/${ parseInt( ID ) }/mark-paid`,
				{}
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __(
						'Order marked as paid and cart recovered.',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
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
			return thunkAPI.rejectWithValue( e );
		}
	}
);

export const syncAbandonedCarts = createAsyncThunk(
	'storeengine/syncAbandonedCarts',
	async ( _, thunkAPI ) => {
		try {
			const res = await API.post( `${ namespace }abandoned-cart/sync`, {} );
			thunkAPI.dispatch(
				showNotification( {
					message: res?.data?.message || __( 'Sync complete', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
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
			return thunkAPI.rejectWithValue( e );
		}
	}
);

export const fetchAllAbandonedCarts = createAsyncThunk(
	'storeengine/fetchAllAbandonedCarts',
	async (
		{ status = 'all', page = 1, per_page = 10, search = '' },
		thunkAPI
	) => {
		const params = {
			status: status === 'all' ? 'any' : status,
			page,
			per_page,
			context: 'edit',
			...( search && { search } ),
		};

		try {
			const res = await API.get( `${ namespace }abandoned-cart`, {
				params,
			} );
			return {
				data: res.data,
				totalItems: parseInt( res.headers[ 'x-wp-total' ] ),
				rowsPerPage: per_page,
				status,
				page,
				search,
			};
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

const abandonedCartSlice = createSlice( {
	name: 'abandonedCarts',
	initialState: {
		data: [],
		rowsPerPage: 10,
		page: 1,
		status: 'all',
		search: '',
		totalItems: 0,
	},
	reducers: {},
	extraReducers: ( builder ) => {
		builder
			.addCase( fetchAllAbandonedCarts.fulfilled, ( state, action ) => {
				state.data = action.payload.data;
				state.rowsPerPage = action.payload.rowsPerPage;
				state.totalItems = action.payload.totalItems;
				state.page = action.payload.page;
				state.status = action.payload.status;
				state.search = action.payload.search;
			} )

			.addCase( getAbandonedCart.fulfilled, ( state, action ) => {
				if ( ! action.payload ) {
					return;
				}
				state.data = action.payload;
			} )

			// Dispatched from the details view, where state.data is the single
			// cart object (matching getAbandonedCart.fulfilled above).
			.addCase( markAbandonedCartPaid.fulfilled, ( state, action ) => {
				if ( ! action.payload ) {
					return;
				}
				state.data = action.payload;
			} )

			.addCase( updateAbandonedCart.fulfilled, ( state, action ) => {
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item.id ) === parseInt( action.payload.id )
					) {
						return { ...item, ...action.payload };
					}
					return item;
				} );
			} )

			.addCase( deleteAbandonedCart.fulfilled, ( state, action ) => {
				state.data = state.data.filter(
					( item ) =>
						parseInt( item.id ) !== parseInt( action.payload )
				);
			} );
	},
} );

export default abandonedCartSlice.reducer;
