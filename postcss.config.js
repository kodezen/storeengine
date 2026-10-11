/**
 * PostCSS config picked up by @wordpress/scripts' built-in postcss-loader.
 * Adds Tailwind (scoped to the Instant Checkout app via tailwind.config.js)
 * + autoprefixer to the existing SCSS pipeline.
 */
module.exports = {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
};
