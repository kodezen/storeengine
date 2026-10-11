import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';
import { __ } from '@wordpress/i18n';

export const fetchAllCategories = createAsyncThunk(
	'storeengine/fetchAllCategories',
	async (
		{ status = 'all', page = 1, perPage = 10, search = '' },
		thunkAPI
	) => {
		try {
			let params = {
				status: status === 'all' ? 'any' : status,
				page,
				per_page: perPage,
			};
			if ( search ) {
				params = { ...params, search };
			}

			const res = await API.get(
				namespace + 'storeengine_product_category',
				{ params }
			);
			return {
				data: res.data,
				totalItems: parseInt( res.headers[ 'x-wp-total' ] ) || 0,
				rowsPerPage: perPage,
				page,
				status,
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

/**
 * Load every category term (all pages) for widgets that need the full tree,
 * e.g. the product editor category picker and the parent-category selects.
 * The REST API caps `per_page` at 100, so walk the pages until done.
 */
export const fetchAllCategoryTerms = createAsyncThunk(
	'storeengine/fetchAllCategoryTerms',
	async ( _args = {}, thunkAPI ) => {
		try {
			const perPage = 100;
			let page = 1;
			let totalPages = 1;
			let terms = [];
			do {
				const res = await API.get(
					namespace + 'storeengine_product_category',
					{
						params: {
							page,
							per_page: perPage,
							orderby: 'name',
							order: 'asc',
							hide_empty: false,
						},
					}
				);
				terms = terms.concat( res?.data ?? [] );
				totalPages =
					parseInt( res?.headers?.[ 'x-wp-totalpages' ] ) || 1;
				page++;
			} while ( page <= totalPages );
			return terms;
		} catch ( e ) {
			thunkAPI.dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'error',
				} )
			);
			throw e;
		}
	}
);

export const createNewCategory = createAsyncThunk(
	'storeengine/createNewCategory',
	async ( data, thunkAPI ) => {
		try {
			const res = await API.post(
				namespace + 'storeengine_product_category',
				data
			);
			return res?.data;
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

export const updateCategory = createAsyncThunk(
	'storeengine/updateCategory',
	async ( data, thunkAPI ) => {
		try {
			const res = await API.post(
				namespace +
					'storeengine_product_category/' +
					parseInt( data.id ),
				data
			);
			return res?.data;
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

export const updateCategoryStatus = createAsyncThunk(
	'storeengine/updateCategoryStatus',
	async ( data, thunkAPI ) => {
		try {
			const res = await API.post(
				namespace +
					'storeengine_product_category/' +
					parseInt( data.id ),
				data
			);
			return res?.data;
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

export const restoreCategory = createAsyncThunk(
	'storeengine/restoreCategory',
	async ( data, thunkAPI ) => {
		const updatedData = { ...data, status: 'draft' };
		try {
			const res = await API.post(
				namespace +
					'storeengine_product_category/' +
					parseInt( data.id ),
				updatedData
			);
			return res?.data;
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

export const deleteCategory = createAsyncThunk(
	'storeengine/deleteCategory',
	async ( ID, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }storeengine_product_category/${ parseInt(
					ID
				) }`,
				{ force: true },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Category Deleted!', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res?.data?.previous;
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

export const moveToTrash = createAsyncThunk(
	'storeengine/moveToTrash',
	async ( ID, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }storeengine_product_category/${ parseInt(
					ID.id
				) }`,
				{ force: false },
				{ headers: { 'X-HTTP-Method-Override': 'DELETE' } }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Category Deleted!', 'storeengine' ),
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
		}
	}
);

const categorySlice = createSlice( {
	name: 'categories',
	initialState: {
		data: [],
		// Full (unpaginated) term list, used by the product editor picker and
		// parent selects. `null` means it has not been loaded yet.
		allTerms: null,
		allTermsLoading: false,
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
			.addCase( fetchAllCategories.pending, ( state ) => {
				state.loading = true;
			} )
			.addCase( fetchAllCategories.rejected, ( state ) => {
				state.loading = false;
			} )
			.addCase( fetchAllCategories.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = action.payload.data;
				state.totalItems = action.payload.totalItems;
				state.rowsPerPage = action.payload.rowsPerPage;
				state.currentPage = action.payload.page;
				state.status = action.payload.status;
				state.search = action.payload.search;
			} )

			.addCase( fetchAllCategoryTerms.pending, ( state ) => {
				state.allTermsLoading = true;
			} )
			.addCase( fetchAllCategoryTerms.rejected, ( state ) => {
				state.allTermsLoading = false;
			} )
			.addCase( fetchAllCategoryTerms.fulfilled, ( state, action ) => {
				state.allTermsLoading = false;
				state.allTerms = action.payload ?? [];
			} )

			.addCase( createNewCategory.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload?.id ) {
					return;
				}
				state.data = [ action.payload, ...state.data ];
				state.totalItems = ( state.totalItems || 0 ) + 1;
				if ( Array.isArray( state.allTerms ) ) {
					state.allTerms = [ action.payload, ...state.allTerms ];
				}
			} )

			.addCase( updateCategory.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload?.id ) {
					return;
				}
				const merge = ( item ) =>
					parseInt( item.id ) === parseInt( action.payload.id )
						? { ...item, ...action.payload }
						: item;
				state.data = state.data.map( merge );
				if ( Array.isArray( state.allTerms ) ) {
					state.allTerms = state.allTerms.map( merge );
				}
			} )

			.addCase( updateCategoryStatus.fulfilled, ( state, action ) => {
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

			.addCase( restoreCategory.fulfilled, ( state, action ) => {
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

			.addCase( deleteCategory.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload?.id ) {
					return;
				}
				const removedId = parseInt( action.payload.id );
				if ( Array.isArray( state.allTerms ) ) {
					state.allTerms = state.allTerms
						.filter( ( item ) => parseInt( item.id ) !== removedId )
						.map( ( item ) =>
							parseInt( item.parent ) === removedId
								? { ...item, parent: 0 }
								: item
						);
				}
				state.totalItems = Math.max( 0, ( state.totalItems || 0 ) - 1 );
				const prepareData = state.data.reduce( ( acc, item ) => {
					if (
						parseInt( item.parent ) ===
						parseInt( action.payload.id )
					) {
						item.parent = 0;
					}
					acc.push( item );
					return acc;
				}, [] );

				state.data = prepareData.filter(
					( item ) =>
						parseInt( item.id ) !== parseInt( action.payload.id )
				);
			} )

			.addCase( moveToTrash.fulfilled, ( state, action ) => {
				state.loading = false;
				const prepareTrashData = state.data.reduce( ( acc, item ) => {
					if (
						parseInt( item.parent ) ===
						parseInt( action.payload.id )
					) {
						item.parent = 0;
					}
					acc.push( item );
					return acc;
				}, [] );

				state.data = prepareTrashData.filter(
					( item ) =>
						parseInt( item.id ) !== parseInt( action.payload.id )
				);
			} );
	},
} );

export const { updateCurrentPage, updateItemPerPage } = categorySlice.actions;
export default categorySlice.reducer;
