import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import StatusCard from './../components/StatusCard';
import Preloader from '@Components/Loader/Preloader';
import { Scope, Card, Heading, cx, Button } from '@Components/ui';
import { __ } from '@wordpress/i18n';
import { getStoreEngineStatus } from '@Redux/Slices/toolsSlice/toolsSlice';
import { useLocationQuery, useClipboard } from '@Hooks';
import { useNavigate } from 'react-router-dom';
import { get_route_path, rtrim } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice.js';
import { decodeEntities } from '@wordpress/html-entities';

const tabs = [
	{
		label: __( 'WordPress Environment', 'storeengine' ),
		value: 'wordpress',
	},
	{
		label: __( 'Server Environment', 'storeengine' ),
		value: 'server',
	},
];

const TAB_BASE =
	'bg-transparent border-0 border-b-2 border-solid pb-2 text-sm cursor-pointer';
const TAB_ACTIVE = 'text-se-primary border-se-primary';
const TAB_IDLE = 'text-se-subtitle border-transparent';

const StoreEngineStatus = () => {
	const status = useSelector( ( state ) => state.tools.status );
	const [ isFetchStatus, setFetchStatus ] = useState(
		! status?.wordpress?.length || ! status?.server?.length
	);
	const { copy, isCopied } = useClipboard();
	const dispatch = useDispatch();

	const navigate = useNavigate();
	const location = useLocationQuery();
	const section = location.getValue(
		'section',
		'wordpress',
		tabs.map( ( t ) => t.value )
	);

	useEffect( () => {
		navigate(
			get_route_path( {
				page: 'storeengine-tools',
				path: 'status',
				section,
			} ),
			{ replace: true }
		);
	}, [ section ] );

	const systemReport = useMemo( () => {
		if ( ! status ) {
			return '';
		}

		const crlf = '\r\n';
		const hr = crlf + '---' + crlf;

		const buildSection = ( [ key, items ] ) => {
			const tab = tabs.find( ( t ) => t.value === key );
			if ( ! tab ) {
				return '';
			}

			const header = `## \u{2699}\u{FE0F} ${ tab.label }${ crlf }${ crlf }`;

			const body = ( items ?? [] )
				.map( ( { label, value } ) =>
					[ label, `\`${ decodeEntities( value ) }\`` ].join( ': ' )
				)
				.reduce( ( acc, line ) => acc.concat( line, crlf ), [] );

			return [ header, ...body, hr ].join( '' );
		};

		return Object.entries( status )
			.filter( ( [ key ] ) => tabs.some( ( t ) => t.value === key ) )
			.map( buildSection )
			.reduce( ( acc, section ) => acc + section, '' );
	}, [ status ] );

	useEffect( () => {
		( async () => {
			if ( ! status?.wordpress?.length || ! status?.server?.length ) {
				setFetchStatus( true );
				await dispatch( getStoreEngineStatus() );
				setFetchStatus( false );
			}
		} )();
	}, [] );

	return (
		<Scope>
			<Heading>{ __( 'Status', 'storeengine' ) }</Heading>
			
			{ isFetchStatus ? (
				<div className="py-10">
					<Preloader />
				</div>
			) : (
				<>
					<div className="relative flex items-start gap-4 border-0 border-b border-solid border-se-border mb-6">
						{ tabs.map( ( tab ) => (
							<button
								type="button"
								key={ tab.value }
								className={ cx(
									TAB_BASE,
									section === tab.value
										? TAB_ACTIVE
										: TAB_IDLE
								) }
								onClick={ () => {
									navigate(
										get_route_path( {
											page: 'storeengine-tools',
											path: 'status',
											section: tab.value,
										} ),
										{ replace: true }
									);
								} }
							>
								{ tab.label }
							</button>
						) ) }
						<Button
							preset="outline"
							size="xs"
							icon="storeengine-icon--copy"
							className="absolute bottom-0 right-0 mb-2"
							onClick={ async () => {
								await copy( systemReport );
								dispatch(
									showNotification( {
										message: __(
											'System report copied to clipboard.',
											'storeengine'
										),
										isShow: true,
										type: 'success',
									} )
								);
							} }
						>
							{ ! isCopied
								? __( 'Copy system report', 'storeengine' )
								: __( 'Copied!', 'storeengine' ) }
						</Button>
					</div>
					<div className="flex flex-wrap gap-x-6 gap-y-3">
						{ status[ section ]?.map(
							( { label, value, hint }, index ) => (
								<StatusCard
									key={ index }
									title={ label }
									value={ value }
									hint={ hint }
								/>
							)
						) }
					</div>
				</>
			) }
		</Scope>
	);
};

export default StoreEngineStatus;
