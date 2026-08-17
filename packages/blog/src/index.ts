import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits. Small inline helper — modules are standalone packages.
 */
function enrichManifest(content, moduleId) {
	let manifest = { template: 'base', modules: [] };
	try {
		manifest = content && content.trim() ? JSON.parse(content) : manifest;
	} catch {
		manifest = { template: 'base', modules: [] };
	}
	if (!manifest.modules.includes(moduleId)) manifest.modules.push(moduleId);
	return `${JSON.stringify(manifest, null, 2)}\n`;
}

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

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'blog'));

		// Transport hook (#293): MDsveX posts are Svelte components (functions)
		// which SvelteKit cannot serialize through the data boundary. The
		// transport encodes a post as its slug server-side and re-imports the
		// compiled component client-side. Patches the consumer's hooks.ts
		// (which already exports the Paraglide reroute) without touching it.
		sv.file('src/hooks.ts', (content) => {
			if (!content || content.includes('mdx-post')) return content;
			const imports =
				"import { loadPostComponent, PostComponent } from '$lib/utils/posts';\nimport type { Transport } from '@sveltejs/kit';\n";
			const transport =
				'\n\nexport const transport: Transport = {' +
				"\n\t'mdx-post': {" +
				'\n\t\tencode: (value: unknown) =>' +
				"\n\t\t\tvalue && typeof value === 'object' && (value as { __brand?: string }).__brand === 'mdx-post'" +
				'\n\t\t\t\t? [(value as { slug: string }).slug]' +
				'\n\t\t\t\t: null,' +
				'\n\t\tdecode: async ([slug]: [string]) => {' +
				'\n\t\t\tconst component = await loadPostComponent(slug);' +
				'\n\t\t\tif (!component) throw new Error(\'Post component not found: \' + slug);' +
				'\n\t\t\treturn new PostComponent(component, slug);' +
				'\n\t\t}' +
				'\n\t}' +
				'\n};\n';
			// Insert the imports after the first import line, then append the
			// transport after the last export statement (keeps the reroute
			// intact).
			const withImports = content.replace(
				/^(import[^\n]*\n)/m,
				(match) => match + imports
			);
			const lastExport = withImports.lastIndexOf('export ');
			if (lastExport === -1) return withImports + transport;
			return withImports.slice(0, lastExport) + transport + withImports.slice(lastExport);
		});
	},
	nextSteps: () => [
		'@svforge/blog installed!',
		'Create posts as .md files in src/posts/',
		'Posts use frontmatter: title, date, excerpt, tags',
		'Routes: /blog (list) and /blog/[slug] (article)'
	]
});
