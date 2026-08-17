import { describe, it, expect } from 'vitest';
import { join } from 'node:path';

const ROOT = process.cwd();
const PAGINATION = join(
	ROOT,
	'packages/audit/templates/src/lib/server/audit/pagination.ts'
);

/**
 * Audit pagination hardening (#297): a negative or non-numeric limit must
 * never reach the query layer (LIMIT -10 is invalid SQL), and every value is
 * clamped to the explicit 1..100 range with a 50 default.
 */
const { parsePagination } = await import(PAGINATION);

const params = (limit?: string, offset?: string) => {
	const sp = new URLSearchParams();
	if (limit !== undefined) sp.set('limit', limit);
	if (offset !== undefined) sp.set('offset', offset);
	return sp;
};

describe('audit pagination clamp (#297)', () => {
	it('limit=-10 is clamped up to 1 (never a negative SQL LIMIT)', () => {
		expect(parsePagination(params('-10')).limit).toBe(1);
	});

	it('limit=0 is clamped up to 1 (valid range starts at 1)', () => {
		expect(parsePagination(params('0')).limit).toBe(1);
	});

	it('non-numeric limit falls back to the default 50', () => {
		expect(parsePagination(params('abc')).limit).toBe(50);
		expect(parsePagination(params('')).limit).toBe(50);
	});

	it('limit > max (100) is clamped to 100', () => {
		expect(parsePagination(params('500')).limit).toBe(100);
		expect(parsePagination(params('101')).limit).toBe(100);
	});

	it('valid in-range limits are preserved (1 and 100 are inclusive)', () => {
		expect(parsePagination(params('1')).limit).toBe(1);
		expect(parsePagination(params('50')).limit).toBe(50);
		expect(parsePagination(params('100')).limit).toBe(100);
	});

	it('fractional limits are truncated to integers', () => {
		expect(parsePagination(params('12.5')).limit).toBe(12);
	});

	it('offset is clamped to >= 0 (default 0)', () => {
		expect(parsePagination(params(undefined, '-5')).offset).toBe(0);
		expect(parsePagination(params(undefined, 'abc')).offset).toBe(0);
		expect(parsePagination(params(undefined, '25')).offset).toBe(25);
		expect(parsePagination(params(undefined, '3.7')).offset).toBe(3);
	});

	it('defaults when no params are provided', () => {
		expect(parsePagination(params())).toEqual({ limit: 50, offset: 0 });
	});
});
