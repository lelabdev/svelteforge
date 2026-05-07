import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn utility', () => {
	it('merges class strings', () => {
		expect(cn('foo', 'bar')).toBe('foo bar');
	});

	it('handles conditional classes (truthy)', () => {
		expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
	});

	it('handles empty and undefined inputs', () => {
		expect(cn()).toBe('');
		expect(cn(undefined)).toBe('');
		expect(cn('')).toBe('');
	});

	it('handles mixed values', () => {
		expect(cn('a', undefined, 'b', null, 'c')).toBe('a b c');
	});

	it('merges tailwind classes intelligently (dedupes conflicting)', () => {
		// twMerge should resolve conflicting Tailwind classes
		expect(cn('px-2', 'px-4')).toBe('px-4');
		expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
	});

	it('preserves non-conflicting tailwind classes', () => {
		expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
	});
});
