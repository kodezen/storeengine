export const getInitialShippingData = ( data = null ) => {
	const schema = {
		zone_name: '',
		zone_locations: [],
		shipping_methods: [],
	};
	if ( data ) {
		const { zone_id, zone_name, zone_locations, shipping_methods } = data;
		return {
			zone_id,
			zone_name,
			zone_locations: zone_locations ?? [],
			shipping_methods: shipping_methods ?? [],
		};
	}
	return schema;
};
