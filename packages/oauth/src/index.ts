import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
	id: 'svforge-oauth',
	alias: 'forge-oauth',
	shortDescription: 'SVForge OAuth — social auth (Google, GitHub)',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),

	setup: ({ unsupported, isKit, cwd }) => {
		if (!isKit) unsupported('SVForge OAuth requires SvelteKit');
		// OAuthButtons imports $lib/client/auth — provided only by the svforge
		// dashboard template. Install svforge (template:dashboard) first (#190).
		if (!existsSync(join(cwd, 'src/lib/client/auth.ts'))) {
			unsupported('SVForge OAuth requires the svforge dashboard template (src/lib/client/auth.ts missing — run `sv add svforge=template:dashboard` first)');
		}
	},

	run: ({ sv }) => {
		// Better Auth social providers are built-in, no extra deps needed
		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}

		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'oauth'));
	},

	nextSteps: () => [
		'@svforge/oauth installed!',
		'Add to your Better Auth config (src/lib/server/auth.ts):',
		'  socialProviders: {',
		'    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },',
		'    github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }',
		'  }',
		'Add OAuth buttons: import OAuthButtons from "$lib/components/svforge/ui/OAuthButtons.svelte"',
		'Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET'
	]
});
