/**
 * Shopify-style checkout header — store logo + name centered above the form.
 *
 * Logo source comes from snapshot.branding.logo_url which the server
 * resolves as: store_logo setting → plugin shipped fallback → empty.
 * If logo_url is empty we render the store name as text instead.
 */
import { createElement } from '@wordpress/element';

export default function CheckoutHeader({ branding }) {
	const b = branding || {};
	const logoUrl = b.logo_url || '';
	const storeName = b.store_name || '';
	const siteUrl = b.site_url || '/';

	return createElement('header', {
		className: 'border-b border-gray-200 bg-white',
	},
		createElement('div', {
			className: 'mx-auto max-w-checkout px-4 lg:px-6 py-5 flex items-center justify-start',
		},
			createElement('a', {
				href: siteUrl,
				className: 'inline-flex items-center gap-3 no-underline',
			},
				logoUrl
					? createElement('img', {
						src: logoUrl,
						alt: storeName,
						className: 'h-9 max-w-[180px] object-contain object-left',
					})
					: createElement('span', {
						className: 'text-xl font-semibold text-gray-900',
					}, storeName)
			)
		)
	);
}
