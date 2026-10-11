import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API, namespace } from '@Utils/helper';
import { showNotification } from '../notificationSlice/notificationSlice';
import { __ } from '@wordpress/i18n';

function notifyError( thunkAPI, error ) {
	thunkAPI.dispatch(
		showNotification( {
			message: error?.response?.data?.message ?? error?.message,
			isShow: true,
			type: 'error',
		} )
	);
}

/* ---------- Suppliers ---------- */

export const fetchSuppliers = createAsyncThunk(
	'storeengine/suppliers/fetchAll',
	async ( params = {}, thunkAPI ) => {
		try {
			const res = await API.get( `${ namespace }suppliers`, { params } );
			return res.data || [];
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const createSupplier = createAsyncThunk(
	'storeengine/suppliers/create',
	async ( payload, thunkAPI ) => {
		try {
			const res = await API.post( `${ namespace }suppliers`, payload );
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Supplier saved.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const updateSupplier = createAsyncThunk(
	'storeengine/suppliers/update',
	async ( { id, ...payload }, thunkAPI ) => {
		try {
			const res = await API.put( `${ namespace }suppliers/${ id }`, payload );
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Supplier updated.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const deleteSupplier = createAsyncThunk(
	'storeengine/suppliers/delete',
	async ( id, thunkAPI ) => {
		try {
			await API.delete( `${ namespace }suppliers/${ id }` );
			return id;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

/* ---------- Purchase Orders ---------- */

export const fetchPOs = createAsyncThunk(
	'storeengine/po/fetchAll',
	async ( params = {}, thunkAPI ) => {
		try {
			const res = await API.get( `${ namespace }purchase-orders`, {
				params,
			} );
			return res.data || [];
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const fetchPO = createAsyncThunk(
	'storeengine/po/fetchOne',
	async ( id, thunkAPI ) => {
		try {
			const res = await API.get( `${ namespace }purchase-orders/${ id }` );
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const createPO = createAsyncThunk(
	'storeengine/po/create',
	async ( payload, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }purchase-orders`,
				payload
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Purchase order created.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const receivePO = createAsyncThunk(
	'storeengine/po/receive',
	async ( { id, received, cost_strategy = 'last' }, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }purchase-orders/${ id }/receive`,
				{ received, cost_strategy }
			);
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'PO received.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const setPoStatus = createAsyncThunk(
	'storeengine/po/setStatus',
	async ( { id, status }, thunkAPI ) => {
		try {
			const res = await API.post(
				`${ namespace }purchase-orders/${ id }/status`,
				{ status }
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const deletePO = createAsyncThunk(
	'storeengine/po/delete',
	async ( id, thunkAPI ) => {
		try {
			await API.delete( `${ namespace }purchase-orders/${ id }` );
			return id;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

const initialState = {
	suppliers: [],
	suppliersLoading: false,
	pos: [],
	posLoading: false,
	currentPO: null,
	settings: null,
	supplierMetrics: {}, // id -> { metrics, trend }
	currentPoEvents: [],
};

const suppliersSlice = createSlice( {
	name: 'suppliers',
	initialState,
	reducers: {
		clearCurrentPO( state ) {
			state.currentPO = null;
		},
	},
	extraReducers: ( b ) => {
		b
			.addCase( fetchSuppliers.pending, ( s ) => {
				s.suppliersLoading = true;
			} )
			.addCase( fetchSuppliers.fulfilled, ( s, a ) => {
				s.suppliers = a.payload;
				s.suppliersLoading = false;
			} )
			.addCase( fetchSuppliers.rejected, ( s ) => {
				s.suppliersLoading = false;
			} )
			.addCase( createSupplier.fulfilled, ( s, a ) => {
				s.suppliers.push( a.payload );
			} )
			.addCase( updateSupplier.fulfilled, ( s, a ) => {
				const i = s.suppliers.findIndex(
					( x ) => Number( x.id ) === Number( a.payload.id )
				);
				if ( i !== -1 ) s.suppliers[ i ] = a.payload;
			} )
			.addCase( deleteSupplier.fulfilled, ( s, a ) => {
				s.suppliers = s.suppliers.filter(
					( x ) => Number( x.id ) !== Number( a.payload )
				);
			} )

			.addCase( fetchPOs.pending, ( s ) => {
				s.posLoading = true;
			} )
			.addCase( fetchPOs.fulfilled, ( s, a ) => {
				s.pos = a.payload;
				s.posLoading = false;
			} )
			.addCase( fetchPOs.rejected, ( s ) => {
				s.posLoading = false;
			} )
			.addCase( fetchPO.fulfilled, ( s, a ) => {
				s.currentPO = a.payload;
			} )
			.addCase( createPO.fulfilled, ( s, a ) => {
				s.pos.unshift( a.payload );
				s.currentPO = a.payload;
			} )
			.addCase( receivePO.fulfilled, ( s, a ) => {
				const po = a.payload?.po;
				if ( po ) {
					s.currentPO = po;
					const i = s.pos.findIndex(
						( x ) => Number( x.id ) === Number( po.id )
					);
					if ( i !== -1 ) s.pos[ i ] = po;
				}
			} )
			.addCase( setPoStatus.fulfilled, ( s, a ) => {
				const po = a.payload;
				if ( po ) {
					const i = s.pos.findIndex(
						( x ) => Number( x.id ) === Number( po.id )
					);
					if ( i !== -1 ) s.pos[ i ] = po;
					if (
						s.currentPO &&
						Number( s.currentPO.id ) === Number( po.id )
					) {
						s.currentPO = po;
					}
				}
			} )
			.addCase( deletePO.fulfilled, ( s, a ) => {
				s.pos = s.pos.filter(
					( x ) => Number( x.id ) !== Number( a.payload )
				);
			} );

		const upsertPo = ( s, po ) => {
			if ( ! po ) return;
			const i = s.pos.findIndex(
				( x ) => Number( x.id ) === Number( po.id )
			);
			if ( i !== -1 ) s.pos[ i ] = po;
			if (
				s.currentPO &&
				Number( s.currentPO.id ) === Number( po.id )
			) {
				s.currentPO = po;
			}
		};

		b
			.addCase( submitPo.fulfilled, ( s, a ) => upsertPo( s, a.payload ) )
			.addCase( approvePo.fulfilled, ( s, a ) => upsertPo( s, a.payload ) )
			.addCase( rejectPo.fulfilled, ( s, a ) => upsertPo( s, a.payload ) )
			.addCase( fetchPoEvents.fulfilled, ( s, a ) => {
				s.currentPoEvents = a.payload;
			} )
			.addCase( fetchSuppliersSettings.fulfilled, ( s, a ) => {
				s.settings = a.payload;
			} )
			.addCase( saveSuppliersSettings.fulfilled, ( s, a ) => {
				s.settings = a.payload;
			} )
			.addCase( fetchSupplierMetrics.fulfilled, ( s, a ) => {
				if ( a.meta && a.meta.arg ) {
					s.supplierMetrics[ Number( a.meta.arg ) ] = a.payload;
				}
			} );
	},
} );

/* ---------- Supplier metrics ---------- */

export const fetchSupplierMetrics = createAsyncThunk(
	'storeengine/suppliers/metrics',
	async ( id, thunkAPI ) => {
		try {
			const res = await API.get( `${ namespace }suppliers/${ id }/metrics` );
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

/* ---------- Settings ---------- */

export const fetchSuppliersSettings = createAsyncThunk(
	'storeengine/suppliers/settings/fetch',
	async ( _, thunkAPI ) => {
		try {
			const res = await API.get( `${ namespace }suppliers/settings` );
			return res.data || {};
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const saveSuppliersSettings = createAsyncThunk(
	'storeengine/suppliers/settings/save',
	async ( payload, thunkAPI ) => {
		try {
			const res = await API.post( `${ namespace }suppliers/settings`, payload );
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Suppliers settings saved.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const runAutoReorder = createAsyncThunk(
	'storeengine/suppliers/auto-reorder/run',
	async ( _, thunkAPI ) => {
		try {
			const res = await API.post( `${ namespace }suppliers/auto-reorder/run` );
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Auto-reorder sweeper finished.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

/* ---------- PO submit / approve / reject / resend / events ---------- */

export const submitPo = createAsyncThunk(
	'storeengine/po/submit',
	async ( id, thunkAPI ) => {
		try {
			const res = await API.post( `${ namespace }purchase-orders/${ id }/submit` );
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'PO submitted.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const approvePo = createAsyncThunk(
	'storeengine/po/approve',
	async ( id, thunkAPI ) => {
		try {
			const res = await API.post( `${ namespace }purchase-orders/${ id }/approve` );
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'PO approved & sent.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const rejectPo = createAsyncThunk(
	'storeengine/po/reject',
	async ( { id, reason }, thunkAPI ) => {
		try {
			const res = await API.post( `${ namespace }purchase-orders/${ id }/reject`, {
				reason,
			} );
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const resendPo = createAsyncThunk(
	'storeengine/po/resend',
	async ( id, thunkAPI ) => {
		try {
			const res = await API.post( `${ namespace }purchase-orders/${ id }/resend` );
			thunkAPI.dispatch(
				showNotification( {
					message: __( 'Email re-sent.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			return res.data;
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const fetchPoEvents = createAsyncThunk(
	'storeengine/po/events',
	async ( id, thunkAPI ) => {
		try {
			const res = await API.get( `${ namespace }purchase-orders/${ id }/events` );
			return res.data || [];
		} catch ( error ) {
			notifyError( thunkAPI, error );
			throw error;
		}
	}
);

export const { clearCurrentPO } = suppliersSlice.actions;
export default suppliersSlice.reducer;
