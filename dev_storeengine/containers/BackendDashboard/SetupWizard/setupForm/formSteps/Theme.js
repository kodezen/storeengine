import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { ablocks_status } from '@Utils/helper';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import PluginInstall from '../PluginInstall';
import FormikWizardContext from '../Context/FormikWizardContext';
import FormHeading from '../Component/FormHeading';
import { useFormikContext } from 'formik';

const Theme = () => {
	const navigate = useNavigate();
	const { handleNext, isLastStep } = useContext( FormikWizardContext );
	const {
		values: {
			store_category: {
				ecommerce = false,
				education = false,
				business = false,
				agency = false,
				personal = false,
				blog = false,
				saas = false,
				other = false,
			},
		},
	} = useFormikContext();
	const selectCategories = [];

	if ( ! other ) {
		if ( ecommerce ) {
			selectCategories.push( 'ecommerce' );
		}
		if ( education ) {
			selectCategories.push( 'education' );
		}
		if ( business ) {
			selectCategories.push( 'business' );
		}
		if ( agency ) {
			selectCategories.push( 'agency-2' );
		}
		if ( personal ) {
			selectCategories.push( 'personal' );
			selectCategories.push( 'portfolio-3' );
			selectCategories.push( 'travel' );
			selectCategories.push( 'photography' );
			selectCategories.push( 'miscellaneous' );
		}
		if ( blog ) {
			selectCategories.push( 'blog' );
			selectCategories.push( 'miscellaneous' );
		}
		if ( saas ) {
			selectCategories.push( 'saas' );
			selectCategories.push( 'agency-2' );
			selectCategories.push( 'miscellaneous' );
		}
	}

	const handleNavigate = () => {
		setTimeout( () => {
			navigate( '/congratulation' );
		}, 500 );
	};
	return (
		<div className="storeengine-setup-theme">
			<FormHeading
				title={ __( 'Make it yours', 'storeengine' ) }
				subHeading={ __(
					'Pick a starter design tailored to your industry — you can fully customize it afterwards.',
					'storeengine'
				) }
			/>

			{ ablocks_status === 'not-installed' ||
			ablocks_status === 'not-active' ? (
				<PluginInstall pluginName="aBlocks" />
			) : (
				applyFilters( 'ablocks.demo-importer.content', null, {
					selectedCat: selectCategories,
					handleNext: isLastStep ? handleNavigate : handleNext,
				} )
			) }
		</div>
	);
};

export default Theme;
