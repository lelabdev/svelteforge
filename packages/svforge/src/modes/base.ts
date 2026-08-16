import type { SvApi } from 'sv';
import { scaffoldedAgents } from '../scaffolded-agents';

const BASE_VITEST_CONFIG = `import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
\tplugins: [sveltekit()],
\ttest: {
\t\tinclude: ['src/**/*.test.ts']
\t}
});
`;

/**
 * Apply Base mode files via sv.file()
 * Base = all UI components, layouts, styles, utils, schemas
 */
export function applyBaseMode(
	sv: SvApi,
	files: Record<string, string>
): void {
	// Base ships a real Vitest baseline (#235): the example test is embedded in
	// baseFiles, while the config must live at the generated PROJECT ROOT.
	sv.devDependency('vitest', '^4.1.5');
	sv.file('package.json', (content: string) => {
		const pkg = JSON.parse(content);
		pkg.scripts = {
			...pkg.scripts,
			test: 'vitest run',
			'test:watch': 'vitest'
		};
		return `${JSON.stringify(pkg, null, 2)}\n`;
	});
	sv.file('vitest.config.ts', () => BASE_VITEST_CONFIG);

	// Write all base template files
	for (const [path, content] of Object.entries(files)) {
		sv.file(`src${path}`, () => content);
	}

	// AI-ready: scaffold an AGENTS.md at the project root (#203)
	sv.file('AGENTS.md', () => scaffoldedAgents('base'));
}
