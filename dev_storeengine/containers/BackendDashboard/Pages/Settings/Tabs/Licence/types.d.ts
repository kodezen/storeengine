export interface StoreEngineSDKPayload {
	rest_url?: string;
	nonce?: string;
	device_id?: string;
	version?: string;
	locale?: string;
	wordpress?: string;
	license?: {
		license: string;
		status: string | 'active' | 'inactive' | 'expired';
		device_id: string;
		slug: string;
		product_id: number;
		remaining: number;
		activations: number;
		limit: number;
		unlimited: boolean;
		expires: number;
		updated_at: string;
	};
	package?: {
		version: string;
		type: string;
		update: {
			package_id: number;
			id: string;
			slug: string;
			new_version: string;
			channel: string;
			url: string;
			package: string;
			upgrade_notice: string;
			plugin: string;
			icons: {
				default: string;
			};
			banners: {
				low: string;
				high: string;
			};
			banners_rtl: string[];
			requires: string;
			tested: string;
			requires_php: string;
			requires_plugins: string[];
			name: string;
			version: string;
			author: string;
			author_profile: string;
			contributors: string[];
			rating: number;
			ratings: Record< string, number >;
			num_ratings: number;
			support_url: string;
			support_threads: number;
			support_threads_resolved: number;
			active_installs: number;
			last_updated: string;
			added: string;
			homepage: string;
			sections: {
				description: string;
				installation: string;
				faq: string;
				changelog: string;
				screenshots: string;
				reviews: string;
			};
			screenshots: string[];
			tags: string[];
			versions: string[];
			business_model: string;
			repository_url: string;
			commercial_support_url: string;
			donate_link: string;
			download_link: string;
		};
		need_update: boolean;
	};
	optin?: {
		allowed: boolean;
		show: boolean;
		last_send: number;
	};
	promos?: unknown[];
	[ key: string ]: unknown;
}
