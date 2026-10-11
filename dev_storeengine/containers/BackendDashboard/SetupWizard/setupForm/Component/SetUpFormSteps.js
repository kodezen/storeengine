import { __ } from '@wordpress/i18n';
import { admin_url, plugin_root_url } from '@Utils/helper';
import { cx } from '@Components/ui';
import { useNavigate } from 'react-router-dom';

const SetupFormSteps = ( { steps, currentStepIndex, handleNext } ) => {
	const navigate = useNavigate();
	const lastIndex = steps.length - 1;

	return (
		<div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-6 border-b border-solid border-se-border bg-se-white px-6 py-3.5">
			<img
				className="h-7 shrink-0 justify-self-start"
				src={ `${ plugin_root_url }assets/images/full-logo.svg` }
				alt={ __( 'StoreEngine', 'storeengine' ) }
			/>

			<ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 m-0 p-0 list-none justify-self-center">
				{ steps.map( ( step, idx ) => {
					const done = currentStepIndex > idx;
					const active = currentStepIndex === idx;
					return (
						<li
							key={ idx }
							className="flex items-center gap-2 m-0"
						>
							<span
								className={ cx(
									'flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold transition-colors',
									done &&
										'border-se-success bg-se-success text-white',
									active &&
										'border-se-primary bg-se-primary-light text-se-primary',
									! done &&
										! active &&
										'border-se-border bg-se-white text-se-subtitle'
								) }
							>
								{ done ? (
									<span className="storeengine-icon storeengine-icon--check" />
								) : (
									idx + 1
								) }
							</span>
							<span
								className={ cx(
									'text-[12.5px] font-semibold whitespace-nowrap',
									active
										? 'text-se-primary'
										: done
										? 'text-se-text'
										: 'text-se-subtitle'
								) }
							>
								{ step?.title }
							</span>
							{ idx !== lastIndex && (
								<span className="mx-1 h-px w-6 bg-se-border" aria-hidden="true" />
							) }
						</li>
					);
				} ) }
			</ol>

			<div className="flex shrink-0 items-center gap-3 justify-self-end">
				<button
					type="button"
					className="text-[13px] font-semibold text-se-placeholder hover:text-se-primary cursor-pointer border-0 bg-transparent"
					onClick={ () => {
						handleNext();
						if ( currentStepIndex === lastIndex ) {
							navigate( '/congratulation' );
						}
					} }
				>
					{ __( 'Skip', 'storeengine' ) }
				</button>
				<a
					href={ `${ admin_url }admin.php?page=storeengine` }
					aria-label={ __( 'Close setup wizard', 'storeengine' ) }
					className="flex h-8 w-8 items-center justify-center rounded-full border border-solid border-se-border bg-se-bg text-se-subtitle no-underline hover:border-se-primary hover:text-se-text"
				>
					<span className="storeengine-icon storeengine-icon--close" />
				</a>
			</div>
		</div>
	);
};

export default SetupFormSteps;
