import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const POSTS_UTIL = join(ROOT, 'packages/blog/templates/src/lib/utils/posts.ts');
const ARTICLE_SERVER = join(ROOT, 'packages/blog/templates/src/routes/blog/[slug]/+page.server.ts');
const ADDON_INDEX = join(ROOT, 'packages/blog/src/index.ts');

/**
 * Regression tests for #173 + #185 — the blog addon must generate a working
 * MDsveX blog on modern `sv create` projects.
 *
 * #185: modern sv create (Kit 2.63 / vite-plugin-svelte 7) no longer generates
 * svelte.config.js — mdsvex must be wired in vite.config.ts via sveltekit({...}).
 * Also: sv >= 0.15 crashes on addons without an options object, so the blog
 * must define one (verified behaviorally in the CI scaffold, this file is the
 * source-level guard).
 */
describe('blog MDsveX scaffold (#173/#185)', () => {
	describe('posts.ts', () => {
		const source = readFileSync(POSTS_UTIL, 'utf-8');

		it('does not import PUBLIC_POSTS_DIR', () => {
			expect(source).not.toMatch(/PUBLIC_POSTS_DIR/);
		});

		it('defines a Post type with content field', () => {
			expect(source).toMatch(/content.*string|interface Post\b/s);
		});

		it('getPost returns content (not just metadata)', () => {
			expect(source).toMatch(/\.default|content.*mod|mod\.\w+/i);
		});
	});

	describe('article page server', () => {
		const source = readFileSync(ARTICLE_SERVER, 'utf-8');

		it('fetches the full post with content', () => {
			expect(source).toMatch(/getPost/);
		});

		it('returns 404 for missing slug', () => {
			expect(source).toMatch(/404|not found/i);
		});
	});

	describe('addon mdsvex integration (#185)', () => {
		const source = readFileSync(ADDON_INDEX, 'utf-8');

		it('patches vite.config.ts with a mdsvex integration', () => {
			expect(source).toMatch(/vite\.config\.ts/);
			expect(source).toMatch(/mdsvex/);
		});

		it('adds .md to the extensions list', () => {
			expect(source).toMatch(/extensions: \['\.svelte', '\.md'\]/);
		});

		it('still patches legacy svelte.config.js projects', () => {
			expect(source).toMatch(/svelte\.config\.js/);
		});

		it('defines empty addon options (sv >= 0.15 crash guard)', () => {
			expect(source).toMatch(/defineAddonOptions\(\)\.build\(\)/);
		});
	});
});

/**
 * All svforge modules must define addon options — sv >= 0.15 throws
 * `Object.entries(undefined)` in promptAddonQuestions when an explicitly
 * specified addon has no options object. This is the source-level guard;
 * the CI scaffold exercises it end-to-end.
 */
describe('module addon options guard (#185)', () => {
	const modules = ['blog', 'ui_toast', 'dnd', 'tiptap', 'graph', 'email', 'oauth', 'uploads'];

	for (const mod of modules) {
		it(`${mod} defines options (sv >= 0.15 crash guard)`, () => {
			const source = readFileSync(join(ROOT, `packages/${mod}/src/index.ts`), 'utf-8');
			expect(source).toMatch(/import \{[^}]*defineAddonOptions[^}]*\} from 'sv'/);
			// Options may be empty (.build() right away) or have .add(...) entries
			expect(source).toMatch(/options: defineAddonOptions\(\s*\)\s*(?:\.add|\.build)/);
		});
	}
});
