import React, { useRef, useEffect, useState } from 'react';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Common Button component.
 *
 * @param {ButtonProps} props
 *
 * @return {React.JSX.Element}
 */
const Button = ( {
	className = '',
	label = '',
	size = 'md',
	preset = 'blue',
	onClick,
	type = 'button',
	isLoading = false,
	loadingLabel = undefined,
	icon = undefined,
	iconPosition = undefined,
	isCircle = false,
	border = undefined,
	isDisabled = false,
	borderRadius = undefined,
	style = {},
	link = '#',
	suffix = '',
	target = undefined,
	isPro = true,
	ariaLabel = '',
	ariaHidden = false,
	...rest
} ) => {
	const [ btnWidth, setBtnWidth ] = useState( null );
	const btnRef = useRef( null );

	useEffect( () => {
		if ( btnRef.current && ! isLoading && ! btnWidth ) {
			setBtnWidth( btnRef.current.offsetWidth );
		}
	}, [ btnWidth, isLoading ] );

	const buttonProps = {
		...rest,
		style: {
			...style,
			...( isLoading && btnWidth ? { width: `${ btnWidth }px` } : {} ),
		},
		disabled: isDisabled || isLoading,
	};

	if ( onClick && typeof onClick === 'function' ) {
		buttonProps.onClick = onClick;
	}

	if ( ariaLabel ) {
		buttonProps[ 'aria-label' ] = ariaLabel;
	}

	if ( ariaHidden ) {
		buttonProps[ 'aria-hidden' ] = ariaHidden;
	}

	const Component = 'link' === type ? 'a' : 'button';

	if ( 'link' === type ) {
		buttonProps.target = target;
		buttonProps.rel = 'noreferrer';
		buttonProps.href = link;
	} else {
		buttonProps.type = type;
	}

	return (
		<Component
			ref={ btnRef }
			className={ classnames( className, {
				'storeengine-btn': ! className,
				[ 'storeengine-btn--' + size ]: size && ! className,
				[ 'storeengine-btn--preset-' + preset ]: preset && ! className,
				[ 'storeengine-btn--icon-' + iconPosition ]:
					iconPosition && icon && ! isLoading,
				[ 'storeengine-btn--border-' + border ]: border && ! className,
				[ 'storeengine-btn--border-' + borderRadius ]:
					borderRadius && ! className,
				[ 'storeengine-btn--' + suffix ]: suffix,
				'storeengine-btn--circle': isCircle && ! className,
				'storeengine-btn--disabled': isDisabled,
			} ) }
			{ ...buttonProps }
		>
			{ iconPosition !== 'right' && ! isLoading && icon }
			{ isLoading ? (
				<>
					<Spinner />
					{ loadingLabel && (
						<span className="storeengine-btn--label">
							{ loadingLabel }
						</span>
					) }
				</>
			) : (
				label && (
					<span className="storeengine-btn--label">{ label }</span>
				)
			) }
			{ iconPosition === 'right' && ! isLoading && icon }
			{ ! isPro && (
				<span className="storeengine-pro-badge">
					{ __( 'PRO', 'storeengine' ) }
				</span>
			) }
		</Component>
	);
};

Button.displayName = 'Button';

export default Button;
