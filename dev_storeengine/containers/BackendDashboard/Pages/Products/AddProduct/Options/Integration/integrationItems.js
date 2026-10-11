import React, { useCallback, useEffect, useState } from 'react';
import { makeRequest2 } from '@Utils/helper';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { useDispatch } from 'react-redux';
import { Select } from '@Components/ui/Select';

import './styles.scss';
import debounce from 'just-debounce-it';

const propTypes = {};

export default function IntegrationItems( props ) {
	const { provider, setFieldValue } = props;
	const { values } = useFormikContext();
	const [ integrationItems, setIntegrationItems ] = useState( [] );
	const [ fetching, isFetching ] = useState( false );
	const dispatch = useDispatch();

	useEffect( () => {
		( async () => {
			if ( provider ) {
				try {
					handleSearchItems();
				} catch ( e ) {
					dispatch(
						showNotification( {
							message: e,
							isShow: true,
							type: 'error',
						} )
					);
				}
			}
		} )();
	}, [ provider ] );

	const handleSearchItems = async ( search = '' ) => {
		isFetching( true );
		let params = {
			provider,
			product_id: values.product_id,
		};
		if ( search ) {
			params = {
				...params,
				search,
			};
		}
		const response = await makeRequest2( 'get_product_integration_items', {
			...params,
		} );
		setIntegrationItems( response );
		isFetching( false );
	};

	const debouncedAPICall = useCallback(
		debounce( ( keyword ) => {
			handleSearchItems( keyword );
		}, 1000 ),
		[ handleSearchItems ]
	);

	const get_integration_dropdown_value = ( current ) => {
		if ( integrationItems?.items?.length ) {
			return integrationItems?.items.find(
				( item ) => item.value === current
			);
		}

		// return { label: __( 'Select Item', 'storeengine' ), value: '' };
	};

	return (
		<div className="storeengine-pt-6">
			{ provider && (
				<React.Fragment>
					{ integrationItems && (
						<React.Fragment>
							<label
								className="storeengine-title"
								htmlFor="integration-item-id"
							>
								{ integrationItems?.label }
							</label>
							<Select
								id="integration-item-id"
								label={ integrationItems?.label }
								className="storeengine-select storeengine-mt-2"
								classNamePrefix="storeengine-react-select"
								name="integration_id"
								value={
									provider === 'storeengine/course-bundle'
										? values.course_ids ?? []
										: get_integration_dropdown_value(
												values.integration_id
										  )
								}
								isMulti={
									provider === 'storeengine/course-bundle'
								}
								options={ integrationItems?.items ?? [] }
								suffix="select-integration"
								onInputChange={ debouncedAPICall }
								isLoading={ fetching }
								onChange={ ( option ) => {
									if (
										provider === 'storeengine/course-bundle'
									) {
										setFieldValue( 'course_ids', option );
									} else {
										setFieldValue(
											'integration_id',
											option.value
										);
										setFieldValue(
											'membership_access_group',
											option.value
										);
									}
								} }
							/>
						</React.Fragment>
					) }
				</React.Fragment>
			) }
		</div>
	);
}

IntegrationItems.propTypes = propTypes;
