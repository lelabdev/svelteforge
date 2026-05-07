import { describe, it, expect } from 'vitest';
import { formatDateShort, formatDateTime, formatUserName } from '$lib/utils/formatters';

describe('formatDateShort', () => {
	it('formats a date with month abbreviation, day, and year', () => {
		const date = new Date('2026-01-25T10:00:00Z');
		const result = formatDateShort(date);
		// Result depends on locale, but should contain key parts
		expect(result).toContain('2026');
		expect(result).toContain('25');
	});

	it('handles Date objects', () => {
		const result = formatDateShort(new Date('2026-07-04'));
		expect(result).toContain('2026');
	});
});

describe('formatDateTime', () => {
	it('returns "-" for null', () => {
		expect(formatDateTime(null)).toBe('-');
	});

	it('returns "-" for undefined', () => {
		expect(formatDateTime(undefined)).toBe('-');
	});

	it('formats a date with time', () => {
		const date = new Date('2026-01-25T14:30:00');
		const result = formatDateTime(date);
		expect(result).toContain('2026');
		expect(result).toContain('25');
	});
});

describe('formatUserName', () => {
	it('joins first and last name', () => {
		expect(formatUserName('John', 'Doe')).toBe('John Doe');
	});

	it('returns only first name if last is null', () => {
		expect(formatUserName('John', null)).toBe('John');
	});

	it('returns only last name if first is null', () => {
		expect(formatUserName(null, 'Doe')).toBe('Doe');
	});

	it('returns null when both parts are empty/null', () => {
		expect(formatUserName(null, null)).toBeNull();
		expect(formatUserName(undefined, undefined)).toBeNull();
		expect(formatUserName('', '')).toBeNull();
	});

	it('preserves whitespace in names (filter(Boolean) keeps them)', () => {
		// filter(Boolean) keeps strings with whitespace, join adds a space
		const result = formatUserName('  John  ', '  Doe  ');
		expect(result).toBe('  John     Doe  ');
	});
});
