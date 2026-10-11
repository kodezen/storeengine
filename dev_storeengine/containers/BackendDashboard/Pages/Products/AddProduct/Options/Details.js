import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { EmbRichText } from '@Components/EmbEmailEditor';
import Excerpt from './Excerpt';
import PostTitle from '@Components/PostTitle';
import Label from '@Components/Formik/Label';
import { Scope, Heading } from '@Components/ui';
import AiGenerateInline from './ai/AiGenerateInline';
import { FieldGate } from '../productFormConfig';

const Details = () => {
	const { values, setFieldValue, submitForm } = useFormikContext();

	const createOnBlur = () => {
		if ( ! values.id && values.title ) {
			setFieldValue( 'status', 'draft' );
			submitForm();
		}
	};

	return (
		<Scope
			as="div"
			id="details"
			className="storeengine-content-section"
		>
			<Heading as="p">{ __( 'General', 'storeengine' ) }</Heading>

			{ /* One 24px rhythm between fields; each field keeps its own 8px label gap. */ }
			<div className="flex flex-col gap-6">
				<div>
					<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-justify-between">
						<Label
							htmlFor="product-title"
							title={ __( 'Product Title', 'storeengine' ) }
						/>
						<AiGenerateInline field="title" targetName="title" />
					</div>
					<PostTitle
						id="product-title"
						name="title"
						label={ __( 'Add your product title here', 'storeengine' ) }
						postId={ values.id }
						defaultValue={ values.title }
						saveValueHandler={ setFieldValue }
						onBlurHandler={ createOnBlur }
					/>
				</div>
				<FieldGate id="excerpt">
					<Excerpt />
				</FieldGate>
				<FieldGate id="content">
					<div>
						<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-justify-between">
							<Label
								htmlFor="product-description"
								title={ __( 'Product Description', 'storeengine' ) }
							/>
							<AiGenerateInline
								field="description"
								onResult={ ( text ) => {
									setFieldValue( 'content', text );
								} }
							/>
						</div>
						<EmbRichText
							value={ values.content }
							onChange={ ( html ) => setFieldValue( 'content', html ) }
						/>
					</div>
				</FieldGate>
			</div>
		</Scope>
	);
};

export default Details;
