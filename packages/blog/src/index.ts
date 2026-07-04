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
return content
.replace(
"import adapter from '@sveltejs/adapter-auto';",
"import adapter from '@sveltejs/adapter-auto';\nimport { mdsvex } from 'mdsvex';"
)
.replace(
'preprocess: undefined,',
"preprocess: mdsvex({ extensions: ['.md'], layout: { blog: 'src/routes/blog/_layout.svelte' } }),"
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
