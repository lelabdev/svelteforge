/**
 * Standardized error types for SvelteForge application
 */

export enum ErrorType {
	VALIDATION = 'VALIDATION_ERROR',
	AUTHENTICATION = 'AUTHENTICATION_ERROR',
	AUTHORIZATION = 'AUTHORIZATION_ERROR',
	NOT_FOUND = 'NOT_FOUND_ERROR',
	CONFLICT = 'CONFLICT_ERROR',
	INTERNAL = 'INTERNAL_SERVER_ERROR'
}

export class AppError extends Error {
	constructor(
		public type: ErrorType,
		message: string,
		public statusCode: number = 500,
		public details?: Record<string, unknown>
	) {
		super(message);
		this.name = 'AppError';
	}
}

// Specific error types
export class ValidationError extends AppError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(ErrorType.VALIDATION, message, 400, details);
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string = 'Not authenticated') {
		super(ErrorType.AUTHENTICATION, message, 401);
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string = 'Not authorized') {
		super(ErrorType.AUTHORIZATION, message, 403);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Resource not found') {
		super(ErrorType.NOT_FOUND, message, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message: string = 'Resource already exists') {
		super(ErrorType.CONFLICT, message, 409);
	}
}

export class InternalError extends AppError {
	constructor(
		message: string = 'Internal server error',
		details?: Record<string, unknown> | unknown
	) {
		// Wrap unknown details in an object
		const normalizedDetails =
			details && typeof details === 'object' && !Array.isArray(details)
				? (details as Record<string, unknown>)
				: { originalError: details };
		super(ErrorType.INTERNAL, message, 500, normalizedDetails);
	}
}
