const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const path = require( 'path' );

// @TODO get version info from plugin main file.
//       For now, using version info from package.json file.
const { version: STOREENGINE_VERSION } = require( './package.json' );

const config = {
	...defaultConfig,
	// performance: {
	//   hints: false,
	// },
	cache: {
		type: 'filesystem',
		allowCollectingMemory: true,
		compression: 'gzip',
		buildDependencies: {
			config: [ __filename ], // invalidate cache when config changes
		},
		//cacheDirectory: path.resolve(__dirname, 'node_modules/.cache'),
	},
	entry: {
		backend: path.resolve( __dirname, 'dev_storeengine/backend.js' ),
		frontend: path.resolve( __dirname, 'dev_storeengine/frontend.js' ),
		blocks: path.resolve( __dirname, 'dev_storeengine/blocks/index.js' ),
		setup: path.resolve( __dirname, 'dev_storeengine/setup.js' ),
		// React Quick Checkout app — enqueued on the iframe template + shortcode
		// pages by the Instant Checkout addon. Same-origin only; auth is cookie
		// + nonce.
		'instant-checkout-app': path.resolve(
			__dirname,
			'dev_storeengine/instant-checkout/app/index.js'
		),
		// Slim cross-origin SDK consumed by the Embeddable Checkout addon, which
		// streams it to external sites at /se-embed/v1/sdk.js.
		'embed-sdk': path.resolve( __dirname, 'dev_storeengine/instant-checkout/embed-sdk.js' ),
		// Public POS terminal — rendered by the storeengine-pro/pos addon at
		// the /pos URL. Cashier-only React app, no admin shell.
		'pos-terminal-app': path.resolve( __dirname, 'dev_storeengine/pos-terminal/app/index.js' ),
		// Customer-facing return-request panel — mounted by the
		// [storeengine_my_returns] shortcode in the returns Pro addon.
		'customer-returns-app': path.resolve( __dirname, 'dev_storeengine/customer-returns/app/index.js' ),
		// Vendor product editor — frontend-dashboard React mount that reuses the
		// admin AddProduct component in mode='vendor'. Loaded by the multi-vendor
		// addon on the dashboard's vendor-product-edit endpoint.
		'vendor-product-editor': path.resolve( __dirname, 'dev_storeengine/vendor-product-editor.js' ),
		// Vendor My Products full-page React app — owns the products table
		// AND the Add/Edit modal in a single tree. Loaded by the multi-vendor
		// addon on the dashboard's vendor-products endpoint.
		'vendor-products-page': path.resolve( __dirname, 'dev_storeengine/vendor-products-page.js' ),
		// Custom product-gallery (vanilla JS, no jQuery/Flickity). Enqueued only
		// on single-product pages that actually have gallery images/videos, so
		// the carousel/stacked/grid layouts + lightbox/zoom load on demand.
		'product-gallery': path.resolve( __dirname, 'dev_storeengine/frontend/product-gallery/index.js' ),
		// Product archive/shop card enhancements (vanilla JS): card image
		// carousel, variant swatches on cards, and Quick View modal. Enqueued
		// only on archives when at least one of those features is enabled.
		'product-archive': path.resolve( __dirname, 'dev_storeengine/frontend/product-archive/index.js' ),
	},
	output: {
		filename: `[name].${ STOREENGINE_VERSION }.js`,
		path: path.resolve( __dirname, 'assets/build' ),
	},
	externals: {
		jquery: 'jQuery',
		$: 'jQuery',
		StoreEngineGlobal: 'StoreEngineGlobal',
	},
	plugins: [ ...defaultConfig.plugins, new CleanWebpackPlugin() ],
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...defaultConfig.resolve.alias,
			'@Components': path.resolve(
				__dirname,
				'dev_storeengine/components/'
			),
			'@Containers': path.resolve(
				__dirname,
				'dev_storeengine/containers/'
			),
			'@Frontend': path.resolve( __dirname, 'dev_storeengine/frontend/' ),
			'@CheckoutCore': path.resolve(
				__dirname,
				'dev_storeengine/checkout-core/'
			),
			'@Global': path.resolve( __dirname, 'dev_storeengine/global/' ),
			'@Redux': path.resolve( __dirname, 'dev_storeengine/redux/' ),
			'@Utils': path.resolve( __dirname, 'dev_storeengine/utils/' ),
			'@Hooks': path.resolve( __dirname, 'dev_storeengine/hooks/' ),
			'@Images': path.resolve( __dirname, 'assets/images' ),
		},
	},
};

module.exports = config;
