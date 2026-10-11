import React, { memo } from 'react';

import './styles.scss';

const AnalyticsSectionHeader = ( { label, timeline } ) => {
	return (
		<div className="storeengine-analytics-section-header">
			<h3 className="storeengine-analytics-section-header__title">
				{ label }
			</h3>
			<p className="storeengine-analytics-section-header__subtitle">
				{ timeline }
			</p>
		</div>
	);
};

export default memo( AnalyticsSectionHeader );
