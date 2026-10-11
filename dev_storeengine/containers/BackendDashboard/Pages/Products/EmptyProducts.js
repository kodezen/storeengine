import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@Components/ui';
import {
	admin_url,
	get_route_path,
	isAddonActive,
	setLiveAddons,
	canWriteResource,
} from '@Utils/helper';
import { saveAddon } from '@Redux/Slices/addonSlice/addonSlice';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

/**
 * First-run empty state for the Products list.
 *
 * Shown in place of the list table when the store has zero products (fresh
 * install, no search, "All" tab). Instead of an empty table it invites the
 * merchant to either create their first product or explore with demo data.
 *
 * Demo data lives behind the free `seeder` addon (Tools → Dummy Data). If the
 * addon is off we turn it on first, then hard-redirect — the seeder's AJAX
 * handlers only register on a PHP page load where the addon is active, so a
 * client-side navigate straight after activation would hit unregistered
 * endpoints.
 */

const PERKS = [
	{
		icon: 'box',
		title: __( 'Physical & digital', 'storeengine' ),
		note: __( 'Sell anything — goods, files, downloads', 'storeengine' ),
	},
	{
		icon: 'subscription',
		title: __( 'One-time or recurring', 'storeengine' ),
		note: __( 'Simple prices or subscription plans', 'storeengine' ),
	},
	{
		icon: 'inventory',
		title: __( 'Variations & inventory', 'storeengine' ),
		note: __( 'Options, stock and pricing per product', 'storeengine' ),
	},
];

const EmptyProducts = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const canCreate = canWriteResource( 'products', 'create' );
	const [ isPreparingDemo, setIsPreparingDemo ] = useState( false );

	const newProductPath = get_route_path( {
		page: 'storeengine-products',
		action: 'new',
	} );

	const goToDummyData = () => {
		// Hard reload (not SPA navigate): see the file-level note — the seeder's
		// endpoints register only on a page load where the addon is active.
		window.location.href = `${ admin_url }admin.php?page=storeengine-tools&path=dummy-data`;
	};

	const handleImportDemo = async () => {
		// Already active this page load — its Tools tab and endpoints are live,
		// so a plain SPA navigate is enough.
		if ( isAddonActive( 'seeder' ) ) {
			navigate(
				get_route_path( {
					page: 'storeengine-tools',
					path: 'dummy-data',
				} )
			);
			return;
		}

		setIsPreparingDemo( true );
		try {
			const { payload: response } = await dispatch(
				saveAddon( {
					addon_name: __( 'Seeder', 'storeengine' ),
					addon_slug: 'seeder',
					status: true,
				} )
			);

			if ( response && response.seeder ) {
				// Keep isAddonActive() in sync in case the redirect is delayed.
				setLiveAddons( response );
				dispatch(
					showNotification( {
						message: __(
							'Demo data tool enabled. Opening the importer…',
							'storeengine'
						),
						isShow: true,
						type: 'success',
					} )
				);
				goToDummyData();
				return;
			}

			setIsPreparingDemo( false );
			dispatch(
				showNotification( {
					message: __(
						'Could not activate the demo data tool. Enable “Seeder” from Add-ons and try again.',
						'storeengine'
					),
					isShow: true,
					type: 'error',
				} )
			);
		} catch ( e ) {
			setIsPreparingDemo( false );
		}
	};

	return (
		<div className="px-6 py-10">
			<div className="mx-auto w-full max-w-[680px]">
				<div className="overflow-hidden rounded-se border border-solid border-se-border bg-se-white">
					<div className="px-8 py-9 sm:px-10 sm:py-10">
						{/* Header */}
						<div className="flex items-start gap-5">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-se bg-se-primary-light text-[24px] text-se-primary">
								<span
									className="storeengine-icon storeengine-icon--products"
									aria-hidden={true}
								/>
							</div>

							<div>
								<h2 className="text-[28px] font-bold leading-tight tracking-tight text-se-text m-0">
									{__('Start building your catalog', 'storeengine')}
								</h2>

								<p className="mb-0 mt-2 max-w-[500px] text-sm leading-6 text-se-subtitle">
									{__(
										'Add your first product to start selling. You can also import demo products to explore how StoreEngine works.',
										'storeengine'
									)}
								</p>
							</div>
						</div>

						{/* Perks */}
						<div className="mt-9 grid gap-3 sm:grid-cols-3">
							{PERKS.map((perk) => (
								<div
									key={perk.title}
									className="rounded-se border border-solid border-se-border bg-se-bg p-4"
								>
									<span className="mb-3 flex h-9 w-9 items-center justify-center rounded-se bg-se-primary-light text-[15px] text-se-primary">
										<span
											className={`storeengine-icon storeengine-icon--${perk.icon}`}
											aria-hidden={true}
										/>
									</span>

									<span className="block text-[14px] font-semibold text-se-text">
										{perk.title}
									</span>

									<span className="mt-1 block text-xs leading-5 text-se-subtitle">
										{perk.note}
									</span>
								</div>
							))}
						</div>

						{/* Actions */}
						<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
							{canCreate && (
								<Link to={newProductPath}>
									<Button
										preset="primary"
										size="md"
										icon="storeengine-icon--add"
									>
										{__('Create your first product', 'storeengine')}
									</Button>
								</Link>
							)}

							<Button
								preset="outline"
								size="md"
								icon="storeengine-icon--import"
								isLoading={isPreparingDemo}
								onClick={handleImportDemo}
							>
								{isPreparingDemo
									? __('Opening demo importer…', 'storeengine')
									: __('Import demo products', 'storeengine')}
							</Button>
						</div>

						{/* Footer note */}
						<div className="mt-7 border-t border-solid border-se-border pt-5 text-center">
							<p className="text-[14px] leading-6 text-se-subtitle m-0">
								{__(
									'Demo products are sample data. You can remove them anytime from Tools → Dummy Data.',
									'storeengine'
								)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EmptyProducts;
