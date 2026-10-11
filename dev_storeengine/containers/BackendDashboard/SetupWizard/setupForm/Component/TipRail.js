import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * "Did you know" side rail for the setup steps — quietly surfaces StoreEngine's
 * power features so the breadth registers without a feature-list lecture.
 * Purely educational; renders nothing on narrow screens.
 *
 * @param {Object} props
 * @param {Array}  props.tips [{ icon, tone, title, text }]
 */
const TONE = {
	primary: 'bg-se-primary-light text-se-primary',
	violet: 'bg-[#efeaff] text-[#7c5cff]',
	success: 'bg-se-success-light text-se-success',
	warning: 'bg-se-warning-light text-se-warning',
};

export default function TipRail( { tips = [] } ) {
	if ( ! tips.length ) {
		return null;
	}
	return (
		<aside className="hidden lg:block shrink-0 w-[280px] self-start rounded-se border border-solid border-se-border bg-se-bg p-5">
			<p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#7c5cff]">
				{ __( '◆ Did you know', 'storeengine' ) }
			</p>
			<div className="flex flex-col">
				{ tips.map( ( t, i ) => (
					<div
						key={ i }
						className="flex gap-3 py-3 border-b border-dashed border-se-border last:border-b-0"
					>
						<span
							className={ `flex h-8 w-8 shrink-0 items-center justify-center rounded-se text-[15px] ${
								TONE[ t.tone ] || TONE.primary
							}` }
							aria-hidden="true"
						>
							<span
								className={ `storeengine-icon storeengine-icon--${ t.icon }` }
							/>
						</span>
						<span>
							<span className="block text-[13px] font-semibold text-se-text">
								{ t.title }
							</span>
							<span className="block text-[12px] leading-snug text-se-subtitle">
								{ t.text }
							</span>
						</span>
					</div>
				) ) }
			</div>
		</aside>
	);
}
