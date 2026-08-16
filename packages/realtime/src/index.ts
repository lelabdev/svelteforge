import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits — module id, capability and canonical pattern are merged
 * idempotently (#258). Small inline helper — modules are standalone packages.
 */
function enrichManifest(content: string, moduleId: string, capability: string, pattern: string): string {
	let manifest: {
		template: string;
		modules: string[];
		capabilities: string[];
		patterns: Record<string, string>;
	} = { template: 'base', modules: [], capabilities: [], patterns: {} };
	try {
		manifest = content && content.trim() ? JSON.parse(content) : manifest;
	} catch {
		manifest = { template: 'base', modules: [], capabilities: [], patterns: {} };
	}
	if (!Array.isArray(manifest.modules)) manifest.modules = [];
	if (!Array.isArray(manifest.capabilities)) manifest.capabilities = [];
	if (!manifest.patterns) manifest.patterns = {};
	if (!manifest.modules.includes(moduleId)) manifest.modules.push(moduleId);
	if (!manifest.capabilities.includes(capability)) manifest.capabilities.push(capability);
	if (!manifest.patterns[capability]) manifest.patterns[capability] = pattern;
	return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * Merge this module's capability + canonical pattern into the scaffolded
 * llms.txt (#258) so the AI context reflects every installed module even
 * though svforge itself is not installed in the generated project.
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
	id: 'svforge-realtime',
	alias: 'forge-realtime',
	shortDescription: 'SVForge Realtime — generic WebSocket transport (publish/subscribe)',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Realtime requires SvelteKit');
	},

	run: ({ sv }) => {
		sv.dependency('ws', '^8.21.3');
		sv.devDependency('@types/ws', '^8.5.14');

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'realtime', 'realtime (WebSocket)', 'src/lib/server/realtime/'));
		sv.file('llms.txt', (content) => mergeLlmstxt(content, 'realtime (WebSocket)', 'src/lib/server/realtime/'));
	},

	nextSteps: () => [
		'@svforge/realtime installed!',
		'Wire the hub: in src/hooks.server.ts, attach the WS server on startup',
		'  or run `realtime.listen(PORT)` (see README)',
		'Publish: import { realtime } from "$lib/server/realtime";',
		'  await realtime.publish({ channel: "org:1", event: "punch.created", payload: { punchId } });',
		'Client: const rt = createRealtimeClient("/api/realtime");',
		'  rt.subscribe("org:1", "punch.created", (p) => invalidate("app:punches"));'
	]
});
