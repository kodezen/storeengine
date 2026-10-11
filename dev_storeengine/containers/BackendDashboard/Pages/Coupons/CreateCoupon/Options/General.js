import React, { useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { copyToClipboard } from '@Utils/helper';
import Text from '@Components/Formik/Text';
import { Scope, Button, Heading } from '@Components/ui';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import { useDispatch } from 'react-redux';
import { useFormikContext } from 'formik';

import '../styles.scss';

const General = ( { ID } ) => {
	const dispatch = useDispatch();
	const { values, setFieldValue } = useFormikContext();
	const handleCopy = () => {
		const couponCode = values.meta._storeengine_coupon_name;

		copyToClipboard( couponCode );
		// translators: %s: Coupon code
		dispatch(
			showNotification( {
				message: sprintf(
					__( 'Coupon code "%s" copied to clipboard', 'storeengine' ),
					couponCode
				),
				isShow: true,
				type: 'success',
			} )
		);
	};

	const handleGenerateRandomCode = ( size = 8 ) => {
		const urlAlphabet = 'MSOP0123456789ABCDEFGHNRVQUKYTJLZXIW';
		let code = '';

		while ( code.length < size ) {
			code += urlAlphabet[ ( Math.random() * 36 ) | 0 ];
		}

		setFieldValue( 'meta._storeengine_coupon_name', code );

		if ( ! values?.title ) {
			setFieldValue( 'title', code );
		}
	};

	useEffect( () => {
		if (
			! ID &&
			( values?.meta?._storeengine_coupon_name ||
				values?.meta?._storeengine_coupon_name.trim() === '' )
		) {
			handleGenerateRandomCode();
		}
	}, [] );

	return (
		<Scope
			as="div"
			id="general"
			className="storeengine-content-section storeengine-content-section__general"
		>
			<Heading as="p">{ __( 'Coupon Details', 'storeengine' ) }</Heading>

			<div className="storeengine-flex storeengine-flex-gap-16 storeengine-flex-align-center">
				<Text
					title={ __( 'Coupon Name', 'storeengine' ) }
					prefix="product-title"
					placeholder={ __( 'Add title here', 'storeengine' ) }
					name="title"
					readOnly={ false }
				/>

				<Text
					title={ __( 'Coupon Code', 'storeengine' ) }
					prefix="product-title"
					placeholder={ __( 'Add coupon code here', 'storeengine' ) }
					name="meta._storeengine_coupon_name"
					readOnly={ false }
				/>

				<Button
					onClick={ handleCopy }
					preset="outline"
					icon="storeengine-icon--duplicate"
					disabled={ ! values?.meta?._storeengine_coupon_name }
					aria-label={ __(
						'Copy coupon code to clipboard',
						'storeengine'
					) }
				/>
				<div className="storeengine-title storeengine-generate-coupon">
					<Button
						type="button"
						preset="link"
						onClick={ ( e ) => {
							e.preventDefault();
							handleGenerateRandomCode();
						} }
					>
						{ __( 'Generate Random Code', 'storeengine' ) }
					</Button>
				</div>
			</div>
		</Scope>
	);
};

export default General;
