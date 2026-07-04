import { defineAddon } from 'sv';
import { files } from './templates';

export default defineAddon({
	id: 'svforge-oauth',
	alias: 'forge-oauth',
	shortDescription: 'SVForge OAuth — social auth (Google, GitHub)',
	homepage: 'https://github.com/lelabdev/svelteforge',

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge OAuth requires SvelteKit');
	},

	run: ({ sv }) => {
		// Better Auth social providers are built-in, no extra deps needed
		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
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
