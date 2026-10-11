import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Star rating. Read-only when no `onChange`, otherwise an interactive picker.
 */
const Stars = ( { value = 0, onChange, size = 16 } ) => {
	const interactive = typeof onChange === 'function';
	return (
		<span
			className="storeengine-review-stars"
			style={ { display: 'inline-flex', gap: 2 } }
			role={ interactive ? 'radiogroup' : undefined }
			aria-label={ __( 'Rating', 'storeengine' ) }
		>
			{ [ 1, 2, 3, 4, 5 ].map( ( star ) => {
				const filled = star <= value;
				const glyph = (
					<span
						key={ star }
						className={ `storeengine-icon storeengine-icon--star${
							filled ? '-fill' : ''
						}` }
						aria-hidden="true"
						style={ {
							fontSize: size,
							color: filled ? '#f5a623' : '#cbd5e1',
							cursor: interactive ? 'pointer' : 'default',
							lineHeight: 1,
						} }
					/>
				);

				if ( ! interactive ) {
					return glyph;
				}

				return (
					<button
						key={ star }
						type="button"
						onClick={ () => onChange( star ) }
						aria-label={ `${ star }` }
						aria-checked={ star === value }
						role="radio"
						style={ {
							background: 'none',
							border: 0,
							padding: 0,
							cursor: 'pointer',
						} }
					>
						{ glyph }
					</button>
				);
			} ) }
		</span>
	);
};

export default Stars;
