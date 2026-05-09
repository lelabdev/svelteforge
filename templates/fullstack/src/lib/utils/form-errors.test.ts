import { describe, it, expect } from 'vitest';
import { getFormError } from '$lib/utils/form-errors';

describe('getFormError', () => {
	it('returns empty string for falsy values', () => {
		expect(getFormError(null)).toBe('');
		expect(getFormError(undefined)).toBe('');
		expect(getFormError('')).toBe('');
		expect(getFormError(0)).toBe('');
		expect(getFormError(false)).toBe('');
	});

	it('returns the string directly', () => {
		expect(getFormError('Required field')).toBe('Required field');
	});

	it('returns first element from array', () => {
		expect(getFormError(['Error 1', 'Error 2'])).toBe('Error 1');
	});

	it('returns empty string for empty array', () => {
		expect(getFormError([])).toBe('');
	});

	it('extracts from Zod 4 style { _errors: string[] } object', () => {
		expect(getFormError({ _errors: ['Invalid email'] })).toBe('Invalid email');
	});

	it('returns first _errors entry', () => {
		expect(getFormError({ _errors: ['Too short', 'Too long'] })).toBe('Too short');
	});

	it('returns empty string for object without _errors', () => {
		expect(getFormError({ foo: 'bar' })).toBe('');
	});

	it('returns empty string for _errors with empty array', () => {
		expect(getFormError({ _errors: [] })).toBe('');
	});
});
