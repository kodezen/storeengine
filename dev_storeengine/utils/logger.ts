/**
 * Simple logger.
 * Dev logger.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isDev =
	typeof process !== 'undefined'
		? process.env.NODE_ENV !== 'production'
		: true;

const styles: Record< LogLevel, string > = {
	info: 'color: #3b82f6; font-weight: 600;', // blue
	warn: 'color: #f59e0b; font-weight: 600;', // amber
	error: 'color: #ef4444; font-weight: 700;', // red
	debug: 'color: #10b981; font-weight: 500;', // green
};

const baseStyle = 'color: #6b7280; font-weight: 400;'; // gray

type LogOptions = {
	context?: string;
	data?: unknown;
};

function log( level: LogLevel, message: string, options: LogOptions = {} ) {
	if ( ! isDev ) {
		return;
	}

	const { context, data } = options;

	const label = `%c[${ level.toUpperCase() }]`;
	const ctx = context ? `%c[${ context }]` : '';
	const msg = `%c${ message }`;

	const parts = [ label, ctx, msg ].filter( Boolean ).join( ' ' );

	const styleParts = [
		styles[ level ],
		context ? 'color: #a855f7; font-weight: 600;' : '', // purple for context
		baseStyle,
	].filter( Boolean );

	if ( data !== undefined ) {
		console[ level ]( parts, ...styleParts, '\n', data );
	} else {
		console[ level ]( parts, ...styleParts );
	}
}

export const logger = {
	info: ( msg: string, opts?: LogOptions ) => log( 'info', msg, opts ),
	warn: ( msg: string, opts?: LogOptions ) => log( 'warn', msg, opts ),
	error: ( msg: string, opts?: LogOptions ) => log( 'error', msg, opts ),
	debug: ( msg: string, opts?: LogOptions ) => log( 'debug', msg, opts ),
};

// End of file logger.ts
