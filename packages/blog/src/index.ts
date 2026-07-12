import { defineAddon } from 'sv';
import { files } from './templates';

export default defineAddon({
id: 'svforge-blog',
alias: 'forge-blog',
shortDescription: 'SVForge Blog — MDsveX blog with posts list and article pages',
homepage: 'https://github.com/lelabdev/svelteforge',
setup: ({ unsupported, isKit }) => {
if (!isKit) unsupported('SVForge Blog requires SvelteKit');
},
run: ({ sv }) => {
	sv.dependency('mdsvex', 'latest');

	sv.file('svelte.config.js', (content) => {
		if (content.includes('mdsvex')) return content;
		// Add mdsvex import after the last import line
		const withImport = content.includes("from 'mdsvex'")
			? content
			: content.replace(
					/(import\s+.*?;?\s*\n)(?=\n*export)/,
					"$1import { mdsvex } from 'mdsvex';\n"
				);
		// Add mdsvex to the preprocess and extensions arrays
		return withImport
			.replace(
				/preprocess:\s*\[/,
				"preprocess: [mdsvex({ extensions: ['.md'] })], // replaced below"
			)
			.replace(
				/preprocess:\s*undefined,?/,
				"preprocess: [mdsvex({ extensions: ['.md'] })],"
			)
			.replace(
				/preprocess:\s*mdsvex\([^)]*\),?\s*\/\/ replaced below/,
				'preprocess: [mdsvex({ extensions: [".md"] })],'
			)
			.replace(
				/extensions:\s*\[/,
				'extensions: [".md", '
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
