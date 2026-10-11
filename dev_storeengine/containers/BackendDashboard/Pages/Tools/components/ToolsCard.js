import React from 'react';
import { __ } from '@wordpress/i18n';

const cardData = [
	{
		icon: 'storeengine-icon storeengine-icon--pages',
		title: __( 'Documentation', 'storeengine' ),
		description: __(
			'Get familiar with the Academy LMS by exploring the detailed documentation section. You will be able to create an entire eLearning site easily by goring through the documentation.',
			'storeengine'
		),
		link_label: __( 'Documentation', 'storeengine' ),
		link: 'https://academylms.net/docs/',
	},
	{
		icon: 'storeengine-icon storeengine-icon--support',
		title: __( 'Need Help?', 'storeengine' ),
		description: __(
			'Need assistance in resolving the issues of your eLearning site and Academy LMS? We are available 24/7',
			'storeengine'
		),
		link_label: __( 'Get Help', 'storeengine' ),
		link: 'https://academylms.net/support/',
	},
	{
		icon: 'storeengine-icon storeengine-icon--community',
		title: __( 'Join the Community', 'storeengine' ),
		description: __(
			'Join our thriving community of educational institutes, businesses, instructors, developers, and LMS experts. With your contribution we will make our Academy LMS better',
			'storeengine'
		),
		link_label: __( 'Join the Community', 'storeengine' ),
		link: 'https://www.facebook.com/groups/190191189974852',
	},
];

const ToolsCard = () => {
	return (
		<>
			{ cardData.map( ( item, index ) => {
				return (
					<div className="storeengine-tools-card" key={ index }>
						<span className="storeengine-tools-card__icon">
							<span className={ item.icon }></span>
						</span>
						<h4 className="storeengine-tools-card__title">
							{ item.title }
						</h4>
						<p className="storeengine-tools-card__description">
							{ item.description }
						</p>
						<a
							className="storeengine-tools-card__link"
							href={ item.link }
							target="_blank"
							rel="noreferrer"
						>
							{ item.link_label }
							<span className="storeengine-icon storeengine-icon--arrow-right"></span>
						</a>
					</div>
				);
			} ) }
		</>
	);
};

export default ToolsCard;
