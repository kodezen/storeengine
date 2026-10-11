import React from 'react';

export type ButtonType = 'link' | 'button' | 'submit' | 'reset';

export type ButtonProps< Type extends ButtonType = 'button' > = {
	label: string | React.ReactNode;
	type: Type;
	preset:
		| 'red'
		| 'error'
		| 'light-red'
		| 'blue'
		| 'sky-blue'
		| 'light-blue'
		| 'gray'
		| 'white'
		| 'transparent'
		| 'white-border';
	size: 'sm' | 'md' | 'lg';
	isLoading: boolean;
	loadingLabel: string;
	icon: React.ReactNode;
	iconPosition: 'left' | 'right';
	isCircle: boolean;
	border: 'rounded' | 'white' | 'gray' | 'blue' | 'red';
	isDisabled: boolean;
	borderRadius: string;
	link: string;
	suffix: string;
	target: '_blank' | '_self';
	isPro: boolean;
	ariaLabel: string;
	ariaHidden: boolean;
} & Type extends 'link'
	? Omit<
			React.AnchorHTMLAttributes< HTMLAnchorElement >,
			'href' | 'target' | 'aria-hidden'
	  >
	: Omit<
			React.ButtonHTMLAttributes< HTMLButtonElement >,
			'disabled' | 'type' | 'aria-hidden'
	  >;
