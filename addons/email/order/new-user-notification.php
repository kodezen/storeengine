<?php

namespace StoreEngine\Addons\Email\order;

use StoreEngine\Addons\Email\Traits\Email;
use StoreEngine\Utils\Helper;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class NewUserNotification {

	use Email {
		Email::__construct as private __EmailConstruct;
	}

	public function __construct() {
		$this->__EmailConstruct( 'new_user_notification' );
		add_action( 'storeengine/checkout/customer_created', [ $this, 'send_mail' ], 10, 2 );
	}

	public function send_mail( int $user_id, array $userdata ) {
		$settings = $this->customer_settings();

		if ( ! is_array( $settings ) || empty( $settings['is_enable'] ) ) {
			return;
		}

		$subject                = $this->get_email_subject( $user_id );
		list( $headers, $body ) = $this->get_the_email_body( $settings, 'email/new-user-notification-customer.php' );
		$body                   = $this->get_email_body( $userdata, $user_id, $body );

		$this->mail_send( get_userdata( $user_id )->user_email, $subject, $body, $headers, [
			'user_id' => $user_id,
		] );
	}

	/**
	 * This email's settings, falling back to the shipped default when the store
	 * never saved the Email settings (otherwise a brand-new store never sends
	 * new customers their login details). Read at send time, after init.
	 *
	 * @return array|false
	 */
	private function customer_settings() {
		$settings = $this->get_settings( 'customer' );
		if ( is_array( $settings ) && isset( $settings['email_content'] ) ) {
			return $settings;
		}

		$defaults = \StoreEngine\Addons\Email\admin\Settings::get_settings_default_data();

		return $defaults['new_user_notification']['customer'] ?? false;
	}

	/**
	 * One-time link to the account's "set a new password" form (same flow as
	 * a password reset; expires per WordPress's password_reset_expiration).
	 */
	private function get_set_password_url( \WP_User $user ): string {
		$key = get_password_reset_key( $user );
		if ( is_wp_error( $key ) ) {
			return '';
		}

		// Raw values: add_query_arg() encodes them (pre-encoding breaks logins with "@").
		return add_query_arg(
			[
				'key'   => $key,
				'login' => $user->user_login,
			],
			Helper::get_account_endpoint_url( 'forgot-password' )
		);
	}

	private function get_email_subject( int $user_id ) {
		$user      = get_userdata( $user_id );
		$site_url  = get_bloginfo( 'url' );
		$site_name = get_bloginfo( 'name' );

		$replacements = [
			'{user_display_name}' => esc_html( $user->display_name ),
			'{site_title}'        => esc_html( $site_name ),
			'{site_url}'          => esc_html( $site_url ),
			'{store_name}'        => esc_html( Helper::get_settings( 'store_name' ) ),
		];

		$replacements = apply_filters( 'storeengine/email/' . $this->get_hook_name( 'subject-replacements' ), $replacements, $user );
		$settings     = $this->customer_settings();

		return str_replace( array_keys( $replacements ), array_values( $replacements ), $settings['email_subject'] );
	}

	private function get_email_body( array $userdata, int $user_id, string $body ) {
		$user      = get_userdata( $user_id );
		$login_url = storeengine_login_url( Helper::get_dashboard_url() );
		// Only build a reset key when the template actually uses it.
		$set_url = ( false !== strpos( $body, '{set_password_' ) ) ? $this->get_set_password_url( $user ) : '';

		// Plain-text emails get raw values; HTML emails get escaped/marked-up ones.
		$is_text  = 'plainText' === \StoreEngine\Addons\Email\HelperAddon::get_setting( 'email_content_type' );
		$password = (string) ( $userdata['user_pass'] ?? '' );

		$replacements = [
			'{user_display_name}' => $user->display_name,
			'{user_login}'        => $is_text ? $user->user_login : esc_html( $user->user_login ),
			'{user_email}'        => $user->user_email,
			// Generated passwords can contain & < > etc.; escape for the HTML body.
			'{user_password}'     => $is_text ? $password : '<code>' . esc_html( $password ) . '</code>',
			'{set_password_url}'  => $is_text ? $set_url : esc_url( $set_url ),
			'{set_password_link}' => ! $set_url ? '' : ( $is_text
				? $set_url
				: "<a href='" . esc_url( $set_url ) . "' target='_blank'>" . esc_html__( 'Set your own password', 'storeengine' ) . '</a>' ),
			'{user_first_name}'   => $user->first_name,
			'{user_last_name}'    => $user->last_name,
			'{store_name}'        => Helper::get_settings( 'store_name' ),
			'{sign_in_url}'       => "<a href='" . $login_url . "' target='_blank'>" . $login_url . '</a>',
		];

		$replacements = apply_filters( 'storeengine/email/' . $this->get_hook_name( 'content-replacements' ), $replacements, $user );

		return str_replace( array_keys( $replacements ), array_values( $replacements ), $body );
	}

}
