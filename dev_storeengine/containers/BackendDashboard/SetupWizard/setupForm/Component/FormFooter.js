import React from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@Components/ui';
import { useNavigate } from 'react-router-dom';

export default function FormFooter( {
	isPrevDisabled,
	isLastStep,
	handlePrev,
	handleNext,
	loading,
} ) {
	const navigate = useNavigate();
	return (
		<div className="storeengine-setup-form__footer storeengine-flex storeengine-flex-justify-between storeengine-mt-10">
			<Button
				preset="ghost"
				onClick={ handlePrev }
				icon="storeengine-icon--arrow-left"
				disabled={ isPrevDisabled }
			>
				{ __( 'Back', 'storeengine' ) }
			</Button>
			<Button
				preset="primary"
				onClick={ () =>
					isLastStep
						? setTimeout( () => {
								handleNext();
								navigate( '/congratulation' );
						  }, 500 )
						: handleNext()
				}
				iconRight="storeengine-icon--right-arrow"
				isLoading={ loading }
			>
				{ isLastStep
					? __( 'Finish', 'storeengine' )
					: __( 'Continue', 'storeengine' ) }
			</Button>
		</div>
	);
}
