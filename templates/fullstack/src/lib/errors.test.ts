import { describe, it, expect } from 'vitest';
import {
	AppError,
	ErrorType,
	ValidationError,
	AuthenticationError,
	AuthorizationError,
	NotFoundError,
	ConflictError,
	InternalError
} from '$lib/errors';

describe('AppError', () => {
	it('creates an error with all properties', () => {
		const err = new AppError(ErrorType.VALIDATION, 'test', 400, { field: 'email' });
		expect(err.message).toBe('test');
		expect(err.type).toBe(ErrorType.VALIDATION);
		expect(err.statusCode).toBe(400);
		expect(err.details).toEqual({ field: 'email' });
		expect(err.name).toBe('AppError');
		expect(err).toBeInstanceOf(Error);
	});
});

describe('Specific error types', () => {
	it('ValidationError defaults to 400', () => {
		const err = new ValidationError('Invalid input', { field: 'name' });
		expect(err.statusCode).toBe(400);
		expect(err.type).toBe(ErrorType.VALIDATION);
	});

	it('AuthenticationError defaults to 401', () => {
		const err = new AuthenticationError();
		expect(err.statusCode).toBe(401);
		expect(err.message).toBe('Not authenticated');
	});

	it('AuthorizationError defaults to 403', () => {
		const err = new AuthorizationError('Forbidden');
		expect(err.statusCode).toBe(403);
	});

	it('NotFoundError defaults to 404', () => {
		const err = new NotFoundError();
		expect(err.statusCode).toBe(404);
		expect(err.message).toBe('Resource not found');
	});

	it('ConflictError defaults to 409', () => {
		const err = new ConflictError();
		expect(err.statusCode).toBe(409);
	});

	it('InternalError normalizes unknown details', () => {
		const err = new InternalError('oops', 'string-details');
		expect(err.statusCode).toBe(500);
		expect(err.details).toEqual({ originalError: 'string-details' });
	});

	it('InternalError keeps object details', () => {
		const err = new InternalError('oops', { code: 'DB_FAIL' });
		expect(err.details).toEqual({ code: 'DB_FAIL' });
	});
});
