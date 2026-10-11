// Whether a freshly built combination's term ids line up with an existing
// variant's. Ids are compared as strings because a reloaded product can hand
// back term ids as strings while freshly fetched terms are numbers. With
// `allowSubset` the existing variant may carry extra attributes (used when an
// attribute was removed and variants collapse onto the remaining ones).
const taxonomiesMatch = ( next = {}, prev = {}, allowSubset = false ) => {
	const nextKeys = Object.keys( next );
	if ( ! nextKeys.length ) {
		return false;
	}
	if ( ! allowSubset && nextKeys.length !== Object.keys( prev ).length ) {
		return false;
	}
	return nextKeys.every(
		( key ) => key in prev && String( next[ key ] ) === String( prev[ key ] )
	);
};

// Find the not-yet-claimed existing variant that matches `next` and mark it
// used, so one saved variant can never be reused for two combinations.
const claimExistingVariant = ( next, existing, used, options = {} ) => {
	const { allowSubset = false, combination = null } = options;
	let index = existing.findIndex(
		( old, i ) =>
			! used.has( i ) &&
			taxonomiesMatch( next.taxonomies, old?.taxonomies, allowSubset )
	);

	// Legacy variants without term ids can only be matched by their name.
	if ( index === -1 && combination ) {
		index = existing.findIndex(
			( old, i ) =>
				! used.has( i ) &&
				! Object.keys( old?.taxonomies || {} ).length &&
				isFullyMatched(
					String( old?.name || '' ).split( '/' ),
					combination
				)
		);
	}

	if ( index === -1 ) {
		return null;
	}
	used.add( index );
	return existing[ index ];
};

// Build every combination of the selected attribute values. Combinations that
// already exist (matched by term ids) keep ALL of their data — id, sku, price,
// stock, image, … — so adding a value never wipes the variants you already
// set up. Only genuinely new combinations come back without an id.
export const generateCombinations = (
	variants = [],
	generatedVariants = []
) => {
	if ( variants.length === 0 ) {
		return [];
	}
	const attributes = variants
		.filter( ( v ) => v.attributes && v.attributes.length > 0 )
		.map( ( v ) => v.attributes );

	if ( attributes.length === 0 ) {
		return [];
	}

	const combine = ( arrays, prefix = [] ) => {
		// Recursive function to generate all combinations
		if ( ! arrays.length ) {
			return [ prefix ];
		}
		const [ first, ...rest ] = arrays;
		return first.flatMap( ( item ) =>
			combine( rest, [ ...prefix, item ] )
		);
	};

	const existing = generatedVariants || [];
	const used = new Set();

	return combine( attributes ).map( ( combination, index ) => {
		const next = {
			variant_id: index,
			name: combination.map( ( attr ) => attr.name ).join( '/' ),
			price: '',
			sku: '',
			taxonomies: handleGetTaxonomies( combination, variants ),
			featured_image_id: 0,
			pricing_id: 0,
			stock: {
				manages_stock: false,
				stock_quantity: '',
				stock_status: 'instock',
				backorders: 'no',
				low_stock_threshold: '',
			},
		};

		const match = existing.length
			? claimExistingVariant( next, existing, used, { combination } )
			: null;

		return match
			? { ...match, name: next.name, taxonomies: next.taxonomies }
			: next;
	} );
};

// Carry existing variants' data onto a newly generated list. Unlike
// generateCombinations' exact match, an existing variant may carry extra
// attributes here, so removing an attribute keeps the first variant that still
// lines up instead of dropping everything.
export const syncOldCombinationsWithNew = (
	oldCombinations,
	newCombinations
) => {
	const existing = oldCombinations || [];
	const used = new Set();

	return newCombinations.map( ( next ) => {
		const match = claimExistingVariant( next, existing, used, {
			allowSubset: true,
		} );

		return match
			? { ...match, name: next.name, taxonomies: next.taxonomies }
			: next;
	} );
};

// How many already-saved variants (those with an id) are missing from `next`.
// The backend hard-deletes every saved variation that isn't sent back, so the
// editor uses this to warn before an edit that would remove saved variants.
export const countDroppedSavedVariants = ( previous = [], next = [] ) => {
	const keptIds = new Set(
		( next || [] )
			.filter( ( variant ) => variant?.id )
			.map( ( variant ) => String( variant.id ) )
	);

	return ( previous || [] ).filter(
		( variant ) => variant?.id && ! keptIds.has( String( variant.id ) )
	).length;
};

export const updateCombinationNames = ( {
	oldCombinations,
	attributeName, // e.g., 'size'
	updatedValues,
	valueIndex,
	newValue,
} ) => {
	const updatedAttribute = updatedValues[ valueIndex ];

	return oldCombinations.map( ( combination ) => {
		const taxonomyId = combination.taxonomies[ attributeName ];

		if ( taxonomyId === updatedAttribute.id ) {
			const nameParts = combination.name.split( '/' );

			const attributeIndex = 0;

			nameParts[ attributeIndex ] = newValue;

			const updatedName = nameParts.join( '/' );

			return {
				...combination,
				name: updatedName,
			};
		}

		return combination;
	} );
};

function isFullyMatched( stringArray, objectArray ) {
	const stringSet = new Set( stringArray );
	const objectSet = new Set( objectArray.map( ( obj ) => obj.name ) );

	return (
		stringSet.size === objectSet.size &&
		[ ...stringSet ].every( ( name ) => objectSet.has( name ) )
	);
}

const handleGetTaxonomies = ( combination, variants ) => {
	const taxonomies = {};
	combination.forEach( ( attr ) => {
		const variant = variants.find( ( v ) =>
			v.attributes.some( ( a ) => a.id === attr.id )
		);
		if ( variant ) {
			taxonomies[ variant.name ] = attr.id;
		}
	} );
	return taxonomies;
};

export const areVariantsEqual = ( arr1, arr2 ) => {
	if ( arr1.length !== arr2.length ) {
		return false;
	}
	const sortedArr1 = arr1.map( ( v ) => JSON.stringify( v ) ).sort();
	const sortedArr2 = arr2.map( ( v ) => JSON.stringify( v ) ).sort();
	return JSON.stringify( sortedArr1 ) === JSON.stringify( sortedArr2 );
};

export const prepareVariantAttributes = (
	attributes,
	data,
	newVariants,
	variantMap
) => {
	const returnedData = attributes.map( ( attribute ) => {
		const mathchedAttribute = data.find(
			( a ) => a.attribute_name === attribute.label
		);
		return {
			// A row whose attribute can't be found any more (deleted globally) still
			// needs a unique id: `undefined === undefined` would open every such row
			// in the editor at once.
			attribute_id:
				mathchedAttribute?.attribute_id ?? `missing-${ attribute.label }`,
			label: mathchedAttribute?.attribute_label ?? attribute.label,
			name: mathchedAttribute?.attribute_name ?? attribute.label,
			attributes: attribute.ids.map( ( id ) => ( {
				slug: newVariants.find( ( v ) => v.id === id )?.slug || '',
				id,
				name: variantMap[ id ] || '',
			} ) ),
		};
	} );
	return returnedData;
};
export const prepareGeneratedVaiants = ( variants, variantMap ) => {
	const generatedData = variants.map( ( variant ) => {
		const nameParts = [];
		for ( const [ _, attrValue ] of Object.entries( variant.taxonomies ) ) {
			if ( variantMap[ attrValue ] ) {
				nameParts.push( variantMap[ attrValue ] );
			}
		}
		return {
			...variant,
			name: nameParts.join( '/' ),
			price: variant?.price || '',
			sku: variant?.sku,
			featured_image_id: variant?.featured_image_id
				? parseInt( variant.featured_image_id )
				: 0,
			pricing_id: variant?.pricing_id
				? parseInt( variant?.pricing_id )
				: 0,
			id: variant?.id,
			stock: {
				manages_stock: !! variant?.stock?.manages_stock,
				stock_quantity:
					variant?.stock?.stock_quantity === null ||
					variant?.stock?.stock_quantity === undefined
						? ''
						: variant.stock.stock_quantity,
				stock_status: variant?.stock?.stock_status ?? 'instock',
				backorders: variant?.stock?.backorders ?? 'no',
				low_stock_threshold:
					variant?.stock?.low_stock_threshold === null ||
					variant?.stock?.low_stock_threshold === undefined
						? ''
						: variant.stock.low_stock_threshold,
			},
		};
	} );
	return generatedData;
};

export const handleManageAttributes = ( variants ) => {
	return variants.map( ( item ) => ( {
		label: item.name,
		ids: item.attributes.map( ( attr ) => attr.id ),
	} ) );
};
