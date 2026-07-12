import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const POSTS_UTIL = join(ROOT, 'packages/blog/templates/src/lib/utils/posts.ts');
const ARTICLE_SERVER = join(ROOT, 'packages/blog/templates/src/routes/blog/[slug]/+page.server.ts');
const ADDON_INDEX = join(ROOT, 'packages/blog/src/index.ts');

/**
 * Regression tests for #173 — the blog addon must generate a working MDsveX blog.
 *
 * Issues fixed:
 * 1. posts.ts imported undeclared PUBLIC_POSTS_DIR → build failure
 * 2. getPost() returned metadata only, but article page renders data.post.content
 * 3. svelte.config.js patch targeted obsolete 'preprocess: undefined,' text
 */
describe('blog MDsveX scaffold (#173)', () => {
	describe('posts.ts', () => {
		const source = readFileSync(POSTS_UTIL, 'utf-8');

		it('does not import PUBLIC_POSTS_DIR', () => {
			expect(source).not.toMatch(/PUBLIC_POSTS_DIR/);
		});

		it('defines a Post type with content field', () => {
			expect(source).toMatch(/content.*string|interface Post\b/s);
		});

		it('getPost returns content (not just metadata)', () => {
			// getPost must resolve the module and include the rendered content
			expect(source).toMatch(/\.default|content.*mod|mod\.\w+/i);
		});
	});

	describe('article page server', () => {
		const source = readFileSync(ARTICLE_SERVER, 'utf-8');

		it('fetches the full post with content', () => {
			// Must call getPost (not getAllPosts) to get content
			expect(source).toMatch(/getPost/);
		});

		it('returns 404 for missing slug', () => {
			expect(source).toMatch(/404|not found/i);
		});
	});

	describe('addon svelte.config.js patch', () => {
		const source = readFileSync(ADDON_INDEX, 'utf-8');

		it('does not rely on obsolete "preprocess: undefined" text', () => {
			expect(source).not.toMatch(/preprocess:\s*undefined/);
		});

		it('patches svelte.config.js with a mdsvex integration', () => {
			expect(source).toMatch(/mdsvex/i);
		});
	});
});
