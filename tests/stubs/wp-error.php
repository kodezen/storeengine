<?php
/**
 * Minimal WP_Error / is_wp_error() for unit tests that exercise code returning errors.
 *
 * Loaded per test file (not from the bootstrap) so tests don't silently depend on it.
 */

if ( ! class_exists( 'WP_Error' ) ) {
	class WP_Error { // phpcs:ignore
		public $errors     = [];
		public $error_data = [];

		public function __construct( $code = '', $message = '', $data = '' ) {
			if ( $code ) {
				$this->errors[ $code ][] = $message;
				if ( $data ) {
					$this->error_data[ $code ] = $data;
				}
			}
		}

		public function get_error_code() {
			$codes = array_keys( $this->errors );

			return $codes[0] ?? '';
		}

		public function get_error_message( $code = '' ) {
			$code = $code ? $code : $this->get_error_code();

			return $this->errors[ $code ][0] ?? '';
		}
	}
}

if ( ! function_exists( 'is_wp_error' ) ) {
	function is_wp_error( $thing ) { // phpcs:ignore
		return $thing instanceof WP_Error;
	}
}
