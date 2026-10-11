import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import FormHeading from '../../Component/FormHeading';
import SelectableCard from '../../Component/SelectableCard';

const StoreCategory = () => {
	const {
		values: { store_category },
	} = useFormikContext();

	const cards = [
		{
			key: 'ecommerce',
			icon: 'house',
			title: __( 'E-commerce', 'storeengine' ),
			subtitle: __( 'Physical & digital products', 'storeengine' ),
		},
		{
			key: 'education',
			icon: 'graduation-cap',
			title: __( 'Education', 'storeengine' ),
			subtitle: __( 'Courses, mentorship, sessions', 'storeengine' ),
		},
		{
			key: 'business',
			icon: 'briefcase',
			title: __( 'Business', 'storeengine' ),
			subtitle: __( 'Consulting, services, freelancing', 'storeengine' ),
		},
		{
			key: 'agency',
			icon: 'tv',
			title: __( 'Agency', 'storeengine' ),
			subtitle: __( 'Marketing, design, consulting', 'storeengine' ),
		},
		{
			key: 'saas',
			icon: 'rocket',
			title: __( 'SaaS', 'storeengine' ),
			subtitle: __( 'Software tools & subscriptions', 'storeengine' ),
		},
		{
			key: 'personal',
			icon: 'user-alt',
			title: __( 'Creator / Personal', 'storeengine' ),
			subtitle: __( 'Portfolio, personal brand', 'storeengine' ),
		},
		{
			key: 'blog',
			icon: 'blog',
			title: __( 'Blog', 'storeengine' ),
			subtitle: __( 'Content, education, health', 'storeengine' ),
		},
		{
			key: 'other',
			icon: 'grid',
			title: __( 'Other', 'storeengine' ),
			subtitle: __( 'Not listed above', 'storeengine' ),
		},
	];

	return (
		<div className="storeengine-setup-store-category">
			<FormHeading
				title={ __( 'What best describes your store?', 'storeengine' ) }
				subHeading={ __(
					'We use this to recommend add-ons and starter content tailored to your industry.',
					'storeengine'
				) }
			/>

			<div className="grid grid-cols-2 gap-3 mt-6 md:grid-cols-4">
				{ cards.map( ( c ) => (
					<SelectableCard
						key={ c.key }
						name={ `store_category.${ c.key }` }
						icon={ c.icon }
						title={ c.title }
						subtitle={ c.subtitle }
						active={ !! store_category?.[ c.key ] }
					/>
				) ) }
			</div>
		</div>
	);
};

export default StoreCategory;
