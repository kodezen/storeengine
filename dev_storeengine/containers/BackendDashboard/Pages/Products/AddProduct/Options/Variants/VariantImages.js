import React, { useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import UploadImage from '@Components/UploadImage';
import { Select as KitSelect } from '@Components/ui';
import { plugin_root_url } from '@Utils/helper';

export const IMAGE_ATTRIBUTE_META = '_storeengine_variant_image_attribute';

const sameTerm = ( a, b ) => String( a ) === String( b );

// Stored value for an explicit "Each variant" choice. '' means never chosen.
export const EACH_VARIANT = 'each';

const COLOR_NAME = /colou?r/i;
const EXACT_COLOR_NAME = /^colou?r$/i;

/**
 * The attribute images are shared by, or '' for one image per variant.
 *
 * An explicit choice wins (`each` or an attribute still applied). With no
 * choice yet, a colour attribute is the default, but only when the images
 * already agree within each colour, so switching never overwrites images
 * that were set per variant.
 *
 * @param {Object} values     Formik values.
 * @param {Array}  attributes Applied attributes.
 * @param {Array}  variants   Variants (for the no-overwrite check).
 * @return {string} Attribute name or ''.
 */
export const getImageAttribute = ( values, attributes, variants = [] ) => {
	const applied = attributes || [];
	if ( applied.length < 2 ) {
		return '';
	}
	const stored = values?.meta?.[ IMAGE_ATTRIBUTE_META ] || '';
	if ( EACH_VARIANT === stored ) {
		return '';
	}
	if ( stored && applied.some( ( a ) => a?.name === stored ) ) {
		return stored;
	}
	// Prefer an attribute that is exactly "Color"/"Colour" over e.g. "Color two".
	const isColor = ( a, re ) => re.test( a?.name ) || re.test( a?.label );
	const color =
		applied.find( ( a ) => isColor( a, EXACT_COLOR_NAME ) ) ||
		applied.find( ( a ) => isColor( a, COLOR_NAME ) );
	return color && ! hasConflictingImages( variants, color.name )
		? color.name
		: '';
};

/**
 * True when two variants with the same value of `attributeName` carry
 * different images (empty ones don't count: they just inherit).
 *
 * @param {Array}  variants
 * @param {string} attributeName
 * @return {boolean} Whether sharing by this attribute would overwrite images.
 */
const hasConflictingImages = ( variants, attributeName ) => {
	const seen = {};
	return ( variants || [] ).some( ( v ) => {
		const term = v?.taxonomies?.[ attributeName ];
		const image = parseInt( v?.featured_image_id, 10 ) || 0;
		if ( undefined === term || ! image ) {
			return false;
		}
		if ( seen[ term ] && seen[ term ] !== image ) {
			return true;
		}
		seen[ term ] = image;
		return false;
	} );
};

/**
 * Give every variant sharing a value of `attributeName` the same image: the
 * first image already set within that group. Returns null when nothing changes,
 * so callers can skip a state update (and the render loop it would cause).
 *
 * @param {Array}  variants
 * @param {string} attributeName
 * @return {Array|null} Updated variants, or null.
 */
export const syncGroupImages = ( variants, attributeName ) => {
	if ( ! attributeName || ! variants?.length ) {
		return null;
	}
	const groupImage = {};
	variants.forEach( ( v ) => {
		const term = v?.taxonomies?.[ attributeName ];
		const image = parseInt( v?.featured_image_id, 10 ) || 0;
		if ( undefined !== term && image > 0 && ! groupImage[ term ] ) {
			groupImage[ term ] = image;
		}
	} );
	let changed = false;
	const next = variants.map( ( v ) => {
		const term = v?.taxonomies?.[ attributeName ];
		const image = groupImage[ term ] || 0;
		if ( undefined === term || image === ( parseInt( v?.featured_image_id, 10 ) || 0 ) ) {
			return v;
		}
		changed = true;
		return { ...v, featured_image_id: image };
	} );
	return changed ? next : null;
};

/**
 * The one place variant images are set (the table rows only preview them).
 * "Images by <attribute>" gives one upload per attribute value (e.g. per
 * colour), written to every variant with that value; "Each variant" gives one
 * upload per variant. Images are stored per variation either way, so the
 * storefront needs no change. The picker only appears with 2+ attributes.
 *
 * @param {Object}   props
 * @param {Array}    props.attributes           Applied attributes.
 * @param {Array}    props.generatedVariants    Variants.
 * @param {Function} props.setGeneratedVariants Variants setter.
 */
const VariantImages = ( {
	attributes,
	generatedVariants,
	setGeneratedVariants,
} ) => {
	const { values, setFieldValue } = useFormikContext();
	const imageAttribute = getImageAttribute(
		values,
		attributes,
		generatedVariants
	);

	// Keep groups consistent: after switching the attribute, and whenever new
	// variants appear (a new size of an existing colour inherits its image).
	useEffect( () => {
		const next = syncGroupImages( generatedVariants, imageAttribute );
		if ( next ) {
			setGeneratedVariants( next );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ imageAttribute, generatedVariants ] );

	if ( ! generatedVariants?.length ) {
		return null;
	}
	const canGroup = ( attributes || [] ).length > 1;

	const attribute = attributes.find( ( a ) => a?.name === imageAttribute );
	const usedTerms = new Set(
		( generatedVariants || [] ).map( ( v ) =>
			String( v?.taxonomies?.[ imageAttribute ] )
		)
	);
	const terms = ( attribute?.attributes || [] ).filter( ( t ) =>
		usedTerms.has( String( t?.id ) )
	);

	const imageFor = ( termId ) =>
		( generatedVariants || [] ).find(
			( v ) =>
				sameTerm( v?.taxonomies?.[ imageAttribute ], termId ) &&
				parseInt( v?.featured_image_id, 10 ) > 0
		)?.featured_image_id || 0;

	// Tiles: one per used attribute value when grouped, else one per variant.
	const tiles = attribute
		? terms.map( ( term ) => ( {
				key: `term-${ term.id }`,
				name: term.name,
				imageId: imageFor( term.id ),
				onChange: ( id ) => setImageFor( term.id, id ),
		  } ) )
		: generatedVariants.map( ( variant, index ) => ( {
				key: variant?.id
					? `variant-${ variant.id }`
					: `new-${ JSON.stringify( variant?.taxonomies || {} ) }`,
				name: variant?.name,
				imageId: parseInt( variant?.featured_image_id, 10 ) || 0,
				onChange: ( id ) =>
					setGeneratedVariants(
						generatedVariants.map( ( v, i ) =>
							i === index
								? { ...v, featured_image_id: parseInt( id, 10 ) || 0 }
								: v
						)
					),
		  } ) );

	const setImageFor = ( termId, imageId ) =>
		setGeneratedVariants(
			( generatedVariants || [] ).map( ( v ) =>
				sameTerm( v?.taxonomies?.[ imageAttribute ], termId )
					? { ...v, featured_image_id: parseInt( imageId, 10 ) || 0 }
					: v
			)
		);

	return (
		<div className="storeengine-variant-images">
			<div className="storeengine-variant-images__head">
				<div>
					<span className="storeengine-variant-images__title">
						{ __( 'Variant images', 'storeengine' ) }
					</span>
					<span className="storeengine-variant-images__hint">
						{ attribute
							? sprintf(
									/* translators: %s: attribute name, e.g. Color */
									__(
										'One image per %s, shared by all its variants.',
										'storeengine'
									),
									attribute.label
							  )
							: __(
									'Each variant has its own image.',
									'storeengine'
							  ) }
					</span>
				</div>
				{ canGroup && (
				<label className="storeengine-variant-images__by">
					<span>{ __( 'Images by', 'storeengine' ) }</span>
					<KitSelect
						className="w-[160px]"
						value={ imageAttribute || EACH_VARIANT }
						onChange={ ( val ) =>
							setFieldValue(
								`meta.${ IMAGE_ATTRIBUTE_META }`,
								val || EACH_VARIANT
							)
						}
						// Colour first: it's the usual way to share images.
						options={ [
							...[ ...attributes ]
								.sort(
									( a, b ) =>
										Number( EXACT_COLOR_NAME.test( b?.name ) ) * 2 +
										Number( COLOR_NAME.test( b?.name ) ) -
										( Number( EXACT_COLOR_NAME.test( a?.name ) ) * 2 +
											Number( COLOR_NAME.test( a?.name ) ) )
								)
								.map( ( a ) => ( {
									value: a.name,
									label: a.label,
								} ) ),
							{
								value: EACH_VARIANT,
								label: __( 'Each variant', 'storeengine' ),
							},
						] }
					/>
				</label>
				) }
			</div>

			{ tiles.length > 0 && (
				<div className="storeengine-variant-images__grid">
					{ tiles.map( ( tile ) => {
						const { imageId } = tile;
						return (
							<div
								key={ tile.key }
								className="storeengine-variant-images__item"
							>
								<div className="storeengine-variants__variant__image">
									<UploadImage
										label={ tile.name }
										value={ imageId }
										name={ `variant-image-${ tile.key }` }
										saveValueHandler={ ( _name, id ) =>
											tile.onChange( id )
										}
										isSingle={ true }
										uploadBtnLabel={
											<>
												<img
													width="24"
													height="24"
													src={
														plugin_root_url +
														'assets/images/cloud-upload.svg'
													}
													alt=""
													aria-hidden={ true }
												/>
												<span className="screen-reader-text">
													{ sprintf(
														/* translators: %s: attribute value, e.g. Red */
														__(
															'Set image for %s',
															'storeengine'
														),
														tile.name
													) }
												</span>
											</>
										}
										isButtonLabelBlank={ imageId > 0 }
									/>
								</div>
								<span className="storeengine-variant-images__name">
									{ /* Wrap only after "/" (Orange/​Beige), never mid-word. */ }
									{ String( tile.name || '' ).replace(
										/\//g,
										'/\u200b'
									) }
								</span>
							</div>
						);
					} ) }
				</div>
			) }
		</div>
	);
};

export default VariantImages;
