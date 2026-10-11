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

export const createNewAttributeTerm = createAsyncThunk(
	'attributes/createNewAttributeTerm',
	async ( formData, thunkAPI ) => {
		try {
			const data = await makeRequest2(
				'create_product_attribute_term',
				formData.values
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Term Created', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return {
				...formData.values,
				...data,
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

export const getAttributeTerm = createAsyncThunk(
	'attributes/getAttributeTerm',
	async ( ID, thunkAPI ) => {
		try {
			const data = await makeRequest2( 'get_product_attribute_terms', {
				attribute_id: ID,
			} );
			return {
				data,
				attribute_id: ID,
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

export const updateAttributeTerm = createAsyncThunk(
	'attributes/updateAttributeTerm',
	async ( formData, thunkAPI ) => {
		try {
			const data = await makeRequest2(
				'update_product_attribute_term',
				formData
			);
			return {
				...formData,
				...data,
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

export const deleteAttributesTerm = createAsyncThunk(
	'attributes/deleteAttributesTerm',
	async ( { attribute_id, term_id }, thunkAPI ) => {
		try {
			const res = await makeRequest( 'delete_product_attribute_term', {
				term_id,
				attribute_id,
			} );
			if ( res.data.success ) {
				thunkAPI.dispatch(
					showNotification( {
						message: __( 'Term Deleted', 'storeengine' ),
						isShow: true,
						type: 'success',
					} )
				);
				return {
					data: res?.data?.success,
					term_id,
					attribute_id,
				};
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
