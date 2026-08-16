import { defineAddon, defineAddonOptions } from 'sv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
	id: 'svforge-jobs',
	alias: 'forge-jobs',
	shortDescription: 'SVForge Jobs — background job foundation (retry, progress, encapsulated backend)',
	homepage: 'https://github.com/lelabdev/svelteforge',
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Jobs requires SvelteKit');
	},

	run: ({ sv, cancel, cwd }) => {
		// jobs/index.ts imports $lib/server/db — requires dashboard.
		if (!existsSync(join(cwd, 'src/lib/server/db/index.ts'))) {
			cancel('SVForge Jobs requires the svforge dashboard template (src/lib/server/db missing — run `sv add svforge=template:dashboard` first)');
			return;
		}

		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// Register the schema in the Drizzle barrel.
		sv.file('src/lib/server/db/schema.ts', (content) => {
			if (!content || content.includes('jobs')) return content;
			return `import { jobs } from '$lib/server/jobs/schema';\n${content}\nexport { jobs };\n`;
		});

		// Start the runner in the SvelteKit server hooks.
		sv.file('src/hooks.server.ts', (content) => {
			if (!content || content.includes('startJobRunner')) return content;
			return `import { startJobRunner } from '$lib/server/jobs/runner';\n${content}`;
		});
		sv.file('src/hooks.server.ts', (content) => {
			if (!content || content.includes('startJobRunner()')) return content;
			return `${content}\nstartJobRunner();\n`;
		});

		// AI context (#234).
		sv.file('.svforge.json', (content) => enrichManifest(content, 'jobs'));
	},

	nextSteps: () => [
		'@svforge/jobs installed!',
		'Define a handler: import { define } from "$lib/server/jobs";',
		'  define("payroll.export", async (payload, ctx) => { await ctx.progress(10); ... return { fileId }; });',
		'Enqueue: await jobs.enqueue("payroll.export", { organizationId });',
		'Runner starts automatically in hooks.server.ts (5s polling, retries ×3).',
		'Guarantees v1: at-least-once → handlers must be idempotent.'
	]
});
