import type { SvApi } from 'sv';
import { scaffoldedAgents } from '../scaffolded-agents';

// Files that must land at the PROJECT ROOT, not under src/ (#235):
// Vitest discovers its config only at the project root.
const ROOT_FILES = new Set(['/vitest.config.ts']);

/**
 * Apply Base mode files via sv.file()
 * Base = all UI components, layouts, styles, utils, schemas
 */
export function applyBaseMode(
	sv: SvApi,
	files: Record<string, string>
): void {
	// Baseline Vitest (#235): deliver the runnable test baseline. The
	// devDependency + script mirror the template package.json (vitest ^3.1.1).
	sv.devDependency('vitest', '^3.1.1');

	// Add a runnable test script to the generated project.
	sv.file('package.json', (content: string) => {
		const pkg = JSON.parse(content);
		pkg.scripts = {
			...pkg.scripts,
			test: 'vitest run',
			'test:watch': 'vitest'
		};
		return `${JSON.stringify(pkg, null, 2)}\n`;
	});

	// Write all base template files
	for (const [path, content] of Object.entries(files)) {
		const dest = ROOT_FILES.has(path) ? path.slice(1) : `src${path}`;
		sv.file(dest, () => content);
	}

	// AI-ready: scaffold an AGENTS.md at the project root (#203)
	sv.file('AGENTS.md', () => scaffoldedAgents('base'));
}
