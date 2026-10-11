import React from 'react';
import { __ } from '@wordpress/i18n';
import { useDispatch } from 'react-redux';
import Checkbox from '@Components/Formik/Checkbox';
import { copyToClipboard } from '@Utils/helper';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { Card, Heading, Title, Button } from '@Components/ui';

const FrontendSwitcher = () => {
	const dispatch = useDispatch();

	const handleCopyShortcode = async () => {
		const copied = await copyToClipboard( '[storeengine_currency_switcher]' );
		dispatch(
			showNotification( {
				message: copied
					? __( 'Shortcode copied', 'storeengine' )
					: __( 'Could not copy the shortcode', 'storeengine' ),
				isShow: true,
				type: copied ? 'success' : 'error',
			} )
		);
	};

	return (
		<Card>
			<Heading>{ __( 'Currency Switcher', 'storeengine' ) }</Heading>

			<Checkbox
				title={ __( 'Show Currency Switcher', 'storeengine' ) }
				subtitle={ __(
					'Let visitors switch between currencies directly on storefront. Display a currency switcher widget on the frontend.',
					'storeengine'
				) }
				name="multi_currency.show_switcher"
				suffix="currencies-switcher"
			/>

			<div className="flex justify-between items-center gap-3 mt-4">
				<Title as="p">{ __( 'Shortcode', 'storeengine' ) }</Title>
				<div className="flex items-center gap-2">
					<code className="px-3 py-2 rounded-se border border-se-border bg-se-bg text-sm">
						[storeengine_currency_switcher]
					</code>
					<Button
						type="button"
						preset="outline"
						size="xs"
						icon="storeengine-icon--copy"
						title={ __( 'Copy shortcode', 'storeengine' ) }
						onClick={ handleCopyShortcode }
					/>
				</div>
			</div>
		</Card>
	);
};

export default FrontendSwitcher;
