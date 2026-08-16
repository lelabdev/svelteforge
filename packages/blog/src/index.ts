import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

export default defineAddon({
	id: 'svforge-blog',
	alias: 'forge-blog',
	shortDescription: 'SVForge Blog — MDsveX blog with posts list and article pages',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options are required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),
	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Blog requires SvelteKit');
	},
	run: ({ sv }) => {
		sv.dependency('mdsvex', '^0.12.8');

		// ── mdsvex integration ──
		// Modern `sv create` (Kit 2.63 / vite-plugin-svelte 7) no longer
		// generates svelte.config.js — the config lives in vite.config.ts via
		// sveltekit({...}). mdsvex must be wired there (extensions + preprocess).
		// Old projects still have svelte.config.js — patch both when present.
		sv.file('vite.config.ts', (content) => {
			if (!content || content.includes('mdsvex')) return content;
			let updated = content;
			if (!updated.includes("from 'mdsvex'")) {
				updated = updated.replace(
					/import\s+\{[^}]+\}\s+from\s+'@sveltejs\/kit\/vite';/,
					"import { mdsvex } from 'mdsvex';\n$&"
				);
			}
			const integration = "extensions: ['.svelte', '.md'], preprocess: mdsvex({ extensions: ['.md'] })";
			if (/sveltekit\(\)/.test(updated)) {
				// sveltekit() without options (single-line plugin entry)
				updated = updated.replace(
					/sveltekit\(\)/,
					`sveltekit({ ${integration} })`
				);
			} else if (/sveltekit\(\{/.test(updated)) {
				// sveltekit({ ... }) already has options — inject after the opening brace
				updated = updated.replace(
					/sveltekit\(\{\s*\n?/,
					`sveltekit({\n\t\t\textensions: ['.svelte', '.md'],\n\t\t\tpreprocess: mdsvex({ extensions: ['.md'] }),\n\t\t\t`
				);
			}
			return updated;
		});

		sv.file('svelte.config.js', (content) => {
			if (!content || content.includes('mdsvex')) return content;
			let updated = content;
			if (!updated.includes("from 'mdsvex'")) {
				updated = updated.replace(
					/(import\s+.*?;?\s*\n)(?=\n*export)/,
					"$1import { mdsvex } from 'mdsvex';\n"
				);
			}
			// Add extensions to the config object and mdsvex to preprocess
			return updated
				.replace(
					/compilerOptions:/,
					"extensions: ['.svelte', '.md'],\n\tcompilerOptions:"
				)
				.replace(
					/preprocess:\s*\[/,
					"preprocess: [mdsvex({ extensions: ['.md'] })]"
				)
				.replace(
					/preprocess:\s*undefined,?/,
					'preprocess: [mdsvex({ extensions: [".md"] })]'
				)
				.replace(
					/kit:\s*\{/,
					"preprocess: [mdsvex({ extensions: ['.md'] })],\n\tkit: {"
				);
		});

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
	},
	nextSteps: () => [
		'@svforge/blog installed!',
		'Create posts as .md files in src/posts/',
		'Posts use frontmatter: title, date, excerpt, tags',
		'Routes: /blog (list) and /blog/[slug] (article)'
	]
});
