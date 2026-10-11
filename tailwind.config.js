/**
 * Tailwind config — scoped to the Instant Checkout React app.
 *
 * Every utility class is prefixed with the component root selector
 * (`.se-embedded-app`) via the `important` option AND constrained to that
 * subtree via JIT content paths, so utility class names like `flex`, `grid`,
 * etc. cannot leak into the surrounding theme/admin/storefront styles.
 *
 * Preflight is disabled — we don't want Tailwind's CSS reset wiping out
 * StoreEngine's existing design system. Only the utility classes are emitted.
 */
module.exports = {
	content: [ './dev_storeengine/instant-checkout/app/**/*.{js,jsx}' ],
	important: '.se-embedded-app',
	corePlugins: {
		preflight: false,
	},
	theme: {
		extend: {
			maxWidth: {
				checkout: '1280px',
			},
		},
	},
	plugins: [],
};
