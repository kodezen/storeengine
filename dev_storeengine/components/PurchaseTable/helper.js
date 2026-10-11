export const transformData = ( data, values ) => {
	return data.map( ( item ) => {
		if ( item.product_type === 'variable' ) {
			return {
				label: item.title.rendered,
				options: item?.variants
					.flatMap( ( variant ) => {
						const pricing = item.prices.find(
							( p ) =>
								parseInt( p.id ) ===
									parseInt( variant.pricing_id ) &&
								p.price_type !== 'subscription'
						);
						if ( ! pricing || variant.price === null ) {
							return [];
						}

						const variantLabel = variant.data
							.map( ( d ) => d.value )
							.join( '/' );
						let variationItemLabel = '';

						// if the variant label exists in purchase items
						const existingItem = values?.purchase_items?.find(
							( singleItem ) => {
								const isSimilarLabel =
									`${
										singleItem?.price_name
									} - ${ singleItem?.formatted_metadata
										.map( ( item ) => item.display_value )
										.join( '/' ) }` ===
									`${ pricing?.price_name } - ${ variantLabel }`;
								if ( isSimilarLabel ) {
									variationItemLabel = `${ singleItem?.price_name } - ${ variantLabel }`;
									return true;
								}
								return false;
							}
						);

						// if variant label doesn't match, add all available combinations for existing product price
						if ( ! existingItem ) {
							const allCombinations = item.variants.map(
								( v ) => {
									const vLabel = v.data
										.map( ( d ) => d.value )
										.join( '/' );
									return {
										...pricing,
										variation_id: v.id,
										pricing_id: v.pricing_id,
										price:
											parseInt( pricing?.price ?? 0 ) +
											parseInt( v?.price ?? 0 ),
										product_id: item.id,
										product_qty: 1,
										product_type: item.product_type,
										label: `${ pricing?.price_name } - ${ vLabel }`,
										formatted_metadata: v.data.map(
											( variantItem ) => ( {
												display_key: variantItem.label,
												display_value:
													variantItem.value,
											} )
										),
									};
								}
							);
							return allCombinations;
						}

						return [];
					} )
					.filter( ( option ) => option !== null ),
			};
		}
		return {
			label: item.title.rendered,
			options: item.prices
				.filter( ( price ) => price.price_type !== 'subscription' )
				.map( ( price ) => {
					const existingItem = values?.purchase_items?.find(
						( singleItem ) =>
							parseInt( singleItem.price_id ) ===
							parseInt( price.id )
					);
					if ( ! existingItem ) {
						return {
							...price,
							product_id: item.id,
							product_qty: 1,
						};
					}
					return null;
				} )
				.filter( ( option ) => option !== null ),
		};
	} );
};
