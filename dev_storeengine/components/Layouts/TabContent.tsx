import * as React from 'react';
import classNames from 'classnames';

type TabContentProps = {
	children: React.ReactNode;
	className?: string;
	slug?: string;
};

const TabContent = React.memo(
	( { className, slug, children }: TabContentProps ) => {
		return (
			<div
				id={ `settings-${ slug }` }
				className={ classNames(
					'storeengine-tab-content',
					{ [ 'storeengine-tab-content--' + slug ]: slug },
					className
				) }
			>
				{ children }
			</div>
		);
	}
);

TabContent.displayName = 'TabContent';

export default TabContent;
