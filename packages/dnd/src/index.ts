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
	id: 'svforge-dnd',
	alias: 'forge-dnd',
	shortDescription: 'SVForge Drag & Drop — sortable lists',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge DnD requires SvelteKit');
	},

	run: ({ sv }) => {
		sv.dependency('@thisux/sveltednd', '^0.7.0');

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'dnd'));
	},

	nextSteps: () => [
		'@svforge/dnd installed!',
		'Usage:',
		"  import SortableList from '$lib/components/svforge/dnd/SortableList.svelte';",
		'  <SortableList items={items} onReorder={(v) => items = v}>',
		'    {#snippet children(item)}<span>{item.title}</span>{/snippet}',
		'  </SortableList>'
	]
});
