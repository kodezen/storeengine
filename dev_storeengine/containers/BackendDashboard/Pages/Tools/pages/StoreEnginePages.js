import React, { useEffect, useState } from 'react';
import { makeRequest2, get_route_path } from '@Utils/helper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLocationQuery } from '@Hooks';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { removeAdminNotice } from '@Redux/Slices/adminNoticeSlice/adminNoticeSlice';
import StoreEnginePageTable from './../components/StoreEnginePageTable';
import { Scope, Card, Heading, Button } from '@Components/ui';
import { __ } from '@wordpress/i18n';
import { getStoreEnginePages } from '@Redux/Slices/toolsSlice/toolsSlice';

const StoreEnginePages = () => {
	const [ isFetchPages, setIsFetchPages ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( false );
	const pages = useSelector( ( state ) => state.tools.pages );
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocationQuery();

	useEffect( () => {
		( async () => {
			if ( ! pages.length ) {
				setIsFetchPages( true );
				await dispatch( getStoreEnginePages() );
				setIsFetchPages( false );
			}
		} )();
	}, [] );

	const reGeneratePageHandler = async () => {
		setIsLoading( true );
		try {
			await makeRequest2( 'regenerate_storeengine_pages' );
			dispatch(
				showNotification( {
					message: __( 'Successfully Re-Generate Pages.', 'storeengine' ),
					isShow: true,
					type: 'success',
				} )
			);
			await dispatch( getStoreEnginePages() );
			// Admin notices are rendered from Redux state (seeded once at page
			// load), so the "missing core pages" notice won't disappear on its
			// own after this AJAX call — drop it from state now instead of
			// waiting for a page reload to recompute it server-side.
			dispatch( removeAdminNotice( 'missing_core_pages' ) );
		} catch ( e ) {
			dispatch(
				showNotification( {
					message: e,
					isShow: true,
					type: 'error',
				} )
			);
		}
		setIsLoading( false );
	};

	// Auto-run regeneration when arriving here from the "Generate Missing
	// Pages" admin notice (?regenerate=1), so the user isn't forced to click
	// the button again. Strip the param right away so a manual revisit/refresh
	// of this page falls back to the normal click-to-run behavior.
	useEffect( () => {
		if ( location.getValue( 'regenerate', null, null, 'bool' ) ) {
			navigate(
				get_route_path( { page: 'storeengine-tools', path: 'pages' } ),
				{ replace: true }
			);
			reGeneratePageHandler();
		}
	}, [] );

	return (
		<Scope>
			<Heading>{ __( 'StoreEngine Pages', 'storeengine' ) }</Heading>

			<div className="flex items-start gap-2 rounded-se border border-se-primary bg-se-primary-light p-3">
				<span className="storeengine-icon storeengine-icon--info-primary text-se-primary" />
				<span className="text-sm text-se-text">
					{ __(
						'This program will set up the remaining or missing Pages. Pages that have been established and configured will not be changed.',
						'storeengine'
					) }
				</span>
			</div>

			<div className="mt-5">
				<StoreEnginePageTable
					data={ pages }
					isFetchPages={ isFetchPages }
				/>
				<Button
					preset="primary"
					isLoading={ isLoading }
					onClick={ reGeneratePageHandler }
					className="mt-5 min-w-[190px]"
				>
					{ __( 'Re-Generate Pages', 'storeengine' ) }
				</Button>
			</div>
		</Scope>
	);
};

export default StoreEnginePages;
