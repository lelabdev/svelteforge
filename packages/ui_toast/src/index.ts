import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

export default defineAddon({
	id: 'svforge-ui-toast',
	alias: 'forge-toast',
	shortDescription: 'SVForge Toast — notification toasts',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Toast requires SvelteKit');
	},

	run: ({ sv }) => {
		// Toaster/toaster.ts import @skeletonlabs/skeleton-svelte — must be a
		// real dependency (peerDependencies installs nothing in the copy-sources
		// model) (#190).
		sv.dependency('@skeletonlabs/skeleton-svelte', '^5.0.0');

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
	},

	nextSteps: () => [
		'@svforge/ui_toast installed!',
		'Import Toaster in your root layout:',
		"  import { Toaster } from '$lib/components/svforge/ui/Toaster.svelte';",
		'  <Toaster />',
		'Trigger toasts from anywhere:',
		"  import { toaster } from '$lib/components/svforge/ui/toaster';",
		'  toaster.success({ title: "Done!" });'
	]
});
