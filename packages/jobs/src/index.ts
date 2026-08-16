import { defineAddon, defineAddonOptions } from 'sv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
		sv.file('.svforge.json', (content) => enrichManifest(content, 'jobs', 'background jobs', 'src/lib/server/jobs/'));
		sv.file('llms.txt', (content) => mergeLlmstxt(content, 'background jobs', 'src/lib/server/jobs/'));
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
