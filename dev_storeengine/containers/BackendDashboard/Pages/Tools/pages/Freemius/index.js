import { __ } from '@wordpress/i18n';
import { Form, Formik, useFormikContext } from 'formik';
import React from 'react';
import { Scope, Card, Heading } from '@Components/ui';
import FormInner from './FormInner';

const Freemius = () => {
	return (
		<Scope>
			<Heading>{ __( 'Freemius Import', 'storeengine' ) }</Heading>

			<Formik
				initialValues={ {
					product_id: '',
					freemius_product_id: '',
					import_api_key: '',
				} }
				onSubmit={ ( values ) => {} }
			>
				<Form>
					<FormInner />
				</Form>
			</Formik>
		</Scope>
	);
};

export default Freemius;
