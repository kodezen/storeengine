import React from 'react';
import { __ } from '@wordpress/i18n';
import { get_assets_url } from '@Utils/helper';
import { Scope, Button } from '@Components/ui';
import { buildPurchaseUrl } from './helper';

const HireUs = ( { sdk } ) => {
	return (
		<Scope className="storeengine-hire-us">
			<div className="storeengine-hire-us__content">
				<h3 className="storeengine-hire-us__title">
					{ __(
						'Need Expert Help? Hire Our Professionals',
						'storeengine'
					) }
				</h3>
				<p className="storeengine-hire-us__desc">
					{ __(
						'Get access to a skilled team of designers, developers, marketers, and content experts—ready to bring your ideas to life.',
						'storeengine'
					) }
				</p>
				<div className="storeengine-hire-us__actions">
					<Button
						as="a"
						href={ buildPurchaseUrl(
							'https://kodezen.agency/request-a-free-call/',
							sdk
						) }
						target="_blank"
						rel="noreferrer"
						preset="primary"
						size="md"
					>
						{ __( 'Hire Us', 'storeengine' ) }
					</Button>
					<Button
						as="a"
						href={ buildPurchaseUrl(
							'https://kodezen.agency/',
							sdk
						) }
						target="_blank"
						rel="noreferrer"
						preset="outline"
						size="md"
					>
						{ __( 'Learn More', 'storeengine' ) }
					</Button>
				</div>
			</div>
			<div className="storeengine-hire-us__avatars">
				<div className="storeengine-hire-us__avatar-row">
					<img
						src={ "https://github.com/imrantushar/kodezen-assets/blob/master/images/employees.png?raw=true" }
						alt={ __( 'Kodezen Employees', 'storeengine' ) }
						title={ __( 'Kodezen Employees', 'storeengine' ) }
						className="storeengine-hire-us__avatar"
					/>
				</div>
			</div>
		</Scope>
	);
};

export default React.memo( HireUs );
