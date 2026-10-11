module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended',
		'plugin:prettier/recommended',
	],
	env: {
		browser: true,
		// "node": true // Add node if applicable
	},
	rules: {
		'import/no-unresolved': 'off',
		camelcase: 'off',
		'@wordpress/no-global-event-listener': 'off',
		'jsdoc/no-undefined-types': 'off',
		'jsdoc/require-returns-description': 'off',
	},
	overrides: [
		{
			files: [ '*.ts', '*.tsx' ],
			parser: '@typescript-eslint/parser',
			plugins: [ '@typescript-eslint' ],
			extends: [ 'plugin:@typescript-eslint/recommended' ],
			rules: {
				'no-undef': 'off',
			},
		},
		{
			files: [ '*.d.ts' ],
			rules: {
				'no-undef': 'off',
			},
		},
	],
	globals: {
		__webpack_public_path__: true,
		jQuery: true,
		bodymovin: true,
		define: true,
		Cookies: true,
		localStorage: true,
		StoreEngineGlobal: true,
	},
	parserOptions: {
		requireConfigFile: false,
		babelOptions: {
			presets: [ '@wordpress/babel-preset-default' ],
		},
	},
};
