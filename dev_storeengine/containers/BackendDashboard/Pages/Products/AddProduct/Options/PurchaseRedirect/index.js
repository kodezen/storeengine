import Text from '@Components/Formik/Text';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import PostSelect from '@Components/PostSelect';
import { Scope, Heading } from '@Components/ui';

const productEditOptions = [
	{ label: __( 'Default', 'storeengine' ), value: 'default' },
	{ label: __( 'Page', 'storeengine' ), value: 'page' },
	{ label: __( 'URL', 'storeengine' ), value: 'url' },
];

const PurchaseRedirect = () => {
	const { values, setFieldValue } = useFormikContext();
	return (
		<Scope
			as="div"
			id="purchase-redirect"
			className="storeengine-content-section"
		>
			<Heading>
				{ __( 'After Purchase Redirect', 'storeengine' ) }
			</Heading>
			<div className="storeengine-mb-4">
				<label
					htmlFor="meta._storeengine_product_purchase_redirect_type"
					className="storeengine-title"
				>
					{ __( 'Redirect type', 'storeengine' ) }
				</label>
				<Select
					className="storeengine-select storeengine-mt-2"
					classNamePrefix="storeengine-react-select"
					options={ productEditOptions }
					name="meta._storeengine_product_purchase_redirect_type"
					value={
						productEditOptions.find(
							( item ) =>
								item.value ===
								values?.meta
									?._storeengine_product_purchase_redirect_type
						) || null
					}
					onChange={ ( option ) =>
						setFieldValue(
							'meta._storeengine_product_purchase_redirect_type',
							option ? option.value : ''
						)
					}
				/>
			</div>
			{ values?.meta?._storeengine_product_purchase_redirect_type ===
				'page' && (
				<PostSelect
					title={ __( 'Page', 'storeengine' ) }
					name="meta._storeengine_product_purchase_redirect_url"
					postType="page"
					position="top"
				/>
			) }
			{ values?.meta?._storeengine_product_purchase_redirect_type ===
				'url' && (
				<Text
					title={ __( 'URL', 'storeengine' ) }
					name="meta._storeengine_product_purchase_redirect_url"
					placeholder={ __(
						'Enter your redirect URL',
						'storeengine'
					) }
					type="url"
				/>
			) }
		</Scope>
	);
};

export default PurchaseRedirect;
