import React, { useEffect, useState } from 'react';
import { makeRequest2 } from '@Utils/helper';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import Preloader from '@Components/Loader/Preloader';
import {
	Scope,
	Card,
	Stack,
	Row,
	Heading,
	SubTitle,
	Button,
	Input,
	Table,
	THead,
	TH,
	TR,
	TD,
	Checkbox,
} from '@Components/ui';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Dummy Data (seeder) tab — pilot page for the GemCRM-style `ui/` Tailwind kit.
 * Everything below renders inside <Scope> so `.se-admin-tw`-scoped utilities apply.
 */
const Seeder = () => {
	const dispatch = useDispatch();
	const [ isLoading, setIsLoading ] = useState( true );
	const [ isSeeding, setIsSeeding ] = useState( false );
	const [ isResetting, setIsResetting ] = useState( false );
	const [ providers, setProviders ] = useState( [] );
	const [ selected, setSelected ] = useState( {} );
	const [ counts, setCounts ] = useState( {} );
	const [ manifestCount, setManifestCount ] = useState( 0 );
	const [ isProduction, setIsProduction ] = useState( false );
	const [ force, setForce ] = useState( false );

	const applyData = ( data = {} ) => {
		if ( Array.isArray( data.providers ) ) {
			setProviders( data.providers );
			setSelected( ( prev ) => {
				const next = { ...prev };
				data.providers.forEach( ( p ) => {
					if ( next[ p.key ] === undefined ) {
						// Opt-in sets (default_selected === false) start unchecked.
						next[ p.key ] = p.default_selected !== false;
					}
				} );
				return next;
			} );
		}
		if ( typeof data.manifest_count !== 'undefined' ) {
			setManifestCount( data.manifest_count );
		}
		if ( typeof data.is_production !== 'undefined' ) {
			setIsProduction( data.is_production );
		}
	};

	const notify = ( message, type = 'success' ) =>
		dispatch( showNotification( { message, isShow: true, type } ) );

	useEffect( () => {
		( async () => {
			try {
				applyData( await makeRequest2( 'seeder_data' ) );
			} catch ( e ) {
				notify( e?.message || e || __( 'Failed to load seeder.', 'storeengine' ), 'error' );
			}
			setIsLoading( false );
		} )();
	}, [] );

	const seedHandler = async () => {
		const only = Object.keys( selected ).filter( ( key ) => selected[ key ] );
		if ( ! only.length ) {
			notify( __( 'Pick at least one data set to seed.', 'storeengine' ), 'error' );
			return;
		}
		setIsSeeding( true );
		try {
			const data = await makeRequest2( 'seeder_run', {
				only,
				counts: JSON.stringify( counts ),
				force,
			} );
			applyData( data );
			const parts = Object.entries( data.summary || {} ).map(
				( [ type, n ] ) => `${ n } ${ type }`
			);
			notify(
				parts.length
					? sprintf( __( 'Seeded: %s.', 'storeengine' ), parts.join( ', ' ) )
					: __( 'No records were created.', 'storeengine' ),
				parts.length ? 'success' : 'warning'
			);
		} catch ( e ) {
			notify( e?.message || e || __( 'Seeding failed.', 'storeengine' ), 'error' );
		}
		setIsSeeding( false );
	};

	const resetHandler = async () => {
		// eslint-disable-next-line no-alert
		if ( ! window.confirm( __( 'Delete all seeded data? This cannot be undone.', 'storeengine' ) ) ) {
			return;
		}
		setIsResetting( true );
		try {
			const data = await makeRequest2( 'seeder_reset' );
			applyData( data );
			notify(
				data.removed
					? sprintf( __( 'Removed %d seeded object(s).', 'storeengine' ), data.removed )
					: __( 'Nothing to reset.', 'storeengine' ),
				data.removed ? 'success' : 'warning'
			);
		} catch ( e ) {
			notify( e?.message || e || __( 'Reset failed.', 'storeengine' ), 'error' );
		}
		setIsResetting( false );
	};

	if ( isLoading ) {
		return <Preloader />;
	}

	return (
		<Scope>
			<Heading>{ __( 'Dummy Data', 'storeengine' ) }</Heading>

			<SubTitle className="mb-4">
				{ __(
					'Generate coherent sample data for quick testing and demos. Everything created here is tracked and can be removed again with one click. Development use only.',
					'storeengine'
				) }
			</SubTitle>

			{ isProduction && (
				<div className="flex items-start gap-2 rounded-se border border-se-warning bg-se-warning-light p-3 mb-4">
					<span className="storeengine-icon storeengine-icon--info-primary text-se-warning" />
					<span className="text-sm text-se-text">
						{ __(
							'Production environment detected. Seeding is blocked unless you tick the override below. Removing seeded data is always allowed.',
							'storeengine'
						) }
					</span>
				</div>
			) }

			<Table>
				<THead>
					<TR className="border-none">
						<TH className="w-9" />
						<TH>{ __( 'Data set', 'storeengine' ) }</TH>
						<TH>{ __( 'Depends on', 'storeengine' ) }</TH>
						<TH className="w-32">{ __( 'Count', 'storeengine' ) }</TH>
					</TR>
				</THead>
				<tbody>
					{ providers.map( ( provider ) => (
						<TR key={ provider.key }>
							<TD>
								<input
									type="checkbox"
									checked={ !! selected[ provider.key ] }
									onChange={ ( e ) =>
										setSelected( { ...selected, [ provider.key ]: e.target.checked } )
									}
								/>
							</TD>
							<TD>
								<div className="font-medium text-se-text">{ provider.label }</div>
								<code className="text-xs text-se-subtitle">{ provider.key }</code>
							</TD>
							<TD className="text-se-subtitle">
								{ provider.dependencies && provider.dependencies.length
									? provider.dependencies.join( ', ' )
									: '—' }
							</TD>
							<TD>
								<Input
									type="number"
									min="0"
									className="h-9"
									placeholder={ String( provider.default_count ) }
									value={ counts[ provider.key ] ?? '' }
									onChange={ ( e ) =>
										setCounts( { ...counts, [ provider.key ]: e.target.value } )
									}
								/>
							</TD>
						</TR>
					) ) }
				</tbody>
			</Table>

			<SubTitle className="mt-2">
				{ __(
					'Leave a count blank to use the data set’s default. Unchecking a set skips it (its dependencies are still seeded if another checked set needs them).',
					'storeengine'
				) }
			</SubTitle>

			{ isProduction && (
				<Checkbox
					className="mt-4 text-sm text-se-text"
					checked={ force }
					onChange={ setForce }
					label={ __( 'Yes, seed dummy data on this production environment.', 'storeengine' ) }
				/>
			) }

			<Row justify="start" className="mt-6">
				<Button preset="primary" isLoading={ isSeeding } onClick={ seedHandler }>
					{ __( 'Seed data', 'storeengine' ) }
				</Button>
				<Button
					preset="danger-soft"
					isLoading={ isResetting }
					disabled={ ! manifestCount }
					onClick={ resetHandler }
				>
					{ sprintf( __( 'Reset seeded data (%d)', 'storeengine' ), manifestCount ) }
				</Button>
			</Row>
		</Scope>
	);
};

export default Seeder;
