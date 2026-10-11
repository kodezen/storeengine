export function el( tag, className ) {
	const node = document.createElement( tag );
	if ( className ) {
		node.className = className;
	}
	return node;
}

// Decode a base64 (UTF-8) embed string produced by PHP base64_encode().
export function decodeEmbed( b64 ) {
	if ( ! b64 ) {
		return '';
	}
	try {
		const bin = window.atob( b64 );
		const bytes = Uint8Array.from( bin, ( c ) => c.charCodeAt( 0 ) );
		return new TextDecoder( 'utf-8' ).decode( bytes );
	} catch ( e ) {
		return '';
	}
}

// When a user clicks "play" on an embed, nudge the iframe to autoplay.
export function withAutoplay( html ) {
	if ( ! html ) {
		return html;
	}
	return html.replace(
		/<iframe([^>]*?)src="([^"]+)"/i,
		( match, attrs, src ) => {
			const sep = src.indexOf( '?' ) >= 0 ? '&' : '?';
			const newSrc = /autoplay=1/.test( src )
				? src
				: `${ src }${ sep }autoplay=1`;
			const newAttrs = /\ballow=/.test( attrs )
				? attrs
				: `${ attrs } allow="autoplay; encrypted-media; picture-in-picture; fullscreen" `;
			return `<iframe${ newAttrs }src="${ newSrc }"`;
		}
	);
}
