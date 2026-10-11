import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
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
import {
	createNewAttributeTerm,
	deleteAttributesTerm,
	getAttributeTerm,
	updateAttributeTerm,
} from './term';

export const createNewAttribute = createAsyncThunk(
	'attributes/createNewAttribute',
	async ( formData, thunkAPI ) => {
		try {
			const res = await makeRequest2(
				'create_product_attribute',
				formData
			);
			return res;
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

export const getAttribute = createAsyncThunk(
	'attributes/getAttribute',
	async ( ID, thunkAPI ) => {
		try {
			const res = await makeRequest( 'storeengine_attribute', { ID } );
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

export const updateAttribute = createAsyncThunk(
	'attributes/updateAttribute',
	async ( formData, thunkAPI ) => {
		try {
			const res = await makeRequest2(
				'update_product_attribute',
				formData
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __(
						'Attribute Updated Successfully',
						'storeengine'
					),
					isShow: true,
					type: 'success',
				} )
			);
			return res;
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

export const deleteAttribute = createAsyncThunk(
	'attributes/deleteAttribute',
	async ( { ID, force = false }, thunkAPI ) => {
		try {
			const res = await makeRequest( 'delete_product_attribute', {
				attribute_id: ID,
				force: force ? 1 : 0,
			} );
			if ( ! res.data.success ) {
				thunkAPI.dispatch(
					showNotification( {
						message:
							res.data.data ||
							__(
								'Attribute could not be deleted.',
								'storeengine'
							),
						isShow: true,
						type: 'error',
					} )
				);
				return;
			}
			if ( res.data.success ) {
				thunkAPI.dispatch(
					showNotification( {
						message: __( 'Attribute Deleted', 'storeengine' ),
						isShow: true,
						type: 'success',
					} )
				);
				return ID;
			}
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

export const fetchAllAttributes = createAsyncThunk(
	'attributes/fetchAllAttributes',
	async ( { search = '', page = 1, per_page = 10 }, thunkAPI ) => {
		let params = {
			page,
			per_page,
			context: 'edit',
		};

		if ( search ) {
			params = { ...params, search };
		}

		try {
			const res = await makeRequest2( 'get_product_attributes', {
				...params,
			} );
			return {
				data: res.attributes,
				totalItems: parseInt( res.totalItems ),
				rowPerPage: per_page,
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

export const restoreAttributes = createAsyncThunk(
	'attributes/restoreAttributes',
	async ( formData, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }storeengine_attribute/${ parseInt(
					formData.ID
				) }`,
				{ ...formData }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( `Attribute Restored!`, 'storeengine' ),
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

const attributesSlice = createSlice( {
	name: 'attributes',
	initialState: {
		data: [],
		terms: {},
		totalItems: 0,
		page: 1,
		rowsPerPage: 10,
		status: 'all',
		loading: false,
	},
	reducers: {
		updateCurrentPage: ( state, action ) => {
			state.page = action.payload;
		},
		updateAttributesItemPerPage: ( state, action ) => {
			state.rowsPerPage = action.payload;
		},
	},
	extraReducers: ( builder ) => {
		builder
			.addCase( fetchAllAttributes.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = action.payload.data;
				state.totalItems = action.payload.totalItems;
				state.page = action.payload.page;
				state.rowsPerPage = action.payload.rowPerPage;
				state.search = action.payload.search;
			} )

			.addCase( getAttribute.fulfilled, ( state, action ) => {
				state.loading = false;
				if ( ! action.payload ) {
					return;
				}
				state.data = [ action.payload ];
			} )

			.addCase( createNewAttribute.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = [ action.payload, ...state.data ];
			} )

			.addCase( updateAttribute.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item?.attribute_id ) ===
						parseInt( action?.payload?.attribute_id )
					) {
						return { ...item, ...action?.payload };
					}
					return item;
				} );
			} )

			.addCase( deleteAttribute.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.filter(
					( item ) =>
						parseInt( item.attribute_id ) !==
						parseInt( action.payload )
				);
			} )

			.addCase( restoreAttributes.fulfilled, ( state, action ) => {
				state.loading = false;
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item.ID ) === parseInt( action.payload.ID )
					) {
						return { ...item, ...action.payload };
					}
					return item;
				} );
			} )

			// attributes term
			.addCase( getAttributeTerm.fulfilled, ( state, action ) => {
				state.terms[ action.payload.attribute_id ] =
					action.payload.data;
			} )
			.addCase( createNewAttributeTerm.fulfilled, ( state, action ) => {
				state.terms[ action.payload.attribute_id ] = [
					action.payload,
					...state.terms[ action.payload.attribute_id ],
				];
				state.data = state.data.map( ( item ) => {
					if (
						parseInt( item?.attribute_id ) ===
						parseInt( action?.payload?.attribute_id )
					) {
						return {
							...item,
							attribute_terms: item.attribute_terms
								? item.attribute_terms + ', ' + action.payload.name
								: action.payload.name,
						};
					}
					return item;
				} );
			} )
			.addCase( updateAttributeTerm.fulfilled, ( state, action ) => {
				state.terms[ action.payload.attribute_id ] = state.terms[
					action.payload.attribute_id
				].map( ( item ) => {
					if (
						parseInt( item?.term_id ) ===
						parseInt( action?.payload?.term_id )
					) {
						return { ...item, ...action?.payload };
					}
					return item;
				} );
			} )
			.addCase( deleteAttributesTerm.fulfilled, ( state, action ) => {
				if ( ! state.terms[ action?.payload?.attribute_id ] ) {
					return;
				}
				state.terms[ action.payload.attribute_id ] = state.terms[
					action.payload.attribute_id
				].filter(
					( item ) =>
						parseInt( item?.term_id ) !==
						parseInt( action?.payload?.term_id )
				);
			} );
	},
} );

export const { updateCurrentPage, updateAttributesItemPerPage } =
	attributesSlice.actions;
export default attributesSlice.reducer;
