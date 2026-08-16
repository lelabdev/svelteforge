import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
	id: 'svforge-graph',
	alias: 'forge-graph',
	shortDescription: 'SVForge Graph — interactive knowledge graph visualization (Obsidian-style)',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit, cwd }) => {
		if (!isKit) unsupported('SVForge Graph requires SvelteKit');
		// KnowledgeGraph imports $lib/utils/cn — provided only by the svforge
		// base template. Install svforge first (#190).
		if (!existsSync(join(cwd, 'src/lib/utils/cn.ts'))) {
			unsupported('SVForge Graph requires the svforge base template (src/lib/utils/cn.ts missing — run `sv add svforge=template:base` first)');
		}
	},

	run: ({ sv }) => {
		sv.dependency('force-graph', '^1.51.4');

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'graph'));
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
