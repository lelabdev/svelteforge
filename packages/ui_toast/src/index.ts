import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits. Small inline helper — modules are standalone packages.
 */
function enrichManifest(content, moduleId, capability, pattern) {
	let manifest = { template: 'base', modules: [], capabilities: [], patterns: {} };
	try {
		manifest = content && content.trim() ? JSON.parse(content) : manifest;
	} catch {
		manifest = { template: 'base', modules: [], capabilities: [], patterns: {} };
	}
	if (!Array.isArray(manifest.modules)) manifest.modules = [];
	if (!Array.isArray(manifest.capabilities)) manifest.capabilities = [];
	if (!manifest.patterns) manifest.patterns = {};
	// Full manifest contract (#296): .svforge.json must carry the same
	// module + capability + pattern data as llms.txt, immediately after sv add.
	if (!manifest.modules.includes(moduleId)) manifest.modules.push(moduleId);
	if (!manifest.capabilities.includes(capability)) manifest.capabilities.push(capability);
	manifest.patterns[capability] = pattern;
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
		// Append at the END of the Capabilities section (before the next
		// "## " header): module order then matches installation order, so
		// `svforge context` regenerates a byte-identical llms.txt (#296).
		let insertAt = lines.length;
		const header = lines.findIndex((l) => l === '## Capabilities installed');
		if (header >= 0) {
			const nextSection = lines.findIndex((l, i) => i > header && l.startsWith('## '));
			insertAt = nextSection >= 0 ? nextSection : lines.length;
			// insert BEFORE the blank line that closes the section, so the
			// byte layout matches renderLlmstxt exactly (#296)
			if (insertAt > header + 1 && lines[insertAt - 1] === '') insertAt -= 1;
		}
		lines.splice(insertAt, 0, capLine);
	}
	const patLine = `- ${capability}: ${pattern}`;
	if (!lines.some((l) => l === patLine)) {
		let insertAt = lines.length;
		const header = lines.findIndex((l) => l === '## Canonical patterns');
		if (header >= 0) {
			const nextSection = lines.findIndex((l, i) => i > header && l.startsWith('## '));
			insertAt = nextSection >= 0 ? nextSection : lines.length;
			if (insertAt > header + 1 && lines[insertAt - 1] === '') insertAt -= 1;
		}
		lines.splice(insertAt, 0, patLine);
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
		sv.file('.svforge.json', (content) => enrichManifest(content, 'ui_toast', 'toasts (Skeleton Toast)', 'src/lib/components/svforge/ui/Toaster.svelte'));
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
