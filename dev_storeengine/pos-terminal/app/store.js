import { configureStore } from '@reduxjs/toolkit';
import posReducer from '@Redux/Slices/posSlice/posSlice';
import notificationReducer from '@Redux/Slices/notificationSlice/notificationSlice';
import inventoryReducer from '@Redux/Slices/inventorySlice/inventorySlice';

/**
 * Slim Redux store for the standalone /pos terminal.
 *
 * Only the slices the cashier UI actually touches:
 *   - pos          (cart, registers, sessions, refunds, discounts, etc.)
 *   - notification (toast layer shared with admin)
 *   - inventory    (locations dropdown when inventory-pro is on)
 *
 * Keeping this lean matters — the admin store imports ~40 reducers, none of
 * which the POS terminal needs. The bundle is enqueued on every cashier
 * page load, so every kilobyte counts.
 */
const store = configureStore( {
	reducer: {
		pos: posReducer,
		notification: notificationReducer,
		inventory: inventoryReducer,
	},
} );

export default store;
