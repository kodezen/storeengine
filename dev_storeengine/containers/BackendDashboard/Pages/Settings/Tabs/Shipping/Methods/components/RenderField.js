import React from 'react';
import { useFormikContext, FieldArray } from 'formik';
import { __, _x } from '@wordpress/i18n';
import Text from '@Components/Formik/Text';
import Textarea from '@Components/Formik/Textarea';
import Checkbox from '@Components/Formik/Checkbox';
import Password from '@Components/Formik/Password';
import Select from '@Components/Formik/Select';
import Tooltip from '@Components/Tooltip';

const RenderField = ( { method, name, field, parent = '' } ) => {
	const { values, setFieldValue } = useFormikContext();
	parent = method;
	const fieldName = name;

	switch ( field.type ) {
		case 'select':
			const options = Object.entries( field.options ).map(
				( [ key, value ] ) => ( { label: value, value: key } )
			);
			return (
				<Select
					name={ fieldName }
					title={ field.label }
					placeholder={ field.placeholder || '' }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
					autocomplete={ field?.autocomplete || '' }
					options={ options || [] }
				/>
			);
		case 'textarea':
			return (
				<Textarea
					name={ fieldName }
					title={ field.label }
					placeholder={ field.placeholder || '' }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
					autocomplete={ field?.autocomplete || '' }
				/>
			);
		case 'checkbox':
			return (
				<Checkbox
					name={ fieldName }
					title={ field.label }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
				/>
			);
		case 'password':
			return (
				<Password
					name={ fieldName }
					title={ field.label }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
				/>
			);
		case 'safe_text':
		case 'text':
		default:
			return (
				<Text
					name={ fieldName }
					title={ field.label }
					placeholder={ field.placeholder || '' }
					desc={ field.desc || field.description || '' }
					tooltip={ field.tooltip || '' }
					readOnly={ field?.readonly || false }
					isRequired={ field?.required || false }
					autocomplete={ field?.autocomplete || '' }
				/>
			);
	}
};

export default RenderField;
