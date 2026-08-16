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
	id: 'svforge-email',
	alias: 'forge-email',
	shortDescription: 'SVForge Email — transactional emails via Resend',
	homepage: 'https://github.com/lelabdev/svelteforge',
	// Empty options required: sv >= 0.15 crashes on addons without an
	// options object (Object.entries(undefined) in promptAddonQuestions).
	options: defineAddonOptions().build(),
	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Email requires SvelteKit');
	},
	run: ({ sv }) => {
		sv.dependency('resend', '^6.20.0');
		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
		// AI context (#234): declare this module in .svforge.json.
		sv.file('.svforge.json', (content) => enrichManifest(content, 'email'));
	},
	nextSteps: () => [
		'@svforge/email installed!',
		'Add RESEND_API_KEY to your .env',
		'Usage: import { sendEmail } from "$lib/server/email"',
		'  await sendEmail({ to: "user@example.com", subject: "Welcome", html: "<h1>Welcome!</h1>" });'
	]
});
