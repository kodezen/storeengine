<?php
namespace StoreEngine;

use StoreEngine\Utils\Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PermalinkRewrite {
	/**
	 * Option holding a fingerprint of the dashboard endpoints the stored rewrite
	 * rules were built from.
	 */
	const SIGNATURE_OPTION = 'storeengine_dashboard_endpoint_signature';

	public static function init() {
		$self = new self();
		add_filter( 'query_vars', array( $self, 'register_query_vars' ) );
		add_action( 'generate_rewrite_rules', array( $self, 'add_rewrite_rules' ) );

		// Priority 4: just ahead of Database::maybe_flush_rewrite_rules() at 5,
		// so a flag raised here is acted on in the same request.
		add_action( 'init', array( $self, 'maybe_flag_stale_rules' ), 4 );
	}

	/**
	 * Rebuild the rules when the set of dashboard endpoints has moved.
	 *
	 * The rules are only ever flushed by something explicitly asking for it —
	 * an addon activating, a restore. Nothing noticed when they simply went
	 * missing, so a plugin being deactivated and switched back on, or another
	 * plugin flushing while StoreEngine was off, left every dashboard sub-page
	 * 404ing with nothing to put it right. Comparing a fingerprint of the
	 * endpoints against the one the stored rules were built from catches all of
	 * those, and costs a string compare on the requests where nothing changed.
	 */
	public function maybe_flag_stale_rules() {
		$signature = $this->endpoint_signature();

		if ( get_option( self::SIGNATURE_OPTION ) === $signature ) {
			return;
		}

		update_option( self::SIGNATURE_OPTION, $signature );
		Helper::flush_rewire_rules();
	}

	/**
	 * @return string
	 */
	protected function endpoint_signature(): string {
		$slug = (string) get_post_field( 'post_name', (int) Helper::get_settings( 'dashboard_page' ) );
		$keys = array_keys( (array) Helper::get_frontend_dashboard_menu_items() );
		sort( $keys );

		// The slug is in every rule the builder writes, so a renamed dashboard
		// page has to invalidate them as surely as a new endpoint does.
		return md5( $slug . '|' . implode( ',', $keys ) );
	}
	public function register_query_vars( $query_vars ) {
		$query_vars[] = 'storeengine_dashboard_page';
		$query_vars[] = 'storeengine_dashboard_sub_page';
		$query_vars[] = 'order_pay';
		$query_vars[] = 'order_id';
		$query_vars[] = 'payment-methods';
		$query_vars[] = 'add-payment-method';
		$query_vars[] = 'delete-payment-method';
		$query_vars[] = 'set-default-payment-method';
		return $query_vars;
	}
	public function add_rewrite_rules( $wp_rewrite ) {
		$new_rules           = [];
		$dashboard_page_id   = (int) Helper::get_settings( 'dashboard_page' );
		$dashboard_page_slug = get_post_field( 'post_name', $dashboard_page_id );
		$dashboard_pages     = Helper::get_frontend_dashboard_menu_items();
		foreach ( $dashboard_pages as $dashboard_key => $dashboard_page ) {
			if ( ! empty( $dashboard_page['is_separator'] ) ) {
				continue;
			}
			$new_rules[ "($dashboard_page_slug)/$dashboard_key/?$" ]                  = 'index.php?pagename=' . $wp_rewrite->preg_index( 1 ) . '&storeengine_dashboard_page=' . $dashboard_key;
			$new_rules[ "($dashboard_page_slug)/$dashboard_key/(?!page/)(.+?)/?$" ]   = 'index.php?pagename=' . $wp_rewrite->preg_index( 1 ) . '&storeengine_dashboard_page=' . $dashboard_key . '&storeengine_dashboard_sub_page=' . $wp_rewrite->preg_index( 2 );
			$new_rules[ "($dashboard_page_slug)/$dashboard_key/page/([0-9]{1,})/?$" ] = 'index.php?pagename=' . $dashboard_page_slug . '&storeengine_dashboard_page=' . $dashboard_key . '&paged=' . $wp_rewrite->preg_index( 2 );
		}

		$checkout_page      = Helper::get_settings('checkout_page');
		$checkout_page_slug = get_post_field( 'post_name', $checkout_page );
		$new_rules[ "($checkout_page_slug)/order-pay/([0-9]+)/?$" ] = 'index.php?pagename=' . $checkout_page_slug . '&order_pay=true&order_id=' . $wp_rewrite->preg_index( 2 );

		$wp_rewrite->rules = $new_rules + $wp_rewrite->rules;
	}

}
