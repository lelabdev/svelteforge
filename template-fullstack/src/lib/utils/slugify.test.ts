import { describe, it, expect } from 'vitest';
import { slugify } from '$lib/utils/slugify';

describe('slugify', () => {
	it('converts a basic string to a slug', () => {
		expect(slugify('Hello World')).toBe('hello-world');
	});

	it('handles special characters', () => {
		expect(slugify('Hello, World!')).toBe('hello-world');
		expect(slugify('foo@bar.com')).toBe('foo-bar-com');
	});

	it('handles accented/unicode characters (NFD decomposition)', () => {
		expect(slugify('Café au lait')).toBe('cafe-au-lait');
		expect(slugify('résumé')).toBe('resume');
	});

	it('lowercases the string', () => {
		expect(slugify('UPPERCASE')).toBe('uppercase');
		expect(slugify('MiXeD CaSe')).toBe('mixed-case');
	});

	it('removes leading and trailing dashes', () => {
		expect(slugify('--hello--')).toBe('hello');
		expect(slugify('---test---')).toBe('test');
	});

	it('collapses multiple non-alphanumeric chars into single dash', () => {
		expect(slugify('foo   bar')).toBe('foo-bar');
		expect(slugify('a---b')).toBe('a-b');
	});

	it('returns empty string for empty input', () => {
		expect(slugify('')).toBe('');
	});

	it('handles strings with only special characters', () => {
		expect(slugify('!!!')).toBe('');
		expect(slugify('---')).toBe('');
	});
});
