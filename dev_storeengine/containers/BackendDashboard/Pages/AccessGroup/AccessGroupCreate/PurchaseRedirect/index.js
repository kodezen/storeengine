import Text from '@Components/Formik/Text';
import PostSelect from '@Components/PostSelect';
import { __ } from '@wordpress/i18n';
import { useFormikContext } from 'formik';
import { Select } from '@Components/ui/Select';
import '../../styles.scss';

const productEditOptions = [
	{ label: __( 'Default', 'storeengine' ), value: 'default' },
	{ label: __( 'Page', 'storeengine' ), value: 'page' },
	{ label: __( 'URL', 'storeengine' ), value: 'url' },
];

const PurchaseRedirect = () => {
	const { values, setFieldValue } = useFormikContext();
	return (
		<div
			id="purchase-redirect"
			className="storeengine-content-section storeengine-membership__purchase-redirect"
		>
			<h3 className="storeengine-heading">
				{ __( 'After Purchase Redirect', 'storeengine' ) }
			</h3>
			<div className="storeengine-mb-4">
				<label
					htmlFor="meta._storeengine_membership_purchase_redirect_type"
					className="storeengine-title"
				>
					{ __( 'Redirect type', 'storeengine' ) }
				</label>
				<Select
					className="storeengine-select storeengine-mt-2"
					classNamePrefix="storeengine-react-select"
					options={ productEditOptions }
					name="meta._storeengine_membership_purchase_redirect_type"
					value={
						productEditOptions.find(
							( item ) =>
								item.value ===
								values?.meta
									?._storeengine_membership_purchase_redirect_type
						) || null
					}
					onChange={ ( option ) =>
						setFieldValue(
							'meta._storeengine_membership_purchase_redirect_type',
							option ? option.value : ''
						)
					}
				/>
			</div>
			{ values?.meta?._storeengine_membership_purchase_redirect_type ===
				'page' && (
				<PostSelect
					title={ __( 'Page', 'storeengine' ) }
					name="meta._storeengine_membership_purchase_redirect_url"
					postType="page"
				/>
			) }
			{ values?.meta?._storeengine_membership_purchase_redirect_type ===
				'url' && (
				<Text
					title={ __( 'URL', 'storeengine' ) }
					name="meta._storeengine_membership_purchase_redirect_url"
					placeholder={ __(
						'Enter your redirect URL',
						'storeengine'
					) }
					type="url"
				/>
			) }
		</div>
	);
};

export default PurchaseRedirect;
