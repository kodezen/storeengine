import { __ } from '@wordpress/i18n';
import { Formik, Form } from 'formik';
import FormInner from './FormInner';

const ExportAndImport = () => {
	return (
		<>
			<Formik
				initialValues={ {
					export_type: '',
					import_type: '',
					rcp_export_type: '',
				} }
				onSubmit={ ( values ) => {} }
			>
				<Form>
					<FormInner />
				</Form>
			</Formik>
		</>
	);
};

export default ExportAndImport;
