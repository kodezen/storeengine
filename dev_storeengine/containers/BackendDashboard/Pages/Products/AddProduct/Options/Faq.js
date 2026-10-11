import React from 'react';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Scope, Heading } from '@Components/ui';
import { enable_faqs, faq_mode } from '@Utils/helper';
import QaAccordion from '@Containers/BackendDashboard/Pages/Faqs/QaAccordion';

/**
 * Product FAQ panel.
 *
 * Only shown in "product only" mode — a simple inline Q&A editor. In "global"
 * mode FAQs are managed entirely from the FAQ Groups library (targeted by
 * category / brand / product rules), so this box is hidden to avoid duplication.
 */
const Faq = () => {
	const { values, setFieldValue } = useFormikContext();
	const faqs = values?.meta?._storeengine_product_faqs ?? [];

	const faqsEnabled = enable_faqs ?? true;
	const productOnly = ( faq_mode ?? 'global' ) === 'product_only';

	if ( ! faqsEnabled || ! productOnly ) {
		return null;
	}

	return (
		<Scope
			as="div"
			id="faq"
			className="storeengine-content-section storeengine-content-section--faq"
		>
			<Heading>{ __( 'FAQ', 'storeengine' ) }</Heading>
			<QaAccordion
				items={ faqs }
				onChange={ ( next ) =>
					setFieldValue( 'meta._storeengine_product_faqs', next )
				}
			/>
		</Scope>
	);
};

export default Faq;
