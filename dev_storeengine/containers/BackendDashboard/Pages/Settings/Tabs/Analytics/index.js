import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import Checkbox from '@Components/Formik/Checkbox';
import { useFormikContext } from 'formik';
import { ContentSection } from '@Containers/BackendDashboard/Pages/Settings/Layouts';
import Notice from '@Components/Notice';
import { createInterpolateElement } from '@wordpress/element';
import StoreEngineSeparator from '@Components/StoreEngineSeparator';
import { Scope } from '@Components/ui';

import './styles.scss';

const CheckIcon = () => (
	<span
		className={ 'storeengine-icon storeengine-icon--filled-checkmark' }
		style={ {
			color: '#00AD6B',
			marginBottom: '-4px',
		} }
		aria-hidden={ true }
	/>
);

const Analytics = () => {
	const [ google, setGoogle ] = useState( false );
	const [ meta, setMeta ] = useState( false );

	return (
		<Scope>
		<ContentSection
			slug={ 'analytics' }
			label={ __( 'Analytics', 'storeengine' ) }
		>
			<div className="storeengine-content-section-content">
				<Checkbox
					title={ __(
						'Google Analytics / Google Tag Integration',
						'storeengine'
					) }
					desc={ __(
						'Enable this option if you are using Google Analytics or Google Tag Manager on your website.',
						'storeengine'
					) }
					name="analytics.google"
					suffix="storeengine-settings-analytics"
				/>

				<button
					type="button"
					onClick={ () => setGoogle( ! google ) }
					className="storeengine-btn-how-it-works"
				>
					{ __( 'How it works', 'storeengine' ) }
					<span
						className={ `storeengine-icon storeengine-icon${
							google ? '--arrow-down' : '--arrow-up'
						}` }
					/>
				</button>

				<div
					className={ `storeengine-expandable-section ${
						google ? 'storeengine-expandable-section--open' : ''
					}` }
				>
					<div className="storeengine-expandable-section-content">
						<div className="storeengine-analytics__wrap">
							<p className="storeengine-analytics__warn">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 20 20"
									fill="none"
								>
									<path
										d="M10 12.2917C9.65833 12.2917 9.375 12.0083 9.375 11.6667V7.5C9.375 7.15833 9.65833 6.875 10 6.875C10.3417 6.875 10.625 7.15833 10.625 7.5V11.6667C10.625 12.0083 10.3417 12.2917 10 12.2917Z"
										fill="#0078D9"
									/>
									<path
										d="M10.0001 14.9998C9.95008 14.9998 9.89175 14.9915 9.83341 14.9831C9.78341 14.9748 9.73341 14.9581 9.68341 14.9331C9.63341 14.9165 9.58341 14.8915 9.53341 14.8581C9.49175 14.8248 9.45008 14.7915 9.40841 14.7581C9.25841 14.5998 9.16675 14.3831 9.16675 14.1665C9.16675 13.9498 9.25841 13.7331 9.40841 13.5748C9.45008 13.5415 9.49175 13.5081 9.53341 13.4748C9.58341 13.4415 9.63341 13.4165 9.68341 13.3998C9.73341 13.3748 9.78341 13.3581 9.83341 13.3498C9.94175 13.3248 10.0584 13.3248 10.1584 13.3498C10.2167 13.3581 10.2667 13.3748 10.3167 13.3998C10.3667 13.4165 10.4167 13.4415 10.4667 13.4748C10.5084 13.5081 10.5501 13.5415 10.5917 13.5748C10.7417 13.7331 10.8334 13.9498 10.8334 14.1665C10.8334 14.3831 10.7417 14.5998 10.5917 14.7581C10.5501 14.7915 10.5084 14.8248 10.4667 14.8581C10.4167 14.8915 10.3667 14.9165 10.3167 14.9331C10.2667 14.9581 10.2167 14.9748 10.1584 14.9831C10.1084 14.9915 10.0501 14.9998 10.0001 14.9998Z"
										fill="#0078D9"
									/>
									<path
										d="M15.05 18.4665H4.94998C3.32498 18.4665 2.08331 17.8749 1.44998 16.8082C0.82498 15.7415 0.908313 14.3665 1.69998 12.9415L6.74998 3.8582C7.58331 2.3582 8.73331 1.5332 9.99998 1.5332C11.2666 1.5332 12.4166 2.3582 13.25 3.8582L18.3 12.9499C19.0916 14.3749 19.1833 15.7415 18.55 16.8165C17.9166 17.8749 16.675 18.4665 15.05 18.4665ZM9.99998 2.7832C9.21665 2.7832 8.44998 3.3832 7.84165 4.46654L2.79998 13.5582C2.23331 14.5749 2.14165 15.5082 2.53331 16.1832C2.92498 16.8582 3.79165 17.2249 4.95831 17.2249H15.0583C16.225 17.2249 17.0833 16.8582 17.4833 16.1832C17.8833 15.5082 17.7833 14.5832 17.2166 13.5582L12.1583 4.46654C11.55 3.3832 10.7833 2.7832 9.99998 2.7832Z"
										fill="#0078D9"
									/>
								</svg>
								<span className="storeengine-analytics__warn-label">
									{ __(
										'This plugin does not include or load the Google Analytics or Google Tag Manager scripts (gtag.js). You must install and configure analytics separately using one of the following methods:',
										'storeengine'
									) }
								</span>
							</p>
							<ul className="storeengine-analytics__items">
								<li className="storeengine-analytics__item">
									<CheckIcon />
									{ createInterpolateElement(
										__(
											'Using the <Link>Google Site Kit</Link> plugin',
											'storeengine'
										),
										{
											Link: (
												<a
													href="https://wordpress.org/plugins/google-site-kit/"
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										}
									) }
								</li>
								<li className="storeengine-analytics__item">
									<CheckIcon />
									{ __(
										'Using Google Tag Manager (GTM)',
										'storeengine'
									) }
								</li>
								<li className="storeengine-analytics__item">
									<CheckIcon />
									{ createInterpolateElement(
										__(
											'Manually adding the Google Analytics / gtag.js tracking code to your site’s <Code/> or footer',
											'storeengine'
										),
										{
											Code: <code>{ '<head>' }</code>,
										}
									) }
								</li>
							</ul>
							<p className="storeengine-analytics__footer">
								{ __(
									'Regardless of the method, Google Analytics must already be properly installed and tracking before enabling this option.',
									'storeengine'
								) }
							</p>
						</div>
					</div>
				</div>

				<StoreEngineSeparator isBottom={ true } />

				<Checkbox
					title={ __(
						'Meta (Facebook) Pixel Integration',
						'storeengine'
					) }
					desc={ __(
						'Enable this option if Meta (Facebook) Pixel is already installed and active on your website.',
						'storeengine'
					) }
					name="analytics.facebook"
					suffix="storeengine-settings-analytics"
				/>

				<button
					type="button"
					onClick={ () => setMeta( ! meta ) }
					className="storeengine-btn-how-it-works"
				>
					{ __( 'How it works', 'storeengine' ) }
					<span
						className={ `storeengine-icon storeengine-icon${
							meta ? '--arrow-down' : '--arrow-up'
						}` }
					/>
				</button>

				<div
					className={ `storeengine-expandable-section ${
						meta ? 'storeengine-expandable-section--open' : ''
					}` }
				>
					<div className="storeengine-expandable-section-content">
						<div className="storeengine-analytics__wrap">
							<p className="storeengine-analytics__warn">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 20 20"
									fill="none"
								>
									<path
										d="M10 12.2917C9.65833 12.2917 9.375 12.0083 9.375 11.6667V7.5C9.375 7.15833 9.65833 6.875 10 6.875C10.3417 6.875 10.625 7.15833 10.625 7.5V11.6667C10.625 12.0083 10.3417 12.2917 10 12.2917Z"
										fill="#0078D9"
									/>
									<path
										d="M10.0001 14.9998C9.95008 14.9998 9.89175 14.9915 9.83341 14.9831C9.78341 14.9748 9.73341 14.9581 9.68341 14.9331C9.63341 14.9165 9.58341 14.8915 9.53341 14.8581C9.49175 14.8248 9.45008 14.7915 9.40841 14.7581C9.25841 14.5998 9.16675 14.3831 9.16675 14.1665C9.16675 13.9498 9.25841 13.7331 9.40841 13.5748C9.45008 13.5415 9.49175 13.5081 9.53341 13.4748C9.58341 13.4415 9.63341 13.4165 9.68341 13.3998C9.73341 13.3748 9.78341 13.3581 9.83341 13.3498C9.94175 13.3248 10.0584 13.3248 10.1584 13.3498C10.2167 13.3581 10.2667 13.3748 10.3167 13.3998C10.3667 13.4165 10.4167 13.4415 10.4667 13.4748C10.5084 13.5081 10.5501 13.5415 10.5917 13.5748C10.7417 13.7331 10.8334 13.9498 10.8334 14.1665C10.8334 14.3831 10.7417 14.5998 10.5917 14.7581C10.5501 14.7915 10.5084 14.8248 10.4667 14.8581C10.4167 14.8915 10.3667 14.9165 10.3167 14.9331C10.2667 14.9581 10.2167 14.9748 10.1584 14.9831C10.1084 14.9915 10.0501 14.9998 10.0001 14.9998Z"
										fill="#0078D9"
									/>
									<path
										d="M15.05 18.4665H4.94998C3.32498 18.4665 2.08331 17.8749 1.44998 16.8082C0.82498 15.7415 0.908313 14.3665 1.69998 12.9415L6.74998 3.8582C7.58331 2.3582 8.73331 1.5332 9.99998 1.5332C11.2666 1.5332 12.4166 2.3582 13.25 3.8582L18.3 12.9499C19.0916 14.3749 19.1833 15.7415 18.55 16.8165C17.9166 17.8749 16.675 18.4665 15.05 18.4665ZM9.99998 2.7832C9.21665 2.7832 8.44998 3.3832 7.84165 4.46654L2.79998 13.5582C2.23331 14.5749 2.14165 15.5082 2.53331 16.1832C2.92498 16.8582 3.79165 17.2249 4.95831 17.2249H15.0583C16.225 17.2249 17.0833 16.8582 17.4833 16.1832C17.8833 15.5082 17.7833 14.5832 17.2166 13.5582L12.1583 4.46654C11.55 3.3832 10.7833 2.7832 9.99998 2.7832Z"
										fill="#0078D9"
									/>
								</svg>
								<span className="storeengine-analytics__warn-label">
									{ __(
										'This plugin does not include or load the Meta Pixel (Facebook Pixel) tracking script. You must install and configure the Pixel separately before enabling this setting.',
										'storeengine'
									) }
								</span>
							</p>

							<p className="storeengine-analytics__meta-warn">
								{ __(
									'You can set up Meta Pixel using one of the following methods:',
									'storeengine'
								) }
							</p>

							<ul className="storeengine-analytics__meta-items">
								<li className="storeengine-analytics__meta-item">
									<CheckIcon />
									{ createInterpolateElement(
										__(
											'Official plugin <Link>Meta pixel for WordPress</Link>',
											'storeengine'
										),
										{
											Link: (
												<a
													href="https://wordpress.org/plugins/official-facebook-pixel/"
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										}
									) }
								</li>
								<li className="storeengine-analytics__meta-item">
									<CheckIcon />
									{ __(
										'Using Google Tag Manager (GTM)',
										'storeengine'
									) }
								</li>
								<li className="storeengine-analytics__meta-item">
									<CheckIcon />
									{ createInterpolateElement(
										__(
											'Manually inserting the Meta Pixel JavaScript code into your site’s <Code/> or footer',
											'storeengine'
										),
										{
											Code: <code>{ '<head>' }</code>,
										}
									) }
								</li>
							</ul>

							<p className="storeengine-analytics__footer">
								{ __(
									'Make sure your Pixel is properly configured and tracking events before enabling this option.',
									'storeengine'
								) }
							</p>

							<p className="storeengine-analytics__footer storeengine-mt-6">
								<span className="storeengine-analytics__note">
									{ __( 'Note:', 'storeengine' ) }
								</span>
								{ __(
									'If you are deploying Meta Pixel through Google Tag Manager, you do not need to enable this Meta integration. Instead, enable the Google integration and configure your tags inside Google Tag Manager.',
									'storeengine'
								) }
							</p>
						</div>
					</div>
				</div>
			</div>
		</ContentSection>
		</Scope>
	);
};

Analytics.displayName = 'Analytics';

export default Analytics;
