import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PREVIEW_FILE = join(
	ROOT,
	'packages/tiptap/templates/src/lib/components/svforge/tiptap/TiptapPreview.svelte'
);
const RENDERER_FILE = join(
	ROOT,
	'packages/tiptap/templates/src/lib/components/svforge/tiptap/render-tiptap.ts'
);

/**
 * Regression guards for #169 + #282 — TiptapPreview must escape/sanitize all
 * user content.
 *
 * Since #282 the sanitization lives in the PURE renderer (render-tiptap.ts,
 * behaviorally tested in tiptap-render.test.ts). The .svelte must NOT contain
 * any document-controlled interpolation itself — this file statically guards
 * that boundary so a future edit cannot reintroduce raw attribute
 * interpolation in the component.
 */
describe('TiptapPreview XSS prevention (#169/#282)', () => {
	const source = readFileSync(PREVIEW_FILE, 'utf-8');
	const renderer = readFileSync(RENDERER_FILE, 'utf-8');

	it('renders through the pure render-tiptap module', () => {
		expect(source).toMatch(/import \{ renderTiptap \} from '\.\/render-tiptap'/);
		expect(source).toMatch(/renderTiptap\(content\)/);
	});

	it('never interpolates document attributes into HTML in the .svelte', () => {
		// The two known breakout surfaces (#282): heading level and code block
		// language were interpolated directly into class attributes.
		expect(source).not.toMatch(/heading-\$\{/);
		expect(source).not.toMatch(/language-\$\{/);
		expect(source).not.toMatch(/attrs\?\./);
	});

	it('the pure renderer escapes text and restricts link protocols', () => {
		expect(renderer).toMatch(/export function escapeHtml/);
		expect(renderer).toMatch(/export function sanitizeHref/);
		expect(renderer).toMatch(/SAFE_PROTOCOLS/);
		expect(renderer).toMatch(/javascript|protocol/);
	});

	it('the pure renderer allowlists heading level, language token and target', () => {
		expect(renderer).toMatch(/export function clampHeadingLevel/);
		expect(renderer).toMatch(/export function sanitizeLanguage/);
		expect(renderer).toMatch(/export function sanitizeTarget/);
		expect(renderer).toMatch(/export function renderTiptap/);
	});

	it('still renders valid formatting marks (bold, italic, link)', () => {
		expect(renderer).toMatch(/'bold'/);
		expect(renderer).toMatch(/<strong>/);
		expect(renderer).toMatch(/'italic'/);
		expect(renderer).toMatch(/<em>/);
		expect(renderer).toMatch(/'link'/);
		expect(renderer).toMatch(/href=/);
	});
});
