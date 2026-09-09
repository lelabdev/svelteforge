import { defineAddon, defineAddonOptions } from 'sv';
import { checkModuleCapabilities, planAddonContext } from '@svforge/addon-kit';
import { files } from './templates';


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
		// Capability gate (#323): jobs needs the database contract, and a
		// long-lived worker runtime (unverifiable from files → warning).
		const gate = checkModuleCapabilities(cwd, 'jobs');
		if (!gate.ok) {
			cancel(gate.message);
			return;
		}

		const context = planAddonContext(cwd, { moduleId: 'jobs', capability: 'background jobs', pattern: 'src/lib/server/jobs/' });
		if (!context.ok) {
			cancel(context.error);
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

		// Start the runner in the SvelteKit server hooks — guarded by the
		// deployment profile (#332/#328): JOBS_WORKER=web keeps web replicas
		// runner-free in a separate-worker deployment; unset or =worker runs it
		// here (the default single long-lived Node process keeps working).
		sv.file('src/hooks.server.ts', (content) => {
			if (!content || content.includes('JOBS_WORKER')) return content;
			return `import { env } from '$env/dynamic/private';\n${content}`;
		});
		sv.file('src/hooks.server.ts', (content) => {
			if (!content || content.includes('startJobRunner()')) return content;
			return `${content}\n// #332/#328 — separate-worker profile: JOBS_WORKER=web on web replicas\n// (runner on the dedicated worker); unset or =worker runs the runner here.\nif (env.JOBS_WORKER !== 'web') startJobRunner();\n`;
		});

		// AI context (#234): planned in memory first (#324) — an invalid
		// .svforge.json cancels the install instead of resetting the file.
		for (const write of context.writes) {
			sv.file(write.path, () => write.content);
		}
	},

	nextSteps: ({ cwd }) => {
		const steps = [
			'@svforge/jobs installed!',
			'Deployment profile (#332): the runner needs a long-lived process. node-long-lived runs it in-process; on serverless use the separate-worker profile (JOBS_WORKER=worker on the worker, JOBS_WORKER=web on web replicas). It never runs on edge.',
			'Define a handler: import { define } from "$lib/server/jobs";',
			'  define("payroll.export", async (payload, ctx) => { await ctx.progress(10); ... return { fileId }; });',
			'Enqueue: await jobs.enqueue("payroll.export", { organizationId });',
			'Runner starts automatically in hooks.server.ts (5s polling, retries ×3).',
			'Guarantees v1: at-least-once → handlers must be idempotent.'
		];
		// runtime.longLivedWorker is unverifiable from files (#323): surface the
		// deployment constraint as a warning, never as a hard failure.
		if (typeof cwd === 'string') {
			const gate = checkModuleCapabilities(cwd, 'jobs');
			if (gate.ok) steps.push(...gate.warnings);
		}
		return steps;
	}
});
