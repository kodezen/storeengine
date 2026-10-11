import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Button } from '@Components/ui';
import AiGenerateInline from './ai/AiGenerateInline';

export default function Excerpt() {
	const { values, setFieldValue } = useFormikContext();
	const [ showProductSummary, setShowProductSummary ] = useState( false );
	return (
		<div className="storeengine-flex storeengine-flex-column storeengine-flex-gap-8">
			<div className="storeengine-flex storeengine-flex-align-center storeengine-flex-gap-8">
				<label htmlFor="excerpt" className="storeengine-title">
					{ __( 'Product Summery', 'storeengine' ) }
				</label>
				<Button
					preset="ghost"
					icon="storeengine-icon--edit"
					onClick={ () => setShowProductSummary( ! showProductSummary ) }
					size="sm"
					aria-label={
						values.excerpt
							? __( 'Edit Product Summery', 'storeengine' )
							: __( 'Add Product Summery', 'storeengine' )
					}
				/>
				<AiGenerateInline field="short_description" targetName="excerpt" />
			</div>
			{ showProductSummary && (
				<textarea
					id="excerpt"
					value={ values.excerpt }
					placeholder={ __( 'Add product summary…', 'storeengine' ) }
					onChange={ ( e ) => setFieldValue( 'excerpt', e.target.value ) }
					className="storeengine-textarea storeengine-p-4 storeengine-h-auto"
				/>
			) }
			{ values.excerpt && ! showProductSummary && (
				<span
					className="storeengine-title-subtitle"
					dangerouslySetInnerHTML={ { __html: values.excerpt } }
				/>
			) }
		</div>
	);
}
