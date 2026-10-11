import { configureStore } from '@reduxjs/toolkit';
// reducers
import notificationReducer from './Slices/notificationSlice/notificationSlice';
import adminNoticeReducer from './Slices/adminNoticeSlice/adminNoticeSlice';
import menuReducer from './Slices/menuSlice/menuSlice';
import addonReducer from './Slices/addonSlice/addonSlice';
import settingsReducer from './Slices/settingsSlice/settingsSlice';
import toolsReducer from './Slices/toolsSlice/toolsSlice';
import accessGroupsReducer from './Slices/accessGroupsSlice/accessGroupsSlice';
import affiliatesReducer from './Slices/affiliatesSlice/affiliatesSlice';
import referralReducer from './Slices/referralsSlice/referralsSlice';
import commissionsReducer from './Slices/commissionsSlice/commissionsSlice';
import payoutsReducer from './Slices/payoutsSlice/payoutsSlice';
import couponsReducer from './Slices/couponsSlice/couponsSlice';
import paymentsReducer from './Slices/paymentsSlice/paymentsSlice';
import analyticsReducer from './Slices/analyticsSlice/analyticsSlice';
import userReducer from './Slices/userSlice/userSlice';
import clicksReducer from './Slices/clicksSlice/clicksSlice';
import webHookReducer from './Slices/webHookSlice/webHookSlice';
import incomingWebhookReducer from './Slices/incomingWebhookSlice/incomingWebhookSlice';
import subscriptionsReducer from './Slices/subscriptionSlice/subscriptionSlice';
import productReducer from './Slices/productsSlice/productsSlice';
import categoryReducer from './Slices/categorySlice/categorySlice';
import brandReducer from './Slices/brandSlice/brandSlice';
import tagReducer from './Slices/tagsSlice/tagsSlice';
import attributesReducer from './Slices/attributesSlice/attributesSlice';
import ordersReducer from './Slices/ordersSlice/ordersSlice';
import installmentPlansReducer from './Slices/installmentPlansSlice/installmentPlansSlice';
import customersReducer from './Slices/customersSlice/customersSLice';
import pricesReducer from './Slices/pricesSlice/pricesSlice';
import licensesReducer from './Slices/licensesSlice/licensesSlice';
import installationEventsReducer from './Slices/installationEventsSlice/installationEventsSlice';
import deploymentVersionsReducer from './Slices/deploymentVersionsSlice/deploymentVersionsSlice';
// import upgradeToProReducer from "./Slices/upgradeToProSlice/upgradeToProSlice";
import deploymentsReducers from './Slices/deploymentsSlice/deploymentsSlice';
import usageLogsReducers from './Slices/usageLogsSlice/usageLogsSlice';
import abandonedCartReducers from './Slices/abandonedCartSlice/abandonedCartSlice';
import orderBumpsReducers from './Slices/orderBumsSlice/orderBumsSlice';
import logsReducer from './Slices/logsSlice/logsSlice';
import inventoryReducer from './Slices/inventorySlice/inventorySlice';
import posReducer from './Slices/posSlice/posSlice';
import reportsReducer from './Slices/reportsSlice/reportsSlice';
import suppliersReducer from './Slices/suppliersSlice/suppliersSlice';
import returnsReducer from './Slices/returnsSlice/returnsSlice';
import couriersReducer from './Slices/couriersSlice/couriersSlice';
import fraudShieldReducer from './Slices/fraudShieldSlice/fraudShieldSlice';
import emailLogsReducer from './Slices/emailLogsSlice/emailLogsSlice';
import screenOptionsReducer from './Slices/screenOptionsSlice/screenOptionsSlice';
import logger from 'redux-logger';
import { setLiveAddons } from '@Utils/helper';

let middleware = [];

if ( process.env.NODE_ENV !== 'production' ) {
	middleware = [ logger ];
}

const store = configureStore( {
	reducer: {
		screenOptions: screenOptionsReducer,
		abandonedCarts: abandonedCartReducers,
		accessGroups: accessGroupsReducer,
		analytics: analyticsReducer,
		referrals: referralReducer,
		payouts: payoutsReducer,
		payments: paymentsReducer,
		subscriptions: subscriptionsReducer,
		coupons: couponsReducer,
		commissions: commissionsReducer,
		affiliates: affiliatesReducer,
		settings: settingsReducer,
		clicks: clicksReducer,
		adminmenu: menuReducer,
		tools: toolsReducer,
		addons: addonReducer,
		notification: notificationReducer,
		adminNotice: adminNoticeReducer,
		user: userReducer,
		webHooks: webHookReducer,
		incomingWebhooks: incomingWebhookReducer,
		products: productReducer,
		categories: categoryReducer,
		brands: brandReducer,
		tags: tagReducer,
		attributes: attributesReducer,
		orders: ordersReducer,
		installmentPlans: installmentPlansReducer,
		orderBumps: orderBumpsReducers,
		customers: customersReducer,
		prices: pricesReducer,
		licenses: licensesReducer,
		installationEvents: installationEventsReducer,
		deploymentVersions: deploymentVersionsReducer,
		deployments: deploymentsReducers,
		usageLogs: usageLogsReducers,
		logs: logsReducer,
		emailLogs: emailLogsReducer,
		inventory: inventoryReducer,
		pos: posReducer,
		reports: reportsReducer,
		suppliersStore: suppliersReducer,
		returnsStore: returnsReducer,
		couriers: couriersReducer,
		fraudShield: fraudShieldReducer,
	},
	middleware: ( getDefaultMiddleware ) =>
		getDefaultMiddleware().concat( ...middleware ),
} );

// Keep isAddonActive() (used across both the free and storeengine-pro bundles)
// in sync with the live addon-toggle state, without requiring a page reload.
store.subscribe( () => setLiveAddons( store.getState().addons ) );

export default store;
