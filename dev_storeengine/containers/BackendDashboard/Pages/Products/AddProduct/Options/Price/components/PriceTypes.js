import React from 'react';
import classNames from 'classnames';
import { Field } from 'formik';
import Tooltip from '@Components/Tooltip';

const PriceTypes = ( { option, current, setFieldValue } ) => {
	return (
		<label
			className="storeengine-item-label storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8"
			htmlFor={ option.value }
		>
			<Field
				type="radio"
				className="storeengine-radio"
				name="price_type"
				id={ option.value }
				value={ option.value }
				checked={ current === option.value }
				disabled={ option.isDisabled }
				onChange={ () => setFieldValue( 'price_type', option.value ) }
			/>
			<span
				className={ classNames( {
					'storeengine-mr-2 storeengine-flex storeengine-flex-align-center storeengine-flex-gap-4': true,
					[ `storeengine-price--${ option.value }` ]: true,
					'storeengine-label-disable': option.isDisabled,
				} ) }
			>
				{ option.label }
				{ option.isDisabled && option.tooltip && (
					<Tooltip>{ option.tooltip }</Tooltip>
				) }
			</span>
		</label>
	);
};

export default React.memo( PriceTypes );
