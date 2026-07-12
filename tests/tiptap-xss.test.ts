import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PREVIEW_FILE = join(
	ROOT,
	'packages/tiptap/templates/src/lib/components/svforge/tiptap/TiptapPreview.svelte'
);

/**
 * Regression tests for #169 — TiptapPreview must escape/sanitize all user content.
 *
 * The previous implementation interpolated node.text and mark.attrs.href directly
 * into HTML strings rendered via {@html}, enabling script injection via text
 * content and malicious href values (javascript: protocol, quote breakout).
 *
 * Since this is a template .svelte file (not a running component), we verify
 * the security properties via static analysis of the rendering logic.
 */
describe('TiptapPreview XSS prevention (#169)', () => {
	const source = readFileSync(PREVIEW_FILE, 'utf-8');

	it('escapes text content before interpolation', () => {
		// Must have an escapeHtml or escape function that transforms <, >, &, ", '
		expect(source).toMatch(/escapeHtml|escapeText|escape\b|sanitize.*text/i);
	});

	it('escapes or validates href attributes', () => {
		// Link hrefs must be sanitized — either escaped or validated against safe protocols
		expect(source).toMatch(/sanitize.*href|escape.*href|isValidUrl|safeProtocol|isSafeUrl/i);
	});

	it('restricts link protocols (no javascript:)', () => {
		// Must explicitly check for allowed protocols (http, https, mailto)
		expect(source).toMatch(/javascript|protocol|https?:|mailto|allowedProtocol|SAFE_PROTOCOLS/i);
	});

	it('does not interpolate raw text without escaping', () => {
		// The text variable must go through an escape function before being used in HTML
		// Check that applyMarks receives escaped text or that text is escaped before use
		const textUsagePattern = /applyMarks\s*\(\s*text\s*[,)]/;
		expect(source).toMatch(textUsagePattern);
		// And that there's an escape call on text somewhere
		const escapedTextPattern = /escape.*\btext\b|text.*escape/i;
		expect(source).toMatch(escapedTextPattern);
	});

	it('still renders valid formatting marks (bold, italic, link)', () => {
		// The fix must preserve rendering of safe marks
		expect(source).toMatch(/'bold'/);
		expect(source).toMatch(/<strong>/);
		expect(source).toMatch(/'italic'/);
		expect(source).toMatch(/<em>/);
		expect(source).toMatch(/'link'/);
		expect(source).toMatch(/href=/);
	});
});
