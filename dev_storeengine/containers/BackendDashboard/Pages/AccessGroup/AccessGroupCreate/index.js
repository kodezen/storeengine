import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Formik, Form } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AccessGroupForm from './AccessGroupForm';
import { getInitialValues } from './helper';
import TopBar from '@Components/TopBar';
import { Scope } from '@Components/ui';
import SaveSplitButton from '@Components/SaveSplitButton';
import Preloader from '@Components/Loader/Preloader';
import {
	createNewAccessGroup,
	getAccessGroup,
	updateAccessGroup,
} from '@Redux/Slices/accessGroupsSlice/accessGroupsSlice';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import NewAccessGroupModal from './NewAccessGroupModal';
import { canWriteResource } from '@Utils/helper';
import ReadOnlyNotice from '@Components/ReadOnlyNotice';

// Access-group status: "Active" (publish) is what the enforcement queries look
// for (HelperAddon::get_all_plans / get_all_groups filter post_status='publish');
// "Inactive" (draft) parks a group without deleting it so it stops restricting
// content but keeps its rules for later. The top-bar split save button sets it.

const AccessGroupCreate = ( { id } ) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	// View-only staff: keep the group readable but hide the write controls.
	const canEdit = canWriteResource( 'memberships', id ? 'update' : 'create' );
	const [ loading, setLoading ] = useState( true );
	const accessGroup = useSelector( ( state ) => state.accessGroups.data );
	// Onboarding step for brand-new access groups: prompt for a name first.
	// Initialised once from the id, so it only opens on a fresh create flow
	// and never re-opens after the user continues or while editing.
	const [ showStartModal, setShowStartModal ] = useState( ! id );
	const [ creatingDraft, setCreatingDraft ] = useState( false );

	// Move into edit mode for a saved group WITHOUT a full page reload. The
	// BackendDashboard router reads its params from useLocationQuery(), so a
	// relative `?query` navigation re-renders client-side (this is how the
	// product editor avoids reloading). The old code navigated to the absolute
	// `${route_path}admin.php?page=...` URL, which react-router treated as an
	// external location and hard-reloaded the whole admin page. Preserve the
	// current params (keeps `page=storeengine-membership-rules`) and just set
	// id + action.
	const goToEdit = ( editId ) => {
		const searchParams = new URLSearchParams( window.location.search );
		searchParams.set( 'id', editId );
		searchParams.set( 'action', 'edit' );
		navigate( `?${ searchParams.toString() }` );
	};

	useEffect( () => {
		if ( id ) {
			// If we already hold this group in state (just created via the modal,
			// or navigated in from the list), skip the network round-trip — that
			// refetch + Formik re-init is what made the create flow flash like a
			// reload. Only fetch when the record isn't loaded yet.
			const existing = accessGroup?.find(
				( group ) => parseInt( group?.id ) === parseInt( id )
			);
			if ( existing ) {
				setLoading( false );
				return;
			}
			dispatch( getAccessGroup( id ) ).then( () => setLoading( false ) );
		} else {
			setLoading( false );
		}
	}, [ id ] );

	// Continue from the onboarding modal: persist the group with the chosen
	// name immediately, then move into edit mode for the saved record.
	// Mirrors the create branch of onFormSubmitHandler so the rest of the
	// flow is identical. Created as `publish` (Active) so a new group takes
	// effect right away — an empty group (no rules yet) restricts nothing, and
	// the status selector in the editor lets the user set it Inactive if they
	// don't want it live yet.
	const handleCreateDraft = ( formProps, { title } ) => {
		setCreatingDraft( true );
		dispatch(
			createNewAccessGroup( {
				...formProps.values,
				title,
				status: 'publish',
			} )
		).then( ( { payload: data } ) => {
			setCreatingDraft( false );
			if ( ! data?.id ) {
				return;
			}
			setShowStartModal( false );
			formProps.setValues( getInitialValues( data.id, [ data ] ) );
			goToEdit( data.id );
		} );
	};

	const onFormSubmitHandler = ( values, actions ) => {
		if ( values.meta?._storeengine_membership_purchase_redirect_url ) {
			values.meta._storeengine_membership_purchase_redirect_url = `${ values.meta._storeengine_membership_purchase_redirect_url }`;
		}
		actions.setSubmitting( true );
		if ( values.title === '' ) {
			dispatch(
				showNotification( {
					message: __( 'Title Missing', 'storeengine' ),
					isShow: true,
					type: 'error',
				} )
			);
			actions.setSubmitting( false );
		} else if ( id ) {
			dispatch( updateAccessGroup( { id, values } ) ).then(
				( { payload } ) => {
					actions.setValues( getInitialValues( id, [ payload ] ) );
					actions.setSubmitting( false );
					goToEdit( id );
				}
			);
		} else {
			dispatch( createNewAccessGroup( values ) ).then(
				( { payload: data } ) => {
					actions.setValues( getInitialValues( data?.id, [ data ] ) );
					actions.setSubmitting( false );
					goToEdit( data?.id );
				}
			);
		}
	};

	// Split-save: the primary button activates (publish); "Save as Inactive" sets
	// draft. Either way it runs the normal Formik submit.
	const saveAccessGroup = async ( props, status ) => {
		const target = status || 'publish';
		if ( target !== props.values.status ) {
			await props.setFieldValue( 'status', target, false );
		}
		props.submitForm();
	};

	return (
		<>
			{ loading ? (
				<Preloader />
			) : (
				<Formik
					enableReinitialize={ true }
					initialValues={ getInitialValues( id, accessGroup ) }
					onSubmit={ onFormSubmitHandler }
				>
					{ ( props ) => {
						const { isSubmitting, dirty, values } = props;
						return (
						<Scope>
							<TopBar
								title={
									id
										? __( 'Access Group', 'storeengine' )
										: __(
												'Create Access Group',
												'storeengine'
										  )
								}
								render={ () =>
									canEdit ? (
										<div className="storeengine-d-flex storeengine-align-items-center storeengine-gap-2">
											<span
												style={ {
													padding: '3px 12px',
													borderRadius: '999px',
													fontSize: '0.7rem',
													fontWeight: 700,
													textTransform: 'uppercase',
													letterSpacing: '0.03em',
													whiteSpace: 'nowrap',
													...( 'publish' === values.status
														? { background: '#ecfdf3', color: '#067647' }
														: { background: '#f2f4f7', color: '#475467' } ),
												} }
											>
												{ 'publish' === values.status ? __( 'Active', 'storeengine' ) : __( 'Inactive', 'storeengine' ) }
											</span>
											<SaveSplitButton
												saving={ isSubmitting }
												primaryDisabled={ id && 'publish' === values.status && ! dirty }
												primaryLabel={ id && 'publish' === values.status ? __( 'Update Access Group', 'storeengine' ) : __( 'Publish', 'storeengine' ) }
												savingLabel={ __( 'Saving…', 'storeengine' ) }
												onSave={ ( status ) => saveAccessGroup( props, status ) }
												options={ [
													{ status: 'draft', title: __( 'Save as Inactive', 'storeengine' ), desc: __( 'Hidden from customers.', 'storeengine' ) },
												] }
											/>
										</div>
									) : null
								}
							/>
							<div className="storeengine-page-content">
								{ ! canEdit && <ReadOnlyNotice /> }
								<Form className="storeengine-create-product">
									<AccessGroupForm />
								</Form>
							</div>
							{ ! id && (
								<NewAccessGroupModal
									isOpen={ showStartModal }
									isSaving={ creatingDraft }
									onClose={ () => {
										if ( ! creatingDraft ) {
											setShowStartModal( false );
										}
									} }
									onContinue={ ( data ) =>
										handleCreateDraft( props, data )
									}
								/>
							) }
						</Scope>
						);
					} }
				</Formik>
			) }
		</>
	);
};

export default AccessGroupCreate;
