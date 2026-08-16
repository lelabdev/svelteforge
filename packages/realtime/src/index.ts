import { defineAddon, defineAddonOptions } from 'sv';
import { files } from './templates';

/**
 * Enrich the project's .svforge.json AI manifest (#234) without overwriting
 * user edits. Small inline helper — modules are standalone packages.
 */
function enrichManifest(content: string, moduleId: string): string {
	let manifest: { template: string; modules: string[] } = { template: 'base', modules: [] };
	try {
		manifest = content && content.trim() ? JSON.parse(content) : manifest;
	} catch {
		manifest = { template: 'base', modules: [] };
	}
	if (!manifest.modules.includes(moduleId)) manifest.modules.push(moduleId);
	return `${JSON.stringify(manifest, null, 2)}\n`;
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
		sv.file('.svforge.json', (content) => enrichManifest(content, 'realtime'));
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
