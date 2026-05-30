import { defineAddon, defineAddonOptions } from 'sv';
import { baseFiles, fullstackFiles } from './templates';
import { applyBaseMode } from './modes/base';
import { applyFullstackMode } from './modes/fullstack';

export default defineAddon({
	id: 'svelteforge',
	alias: 'forge',
	shortDescription: 'SvelteForge — themed UI kit + layouts for SvelteKit',
	homepage: 'https://github.com/lelabdev/svelteforge',

	options: defineAddonOptions()
		.add('template', {
			question: 'Which SvelteForge template?',
			type: 'select',
			options: [
				{ value: 'base', label: 'Base — UI kit + layouts + forms (landing, portfolio, marketing…)' },
				{ value: 'fullstack', label: 'Full Stack — base + admin dashboard + auth + DB' }
			]
		})
		.build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SvelteForge requires SvelteKit');
	},

	run: ({ sv, options }) => {
		const template = options.template as 'base' | 'fullstack';

		// ── Shared dependencies ──
		sv.dependency('@fontsource-variable/fira-code', 'latest');
		sv.dependency('@fontsource-variable/inter', 'latest');
		sv.dependency('@fontsource-variable/manrope', 'latest');
		sv.dependency('@fontsource-variable/space-grotesk', 'latest');
		sv.dependency('@tiptap/core', 'latest');
		sv.dependency('@tiptap/extension-underline', 'latest');
		sv.dependency('@tiptap/starter-kit', 'latest');
		sv.dependency('clsx', 'latest');
		sv.dependency('phosphor-svelte', '^3.1.0');
		sv.dependency('pino', 'latest');
		sv.dependency('pino-pretty', 'latest');
		sv.dependency('sveltekit-superforms', 'latest');
		sv.dependency('tailwind-merge', 'latest');
		sv.dependency('zod', 'latest');

		sv.devDependency('@skeletonlabs/skeleton', 'latest');
		sv.devDependency('@skeletonlabs/skeleton-common', 'latest');
		sv.devDependency('@skeletonlabs/skeleton-svelte', 'latest');
		sv.devDependency('@tailwindcss/forms', '^0.5.0');
		sv.devDependency('@tailwindcss/typography', '^0.5.0');
		sv.devDependency('@tailwindcss/vite', '^4.0.0');
		sv.devDependency('tailwindcss', '^4.0.0');

		// ── Apply mode-specific files ──
		if (template === 'fullstack') {
			applyFullstackMode(sv, baseFiles, fullstackFiles);
		} else {
			applyBaseMode(sv, baseFiles);
		}
	},

	nextSteps: ({ options }) => [
		`SvelteForge ${(options.template as string)} template applied!`,
		'Run `npm run dev` (or `bun dev`) to start developing.'
	]
});
