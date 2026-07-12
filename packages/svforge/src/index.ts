import { defineAddon, defineAddonOptions } from 'sv';
import { baseFiles, dashboardFiles } from './templates';
import { applyBaseMode } from './modes/base';
import { applyDashboardMode } from './modes/dashboard';

// Export doctor diagnostics for programmatic use
export { doctor, printReport } from './doctor';
export type { DiagnosticResult, DoctorReport } from './doctor';

export default defineAddon({
	id: 'svelteforge',
	alias: 'forge',
	shortDescription: 'SvelteForge — themed UI kit + layouts for SvelteKit',
	homepage: 'https://github.com/lelabdev/svelteforge',

	options: defineAddonOptions()
		.add('template', {
			question: 'Which SvelteForge template?',
			type: 'select',
			default: 'base',
			options: [
				{ value: 'base', label: 'Base — UI kit + layouts + forms (landing, portfolio, marketing…)' },
				{ value: 'dashboard', label: 'Dashboard — base + admin dashboard + auth + DB' }
			]
		})
		.build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SvelteForge requires SvelteKit');
	},

	run: ({ sv, options }) => {
		const template = options.template as 'base' | 'dashboard';

		// ── Shared dependencies ──
		sv.dependency('@fontsource-variable/fira-code', 'latest');
		sv.dependency('@fontsource-variable/inter', 'latest');
		sv.dependency('@fontsource-variable/manrope', 'latest');
		sv.dependency('@fontsource-variable/space-grotesk', 'latest');
		sv.dependency('clsx', 'latest');
		sv.dependency('phosphor-svelte', '^3.1.0');
		sv.dependency('tailwind-merge', 'latest');

		sv.devDependency('@skeletonlabs/skeleton', 'latest');
		sv.devDependency('@skeletonlabs/skeleton-svelte', 'latest');
		sv.devDependency('@tailwindcss/forms', '^0.5.0');
		sv.devDependency('@tailwindcss/typography', '^0.5.0');
		sv.devDependency('@tailwindcss/vite', '^4.0.0');
		sv.devDependency('tailwindcss', '^4.0.0');

		// ── Vite config: ensure @tailwindcss/vite plugin ──
		sv.file('vite.config.ts', (content) => {
			if (content.includes('@tailwindcss/vite')) return content;
			let updated = content;
			updated = `import tailwindcss from '@tailwindcss/vite';\n${updated}`;
			updated = updated.replace(
				/plugins:\s*\[/,
				'plugins: [tailwindcss(), '
			);
			return updated;
		});

		// ── Apply mode-specific files ──
		if (template === 'dashboard') {
			applyDashboardMode(sv, baseFiles, dashboardFiles);
		} else {
			applyBaseMode(sv, baseFiles);
		}
	},

	nextSteps: ({ options }) => [
		`SvelteForge ${(options.template as string)} template applied!`,
		'Run `npm run dev` (or `bun dev`) to start developing.'
	]
});
