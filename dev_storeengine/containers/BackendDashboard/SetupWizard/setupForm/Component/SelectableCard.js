import React from 'react';
import { Field } from 'formik';
import { cx } from '@Components/ui';

/**
 * Formik-aware selectable capability card for the setup wizard.
 *
 * Renders a visually-hidden checkbox (kept functional for Formik) inside a
 * clickable card that shows an icon, title, subtitle and an optional "Enables"
 * line naming the powerful addon the choice turns on — so the breadth of
 * StoreEngine reads at a glance. A tick badge appears when selected.
 *
 * @param {Object}   props
 * @param {string}   props.name     Formik field name (supports dot paths).
 * @param {string}   props.id       Input id (defaults to name).
 * @param {string}   props.icon     storeengine-icon modifier (e.g. 'box') or null.
 * @param {string}   props.title    Card title.
 * @param {string}   [props.subtitle] Supporting line.
 * @param {string}   [props.enables]  Small "Enables · …" hint.
 * @param {boolean}  props.active   Whether the field is currently checked.
 * @param {boolean}  [props.disabled]
 * @param {Function} [props.onClick] Extra click handler (e.g. reset siblings).
 */
export default function SelectableCard( {
	name,
	id,
	icon,
	title,
	subtitle,
	enables,
	active,
	disabled = false,
	onClick,
} ) {
	const inputId = id || name;
	return (
		<label
			htmlFor={ inputId }
			className={ cx(
				'group relative flex flex-col gap-1.5 rounded-se border border-solid p-3 select-none',
				'transition-colors duration-150',
				disabled
					? 'cursor-not-allowed opacity-55 border-se-border bg-se-bg'
					: 'cursor-pointer',
				active
					? 'border-se-primary bg-se-primary-light'
					: 'border-se-border bg-se-white hover:border-se-primary'
			) }
		>
			<Field
				id={ inputId }
				name={ name }
				type="checkbox"
				disabled={ disabled }
				onClick={ onClick }
				/* `storeengine-setup-wizard-checkbox` opts this input out of the
				   global "checkbox → switch" styling so it stays a truly hidden
				   control; selection is expressed by the card highlight + tick. */
				className="sr-only storeengine-setup-wizard-checkbox"
			/>

			<span
				className={ cx(
					'flex h-8 w-8 items-center justify-center rounded-se text-[16px] transition-colors',
					active
						? 'bg-white text-se-primary'
						: 'bg-se-bg text-se-subtitle'
				) }
				aria-hidden="true"
			>
				{ icon ? (
					<span className={ `storeengine-icon storeengine-icon--${ icon }` } />
				) : (
					<span className="storeengine-icon storeengine-icon--check" />
				) }
			</span>

			<span className="text-sm font-semibold text-se-text leading-tight">
				{ title }
			</span>
			{ subtitle && (
				<span className="text-xs text-se-subtitle leading-snug">
					{ subtitle }
				</span>
			) }
			{ enables && (
				<span className="mt-1 text-[11px] font-semibold text-se-primary">
					{ enables }
				</span>
			) }

			<span
				className={ cx(
					'absolute right-3 top-3 h-5 w-5 items-center justify-center rounded-full bg-se-primary text-white text-[11px] font-bold',
					active ? 'flex' : 'hidden'
				) }
				aria-hidden="true"
			>
				<span className="storeengine-icon storeengine-icon--check" />
			</span>
		</label>
	);
}
