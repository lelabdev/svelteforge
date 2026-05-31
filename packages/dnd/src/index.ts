import { defineAddon } from 'sv';
import { files } from './templates';

export default defineAddon({
	id: 'svforge-dnd',
	alias: 'forge-dnd',
	shortDescription: 'SVForge Drag & Drop — sortable lists',
	homepage: 'https://github.com/lelabdev/svelteforge',

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge DnD requires SvelteKit');
	},

	run: ({ sv }) => {
		sv.dependency('@thisux/sveltednd', 'latest');

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
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
