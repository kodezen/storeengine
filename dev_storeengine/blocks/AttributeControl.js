/**
 * Renders one editor control for one attribute descriptor, per the v1 types
 * catalog. Stored values are strings/numbers matching what the shortcode reads.
 */
import {
	TextControl,
	TextareaControl,
	RangeControl,
	ToggleControl,
	SelectControl,
	RadioControl,
	ColorPalette,
	BaseControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { attValue } from './registry';

export default function AttributeControl( { attr, atts, setAtt } ) {
	const value = attValue( attr, atts );
	const label = attr.required ? `${ attr.label } *` : attr.label;
	const common = { label, help: attr.help || undefined };

	switch ( attr.type ) {
		case 'textarea':
			return (
				<TextareaControl
					{ ...common }
					value={ value || '' }
					placeholder={ attr.placeholder }
					onChange={ ( v ) => setAtt( attr.name, v ) }
				/>
			);

		case 'number':
			return (
				<TextControl
					{ ...common }
					type="number"
					value={ value ?? '' }
					min={ attr.min }
					max={ attr.max }
					step={ attr.step }
					placeholder={ attr.placeholder }
					onChange={ ( v ) => setAtt( attr.name, v === '' ? '' : Number( v ) ) }
				/>
			);

		case 'range':
			return (
				<RangeControl
					{ ...common }
					value={ Number( value ) || attr.min || 0 }
					min={ attr.min }
					max={ attr.max }
					step={ attr.step || 1 }
					onChange={ ( v ) => setAtt( attr.name, v ) }
				/>
			);

		case 'toggle':
			return (
				<ToggleControl
					{ ...common }
					checked={ String( value ) === 'true' }
					onChange={ ( v ) => setAtt( attr.name, v ? 'true' : 'false' ) }
				/>
			);

		case 'select':
			return (
				<SelectControl
					{ ...common }
					value={ value }
					options={ attr.options }
					onChange={ ( v ) => setAtt( attr.name, v ) }
				/>
			);

		case 'radio':
			return (
				<RadioControl
					{ ...common }
					selected={ String( value ) }
					options={ attr.options }
					onChange={ ( v ) => setAtt( attr.name, v ) }
				/>
			);

		case 'color':
			return (
				<BaseControl { ...common }>
					<ColorPalette
						value={ value }
						onChange={ ( v ) => setAtt( attr.name, v || '' ) }
					/>
				</BaseControl>
			);

		case 'post-select':
			return (
				<TextControl
					{ ...common }
					type="number"
					value={ value ?? '' }
					help={ attr.help || __( 'Enter the post ID.', 'storeengine' ) }
					placeholder={ attr.placeholder || attr.post_type }
					onChange={ ( v ) => setAtt( attr.name, v === '' ? '' : Number( v ) ) }
				/>
			);

		case 'taxonomy-select':
			return (
				<TextControl
					{ ...common }
					value={ value ?? '' }
					help={ attr.help || __( 'Enter the term ID or slug.', 'storeengine' ) }
					placeholder={ attr.placeholder || attr.taxonomy }
					onChange={ ( v ) => setAtt( attr.name, v ) }
				/>
			);

		case 'csv':
			return (
				<TextControl
					{ ...common }
					value={ value || '' }
					help={ attr.help || __( 'Comma-separated values, e.g. 4,7,9', 'storeengine' ) }
					placeholder={ attr.placeholder || '1,2,3' }
					onChange={ ( v ) => setAtt( attr.name, v ) }
				/>
			);

		case 'text':
		default:
			return (
				<TextControl
					{ ...common }
					value={ value || '' }
					placeholder={ attr.placeholder }
					onChange={ ( v ) => setAtt( attr.name, v ) }
				/>
			);
	}
}
