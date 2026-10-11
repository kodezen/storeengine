import { createElement } from '@wordpress/element';

export default function ErrorBanner({ message, onDismiss, actionHref, actionLabel }) {
	if (!message) return null;
	return createElement('div', { className: 'se-embedded-app__error', role: 'alert' },
		createElement('span', null,
			message,
			// Optional call-to-action (e.g. "Log in to continue" for the
			// email-already-registered case). Rendered inline after the message.
			actionHref && createElement('a', {
				href: actionHref,
				className: 'se-embedded-app__error-action',
				style: { marginLeft: '8px', fontWeight: 600, textDecoration: 'underline' },
			}, actionLabel || 'Log in to continue')
		),
		onDismiss && createElement('button', {
			type: 'button',
			className: 'se-embedded-app__error-close',
			onClick: onDismiss,
			'aria-label': 'Dismiss',
		}, '×')
	);
}
