import { defineAddon, defineAddonOptions } from 'sv';
import { baseFiles, dashboardFiles, dashboardRootFiles } from './templates';
import { applyBaseMode } from './modes/base';
import { applyDashboardMode } from './modes/dashboard';

// Export doctor diagnostics for programmatic use
export { doctor, printReport } from './doctor';
export type { DiagnosticResult, DoctorReport } from './doctor';

// Export upgrade command for programmatic use
export { upgrade, printUpgradeResult } from './upgrade';
export type { UpgradeFile, UpgradeResult } from './upgrade';

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
		.add('testing', {
			question: 'Which dashboard testing profile?',
			type: 'select',
			default: 'vitest',
			options: [
				{ value: 'vitest', label: 'Vitest — unit and server behavior tests' },
				{ value: 'playwright', label: 'Playwright — Vitest plus full browser tests' }
			]
		})
		.build(),

	setup: ({ unsupported, isKit }) => {
		if (!isKit) unsupported('SvelteForge requires SvelteKit');
	},

	run: ({ sv, options }) => {
		const template = options.template as 'base' | 'dashboard';
		const testing = options.testing as 'vitest' | 'playwright';

		// ── Shared dependencies ──
		// Pinned major ranges (#197): `latest` would silently resolve the next
		// major (v4→v5 broke the theme, #194). Bumps are explicit PRs, tested in CI.
		sv.dependency('@fontsource-variable/fira-code', '^5.3.0');
		sv.dependency('@fontsource-variable/inter', '^5.3.0');
		sv.dependency('@fontsource-variable/manrope', '^5.3.0');
		sv.dependency('@fontsource-variable/space-grotesk', '^5.3.0');
		sv.dependency('clsx', '^2.1.1');
		sv.dependency('phosphor-svelte', '^3.1.0');
		sv.dependency('tailwind-merge', '^3.6.0');

		sv.devDependency('@skeletonlabs/skeleton', '^5.0.0');
		sv.devDependency('@skeletonlabs/skeleton-svelte', '^5.0.0');
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
			applyDashboardMode(sv, baseFiles, dashboardFiles, testing, dashboardRootFiles);
		} else {
			applyBaseMode(sv, baseFiles);
		}
	},

	nextSteps: ({ options }) => [
		`SvelteForge ${(options.template as string)} template applied!`,
		'Run `npm run dev` (or `bun dev`) to start developing.'
	]
});
