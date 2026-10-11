import * as React from 'react';
import classNames from 'classnames';
import { Field } from 'formik';
import SwitchControl from '@Components/Formik/Checkbox/SwitchControl';
import uniqueId from 'lodash/uniqueId';

import './styles.scss';

type ContentSectionProps = React.PropsWithChildren< {
	className?: string;
	label?: string;
	slug?: string;
	mode?: string;
	useToggle: boolean;
	isEnabled?: boolean;
	onToggle?: ( isEnabled: boolean ) => void;
} >;

const noop = () => {};

const ContentSection = React.memo(
	( {
		className = '',
		label,
		slug,
		useToggle = false,
		children,
		isEnabled = false,
		onToggle = noop,
		mode = 'admin',
	}: ContentSectionProps ) => {
		const id = uniqueId( slug + '-' );
		return (
			<div
				id={ id }
				className={ classNames( 'storeengine-content-section', {
					[ 'storeengine-content-section--' + slug ]: slug,
					'storeengine-content-section--unknown': ! slug,
					'storeengine-content-section--toggle': useToggle,
					'storeengine-content-section--toggle-on':
						useToggle && isEnabled,
					'storeengine-content-section--toggle-off ':
						useToggle && ! isEnabled,
				} ) }
			>
				{ ! useToggle && label && (
					<h2 id={ id + '-heading' } className={`storeengine-heading ${mode !== 'admin' ? 'mb-[24px] !pb-4' : ''}`}>
						{ label }
					</h2>
				) }
				{ useToggle && label && (
					<h2 id={ id + '-heading' } className={`storeengine-heading ${mode !== 'admin' ? 'mb-6 !pb-4' : ''}`}>
						<span>{ label }</span>
						<span>
							<Field
								type="checkbox"
								name={ id }
								component={ SwitchControl }
								aria-labelledby={ id + '-heading' }
								value={ isEnabled }
								onChange={ () =>
									onToggle && onToggle( ! isEnabled )
								}
							/>
						</span>
					</h2>
				) }
				{ useToggle ? (
					isEnabled && (
						<div
							className={ classNames(
								'storeengine-content-section-content',
								className
							) }
						>
							{ children }
						</div>
					)
				) : (
					<div
						className={ classNames(
							'storeengine-content-section-content',
							className
						) }
					>
						{ children }
					</div>
				) }
			</div>
		);
	}
);

ContentSection.displayName = 'ContentSection';

export default ContentSection;
