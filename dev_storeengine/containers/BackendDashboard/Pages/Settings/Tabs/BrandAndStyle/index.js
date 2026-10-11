import React from 'react';
import LogoUpload from '@Components/UploadImage/LogoUpload';
import { useFormikContext } from 'formik';
import Color from '@Components/Formik/Color';
import { __, _x } from '@wordpress/i18n';
import './styles.scss';

const BrandAndStyle = () => {
	const { values, setFieldValue } = useFormikContext();

	document.getElementById(
		'storeengine-admin-style-inline-css'
	).innerText = `
		:root {
			--storeengine-primary-color: ${ values?.global_primary_color };
			--storeengine-secondary-color: ${ values?.global_secondary_color };
			--storeengine-text-color: ${ values?.global_text_color };
			--storeengine-subtitle-color: ${ values?.global_subtitle_color };
			--storeengine-input-text-color: ${ values?.global_input_text_color };
			--storeengine-placeholder-color: ${ values?.global_placeholder_color };
			--storeengine-border-color: ${ values?.global_border_color };
			--storeengine-background-color: ${ values?.global_background_color };
		}
	`;

	return (
		<div
			id="settingsBrandAndStyle"
			className="storeengine-tab-content-brand-Style"
		>
			<div className="storeengine-content-section storeengine-tab-content--section">
				<h2 className="storeengine-heading">
					{ __( 'Add Logo', 'storeengine' ) }
				</h2>
				<div className="storeengine-tab-content-brandAndStyle__logo">
					<div className="logo-upload-section">
						<LogoUpload
							name={ 'store_logo' }
							saveValueHandler={ setFieldValue }
							value={ values?.store_logo }
							imageSize={ _x(
								'512X512 pixels',
								'Image size recommendation.',
								'storeengine'
							) }
							supportedFile={ __(
								'Support: PNG, JPG or jpeg.',
								'storeengine'
							) }
						/>
					</div>
				</div>
			</div>

			<div className="storeengine-content-section storeengine-tab-content--brand-color">
				<h2 className="storeengine-heading">
					{ __( 'Brand Color', 'storeengine' ) }
				</h2>
				<div className="storeengine-brand-color-section">
					<Color
						name="global_primary_color"
						title={ __( 'Primary Color', 'storeengine' ) }
						resetValue="#008DFF"
					/>
					<Color
						title={ __( 'Secondary Color', 'storeengine' ) }
						name="global_secondary_color"
						resetValue="#eae8fa"
					/>
					<Color
						name="global_text_color"
						title={ __( 'Text Color', 'storeengine' ) }
						resetValue="#1d2939"
					/>
					<Color
						name="global_subtitle_color"
						title={ __( 'Secondary Text Color', 'storeengine' ) }
						resetValue="#475467"
					/>
					<Color
						title={ __( 'Border Color', 'storeengine' ) }
						name="global_border_color"
						resetValue="#e4e7ec"
					/>
					<Color
						title={ __( 'Input Text Color', 'storeengine' ) }
						name="global_input_text_color"
						resetValue="#344054"
					/>
					<Color
						title={ __( 'Placeholder Color', 'storeengine' ) }
						name="global_placeholder_color"
						resetValue="#98a2b3"
					/>
					<Color
						title={ __( 'Background Color', 'storeengine' ) }
						name="global_background_color"
						resetValue="#f9fafb"
					/>
				</div>
			</div>
		</div>
	);
};

export default BrandAndStyle;
