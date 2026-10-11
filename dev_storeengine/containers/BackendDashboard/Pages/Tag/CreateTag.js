import React from 'react';
import { __ } from '@wordpress/i18n';
import { Field, useFormikContext } from 'formik';
import { generateSlug } from '@Utils/helper';

export default function CreateTag() {
	const { values, setFieldValue } = useFormikContext();
	return (
		<React.Fragment>
			<div className="storeengine-term__item storeengine-mb-6">
				<label htmlFor="name" className="storeengine-title">
					{ __( 'Name', 'storeengine' ) }
				</label>
				<Field
					id="name"
					name="name"
					placeholder={ __( 'Add tag name here', 'storeengine' ) }
					onBlur={ ( e ) => {
						if ( parseInt( values.id ) === 0 ) {
							setFieldValue(
								'slug',
								generateSlug( e.target.value )
							);
						}
					} }
					className="storeengine-input storeengine-mt-2"
				/>
			</div>

			<div className="storeengine-term__item storeengine-mb-6">
				<label htmlFor="slug" className="storeengine-title">
					{ __( 'Slug', 'storeengine' ) }
				</label>
				<Field
					id="slug"
					name="slug"
					placeholder={ __( 'Add slug here', 'storeengine' ) }
					onBlur={ ( e ) => {
						if ( parseInt( values.id ) === 0 ) {
							setFieldValue(
								'slug',
								generateSlug( e.target.value )
							);
						}
					} }
					className="storeengine-input storeengine-mt-2"
				/>
			</div>

			<div className="storeengine-term__item">
				<label htmlFor="description" className="storeengine-title">
					{ __( 'Description', 'storeengine' ) }
				</label>
				<Field
					id="description"
					name="description"
					placeholder={ __(
						'Add tag description here',
						'storeengine'
					) }
					as="textarea"
					className="storeengine-textarea storeengine-mt-2"
				/>
			</div>
		</React.Fragment>
	);
}
