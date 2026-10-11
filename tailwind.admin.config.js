/**
 * Tailwind config — scoped to the *new* admin pages only.
 *
 * Uses the v3.4+ `@config` directive (in `assets/scss/admin-tailwind.scss`)
 * so this config coexists with `tailwind.config.js` (which scopes utilities
 * to the Instant Checkout app). The two builds never overlap because each
 * has disjoint `content` paths AND a disjoint `important` selector.
 *
 * Every utility class emitted here is qualified with `.se-admin-tw`, so the
 * new admin pages opt in by adding that class to their outer wrapper. No
 * other React or PHP code in the project sees `.se-admin-tw`, so utility
 * names like `flex` / `grid` / `text-sm` cannot leak into legacy pages.
 *
 * Preflight is disabled — we don't want Tailwind's CSS reset wiping out
 * StoreEngine's existing design system.
 */
module.exports = {
	content: [
		// Phase 1 migration: the whole admin SPA + shared components are scanned.
		// JIT only emits utilities for class strings it finds LITERALLY, and every
		// utility is scoped to `.se-admin-tw`, so scanning not-yet-migrated pages
		// is harmless (they don't carry that class). Standalone shells that live
		// outside BackendDashboard are listed explicitly.
		'./dev_storeengine/containers/BackendDashboard/**/*.{js,jsx,ts,tsx}',
		'./dev_storeengine/components/**/*.{js,jsx,ts,tsx}',
		'./dev_storeengine/pos-terminal/**/*.{js,jsx,ts,tsx}',
		'./dev_storeengine/customer-returns/**/*.{js,jsx,ts,tsx}',
		// storeengine-pro's admin React renders inside this same admin SPA (core's
		// backend.css is what's loaded), and its pages opt into `.se-admin-tw` +
		// the se.* kit. Scan them here so core emits their utility classes too.
		// Harmless when Pro isn't present (the glob just matches nothing).
		'../storeengine-pro/dev_storeengine-pro/**/*.{js,jsx,ts,tsx}',
	],
	important: '.se-admin-tw',
	corePlugins: {
		preflight: false,
	},
	theme: {
		extend: {
			// Map StoreEngine's existing CSS variables so the new pages
			// inherit the platform palette automatically.
			colors: {
				se: {
					primary: {
						DEFAULT: 'var(--storeengine-primary-color, #008DFF)',
						light:   'var(--storeengine-primary-light, #EAE8FA)',
					},
					secondary:  'var(--storeengine-secondary-color, #EAE8FA)',
					text:       'var(--storeengine-text-color, #1d2939)',
					subtitle:   'var(--storeengine-subtitle-color, #475467)',
					muted:      'var(--storeengine-gray-color, #475467)',
					border:     'var(--storeengine-border-color, #e4e7ec)',
					bg:         'var(--storeengine-background-color, #f9fafb)',
					input:      'var(--storeengine-input-text-color, #344054)',
					placeholder:'var(--storeengine-placeholder-color, #98a2b3)',
					success: {
						DEFAULT: 'var(--storeengine-green-color, #00AD6B)',
						light:   'var(--storeengine-success-light, rgba(0,173,107,0.1))',
					},
					warning: {
						DEFAULT: 'var(--storeengine-warning-color, #FDB022)',
						light:   'var(--storeengine-warning-light, rgba(253,176,34,0.12))',
					},
					error: {
						DEFAULT: 'var(--storeengine-error-color, #FF4D4D)',
						light:   'var(--storeengine-error-light, #FDE8E7)',
					},
					violet:     'var(--storeengine-violet-color, #9A6EFF)',
					dark:       'var(--storeengine-dark-gray, #101828)',
					white:      'var(--storeengine-white-color, #ffffff)',
				},
			},
			fontFamily: {
				// Inherit the ambient (WP admin) font — StoreEngine no longer ships
				// its own typeface. Matches _root.scss --storeengine-primary-font.
				se: 'var(--storeengine-primary-font, inherit)',
			},
			// Coupled, rem-based type scale (GemCRM pattern): every size ships with
			// its correct line-height so `text-sm`/`text-base` stay legible instead
			// of ad-hoc `text-[14px] leading-[20px]` pairs.
			fontSize: {
				'2xs': [ '0.625rem',  { lineHeight: '0.875rem' } ], // 10 / 14
				'11':  [ '0.6875rem', { lineHeight: '1rem' } ],     // 11 / 16
				xs:    [ '0.75rem',   { lineHeight: '1rem' } ],      // 12 / 16
				'13':  [ '0.8125rem', { lineHeight: '1.125rem' } ], // 13 / 18
				sm:    [ '0.875rem',  { lineHeight: '1.25rem' } ],   // 14 / 20
				base:  [ '1rem',      { lineHeight: '1.5rem' } ],    // 16 / 24
				lg:    [ '1.125rem',  { lineHeight: '1.75rem' } ],   // 18 / 28
				xl:    [ '1.25rem',   { lineHeight: '1.75rem' } ],   // 20 / 28
				'2xl': [ '1.5rem',    { lineHeight: '2rem' } ],      // 24 / 32
				'3xl': [ '1.875rem',  { lineHeight: '2.25rem' } ],   // 30 / 36
			},
			borderRadius: {
				// `rounded-se` = the standard 4px card/input/button radius.
				se: '4px',
			},
			// `rounded-se` collides with Tailwind's built-in logical-property
			// utility (border-start-end-radius). The custom value was being
			// overridden by the logical rule, so cards only rounded ONE
			// corner. Use Tailwind's built-in `rounded-md` (also 6px) for
			// the card radius — no custom theme entry needed.
			boxShadow: {
				// GemCRM look = crisp borders, not shadows. Cards/boxes define
				// themselves with a 1px border (border-se-border); `shadow-se-card`
				// is intentionally a no-op so any box using it stays flat + bordered.
				'se-card':  'none',
				'se-pop':   'var(--storeengine-shadow-overlay, 0 8px 24px -8px rgba(16, 24, 40, 0.14))',
			},
		},
	},
	plugins: [],
};
