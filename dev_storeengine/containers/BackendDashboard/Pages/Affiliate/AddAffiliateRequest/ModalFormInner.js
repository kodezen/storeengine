import React, { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import Text from '@Components/Formik/Text';
import Password from '@Components/Formik/Password';
import { useSelector, useDispatch } from 'react-redux';
import { Formik, useFormikContext } from 'formik';
import {
	createNewAffiliate,
	addNewAffiliate,
} from '@Redux/Slices/affiliatesSlice/affiliatesSlice';
import { fetchAllUser } from '@Redux/Slices/userSlice/userSlice';
import { Select } from '@Components/ui/Select';
import { Scope, Button } from '@Components/ui';
import Gravatar from '@Components/Gravatar';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';

import './styles.scss';

const tabs = [
	{
		value: 'add',
		label: __( 'Add Affiliate', 'storeengine' ),
	},
	{
		value: 'create',
		label: __( 'Create Affiliate', 'storeengine' ),
	},
];

const CreateNewAffiliateUser = React.memo( () => {
	const { setFieldValue } = useFormikContext();

	const handleGeneratePassword = ( size = 12 ) => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
		let password = '';
		while ( password.length < size ) {
			password += chars[ ( Math.random() * chars.length ) | 0 ];
		}
		setFieldValue( 'password', password );
	};

	return (
		<>
			<div className="storeengine-d-flex storeengine-flex-gap-16">
				<Text
					title={ __( 'First Name', 'storeengine' ) }
					name={ 'first_name' }
					placeholder={ __( 'First name', 'storeengine' ) }
				/>
				<Text
					title={ __( 'Last Name', 'storeengine' ) }
					name={ 'last_name' }
					placeholder={ __( 'Last name', 'storeengine' ) }
				/>
			</div>
			<Text
				title={ __( 'Email', 'storeengine' ) }
				name="email"
				placeholder={ __( 'Affiliate email address.', 'storeengine' ) }
				isRequired={ true }
			/>
			<div className="affiliate-password-field">
				<Password
					id="password"
					title={ __( 'Password', 'storeengine' ) }
					name="password"
					placeholder={ __( 'Enter Your Password', 'storeengine' ) }
					isRequired={ true }
				/>
				<div className="storeengine-generate-coupon">
					<Button
						type="button"
						preset="ghost"
						onClick={ ( e ) => {
							e.preventDefault();
							handleGeneratePassword();
						} }
					>
						{ __( 'Generate Password', 'storeengine' ) }
					</Button>
				</div>
			</div>
		</>
	);
} );

const CreateAffiliateFromUser = React.memo( ( { setFieldValue, values } ) => {
	const users = useSelector( ( state ) => state.user.data );
	const dispatch = useDispatch();
	useEffect( () => {
		dispatch( fetchAllUser() );
	}, [] );
	const dropdownOptions = users?.map( ( user ) => ( {
		value: user.value,
		label: (
			<div className="storeengine-d-flex affiliate-user">
				<div className="user-avatar">
					<Gravatar
						hash={ user.hash }
						size={ 30 }
						alt={ user.label }
					/>
				</div>
				<div className="user-info">
					<h4 className="storeengine-title">
						{ user.label }{ ' ' }
						<span className="storeengine-subtitle">
							({ user.email })
						</span>
					</h4>
				</div>
			</div>
		),
	} ) );
	return (
		<Select
			className="storeengine-select"
			classNamePrefix="storeengine-react-select"
			placeholder={ __( 'Select Existing User', 'storeengine' ) }
			isClearable={ true }
			size='sm'
			value={
				users &&
				dropdownOptions.find(
					( item ) => item.value === values?.user_id
				)
			}
			options={ dropdownOptions }
			onChange={ ( option ) => {
				setFieldValue( 'user_id', option.value );
			} }
		/>
	);
} );

const ModalFormInner = ( { onRequestClose } ) => {
	const [ selectedTab, setSelectedTab ] = useState( 'create' );
	const dispatch = useDispatch();

	const onSubmitHandler = ( values, actions ) => {
		actions.setSubmitting( true );

		if ( selectedTab === 'add' ) {
			dispatch( addNewAffiliate( values.user_id ) ).then(
				( { payload: data } ) => {
					if ( data ) {
						onRequestClose();
					}
					actions.setSubmitting( false );
				}
			);
		}
		if ( ! values.email ) {
			dispatch(
				showNotification( {
					message: __( 'Email is required', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		} else if ( ! values.password ) {
			dispatch(
				showNotification( {
					message: __( 'password is required is required', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
		} else if ( selectedTab === 'create' ) {
			dispatch( createNewAffiliate( values ) ).then(
				( { payload: data } ) => {
					if ( ! data ) {
						dispatch(
							showNotification( {
								message: __( 'This email is already exists!', 'storeengine' ),
								isShow: true,
								type: 'error',
							} )
						);
					} else {
						dispatch(
							showNotification( {
								message: __(
									'Affiliate created successfully!', 'storeengine'
								),
								isShow: true,
								type: 'success',
							} )
						);
						onRequestClose();
					}
					actions.setSubmitting( false );
				}
			);
		}
	};
	return (
		<Formik
			enableReinitialize={ true }
			initialValues={ {} }
			onSubmit={ onSubmitHandler }
		>
			{ ( { setFieldValue, values, submitForm, isSubmitting } ) => {
				const canSubmit =
					selectedTab === 'create'
						? !! values.email?.trim() && !! values.password?.trim()
						: !! values.user_id;
				return (
					<Scope className="pb-6">
						<div className="storeengine-modal-tabs">
							{ tabs.map( ( tab, index ) => (
								<a
									key={ index }
									className={ `storeengine-modal-tabs__item ${
										selectedTab === tab.value
											? 'storeengine-active'
											: 'storeengine-not-active'
									}` }
									role="presentation"
									onClick={ ( e ) => {
										e.preventDefault();
										setSelectedTab( tab.value );
									} }
								>
									{ tab.label }
								</a>
							) ) }
						</div>
						{ selectedTab === 'create' ? (
							<CreateNewAffiliateUser
								setFieldValue={ setFieldValue }
								values={ values }
							/>
						) : (
							<CreateAffiliateFromUser
								setFieldValue={ setFieldValue }
								values={ values }
							/>
						) }
						<Button
							type="submit"
							className="mt-5"
							onClick={ submitForm }
							isLoading={ isSubmitting }
							disabled={ ! canSubmit }
						>
							{ __( 'Submit', 'storeengine' ) }
						</Button>
					</Scope>
				);
			} }
		</Formik>
	);
};

export default ModalFormInner;
