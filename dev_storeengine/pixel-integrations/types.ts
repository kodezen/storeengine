import { CheckoutResponse } from '../index';

export type PixelCartItem = {
	item_id: number;
	item_name: string;
	currency: string;
	discount: number;
	price: number;
	quantity: number;
	item_variant: string;
};

export type PixelCart = {
	is_empty: boolean;
	total: number;
	// Cart-level discount. The REST cart reports this under `totals`; this flat
	// key is what Pixel::get_cart_info() sends.
	discount_total: number;
	cart_items: Array< PixelCartItem >;
};

export type SingleProductPixelData = {
	item_id: number;
	item_name: string;
	price: number;
	item_variant: string | undefined;
};

export type ProductArchivePixelData = {
	item_id: number;
	item_name: string;
	item_list_id: string;
	item_list_name: string;
};

export type SEPixelData = {
	currency: string;
	page_title: string;
	product: SingleProductPixelData;
	products: Array< ProductArchivePixelData >;
	cart_info: PixelCart;
	// Completed order, localized on whichever page the buyer lands on after
	// paying, used to fire the GA4 `purchase` event there. See google.ts.
	order?: CheckoutResponse[ 'order' ];
};

declare global {
	interface Window {
		SEPixelData?: SEPixelData;
	}
}
