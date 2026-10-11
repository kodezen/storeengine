import React, { memo } from 'react';
import { sprintf, __ } from '@wordpress/i18n';

import './styles.scss';

const ChangeRate = memo( ( { rate = 0 } ) => {
	const isNa = null === rate || rate === 0 || isNaN( rate );
	const isUp = ! isNa && rate > 0;
	const icon = isNa ? '–' : isUp ? '↑' : '↓';
	const type = isNa ? 'na' : isUp ? 'up' : 'down';

	return (
		<span className={ `storeengine-change-rate rate-${ type }` }>
			{ sprintf(
				// translators: %1%s Up/down arrow icon char, %2$d: rate of change (percentage)
				__( '%1$s %2$d%%', 'storeengine' ),
				icon,
				rate
			) }
		</span>
	);
} );

export default ChangeRate;
