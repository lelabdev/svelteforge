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

/**
 * Merge this module's capability + canonical pattern into the scaffolded
 * llms.txt (#258/#284) so the AI context reflects every installed module
 * even though svforge itself is not installed in the generated project.
 */
function mergeLlmstxt(content: string, capability: string, pattern: string): string {
	const lines = (content || '').split('\n');
	const capLine = `- ${capability}`;
	if (!lines.some((l) => l === capLine)) {
		const idx = lines.findIndex((l) => l === '## Capabilities installed');
		if (idx >= 0) lines.splice(idx + 1, 0, capLine);
	}
	const patLine = `- ${capability}: ${pattern}`;
	if (!lines.some((l) => l === patLine)) {
		const idx = lines.findIndex((l) => l === '## Canonical patterns');
		if (idx >= 0) lines.splice(idx + 1, 0, patLine);
	}
	return lines.join('\n');
}


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

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'ui_toast'));
		sv.file('llms.txt', (content) => mergeLlmstxt(content, 'toasts (Skeleton Toast)', 'src/lib/components/svforge/ui/Toaster.svelte'));
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
