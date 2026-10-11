import React from 'react';
import Text from '@Components/Formik/Text';
import Textarea from '@Components/Formik/Textarea';
import { __ } from '@wordpress/i18n';
import { Scope, Heading } from '@Components/ui';

const BasicSEO = () => {
	return (
		<Scope
			as="div"
			id="basicSEO"
			className="storeengine-content-section"
		>
			<Heading as="p">{ __( 'Basic SEO', 'storeengine' ) }</Heading>
			<div className="border border-se-border rounded-se p-3 mb-6">
				<h4 className="text-sm text-se-primary font-medium m-0">
					{ __( 'Product title', 'storeengine' ) }
				</h4>
				<p className="text-se-success font-normal text-xs my-[10px]">
					https://example.com/product-name
				</p>
				<p className="text-se-muted font-normal text-xs m-0">
					{ __(
						'Perfect fit, Premium Quality t-shirt that offers a much smoother, silky feel and more structured, mid-weight fit than the regular t-shirts .',
						'storeengine'
					) }
				</p>
			</div>
			<div>
				<Text
					title={ __( 'SEO site title', 'storeengine' ) }
					prefix="seo-title"
					placeholder="Add site title here"
					name="seoTitle"
					readOnly={ false }
				/>
				<Textarea
					title={ __( 'SEO site description', 'storeengine' ) }
					placeholder="Write your product description"
					name="seoDescription"
					readOnly={ false }
				/>
			</div>
		</Scope>
	);
};

export default BasicSEO;
