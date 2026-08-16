import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

export default defineAddon({
	id: 'svforge-graph',
	alias: 'forge-graph',
	shortDescription: 'SVForge Graph — interactive knowledge graph visualization (Obsidian-style)',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Graph requires SvelteKit');
	},

	run: ({ sv }) => {
		sv.dependency('force-graph', 'latest');

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
	},

	nextSteps: () => [
		'@svforge/graph installed!',
		'Usage:',
		"  import { KnowledgeGraph } from '$lib/components/svforge/graph';",
		'  <KnowledgeGraph nodes={nodes} links={links} />',
		'  nodes: { id: string, label?: string, group?: string }[]',
		'  links: { source: string, target: string }[]'
	]
});
