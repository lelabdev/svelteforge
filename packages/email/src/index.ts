import { defineAddon } from 'sv';
import { files } from './templates';

export default defineAddon({
	id: 'svforge-email',
	alias: 'forge-email',
	shortDescription: 'SVForge Email — transactional emails via Resend',
	homepage: 'https://github.com/lelabdev/svelteforge',
	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SVForge Email requires SvelteKit');
	},
	run: ({ sv }) => {
		sv.dependency('resend', 'latest');
		for (const [path, content] of Object.entries(files)) {
			sv.file(`src${path}`, () => content);
		}
	},
	nextSteps: () => [
		'@svforge/email installed!',
		'Add RESEND_API_KEY to your .env',
		'Usage: import { sendEmail } from "$lib/server/email"',
		'  await sendEmail({ to: "user@example.com", subject: "Welcome", html: "<h1>Welcome!</h1>" });'
	]
});
