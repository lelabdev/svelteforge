import pino from 'pino';
import type { RequestEvent } from '@sveltejs/kit';

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

const browser = typeof window !== 'undefined';
const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';
const isProd = import.meta.env.PROD;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LoggerContext {
	[key: string]: unknown;
}

interface BaseLogger {
	info: (obj: LoggerContext, msg?: string) => void;
	warn: (obj: LoggerContext, msg?: string) => void;
	error: (obj: LoggerContext, msg?: string) => void;
	debug: (obj: LoggerContext, msg?: string) => void;
	child: (bindings: LoggerContext) => BaseLogger;
}

// ============================================================================
// BROWSER LOGGER (DEV ONLY - NO-OP IN PROD)
// ============================================================================

const createBrowserLogger = (): BaseLogger => {
	// In production browser, return a no-op logger for performance
	if (isProd) {
		return {
			info: () => {},
			warn: () => {},
			error: () => {},
			debug: () => {},
			child: () => createBrowserLogger()
		};
	}

	// In dev browser, use console with prefixes
	return {
		info: (obj, msg) => console.log('[INFO]', msg || '', obj),
		warn: (obj, msg) => console.warn('[WARN]', msg || '', obj),
		error: (obj, msg) => console.error('[ERROR]', msg || '', obj),
		debug: (obj, msg) => console.debug('[DEBUG]', msg || '', obj),
		child: () => createBrowserLogger()
	};
};

// ============================================================================
// SERVER LOGGER (PINO)
// ============================================================================

const pinoConfig: pino.LoggerOptions = {
	level: import.meta.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
	// Redact sensitive data
	redact: {
		paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'apiKey'],
		remove: true
	}
};

// Note: pino.transport() is not compatible with Vite's SSR (causes "option.transport do not allow stream" error)
// For pretty logs in dev, run: bun dev | pino-pretty
// Or use the DEBUG_LOG environment variable to enable JSON logs

// ============================================================================
// LOGGER INSTANCE
// ============================================================================

export const logger = (browser ? createBrowserLogger() : pino(pinoConfig)) as BaseLogger;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: LoggerContext): BaseLogger {
	return logger.child(context);
}

/**
 * Log HTTP request with timing
 */
export function logRequest(event: RequestEvent, duration: number): void {
	const { request } = event;
	logger.info(
		{
			method: request.method,
			url: request.url,
			userAgent: request.headers.get('user-agent'),
			duration,
			status: event.locals.responseStatus || 'unknown'
		},
		'Request completed'
	);
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: LoggerContext): void {
	logger.error(
		{
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			},
			...context
		},
		'Error occurred'
	);
}
