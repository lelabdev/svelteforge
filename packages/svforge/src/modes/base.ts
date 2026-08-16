import type { SvApi } from 'sv';
import { scaffoldedAgents } from '../scaffolded-agents';
import { buildManifest, renderLlmstxt } from '../ai-context';

// Files that must land at the PROJECT ROOT, not under src/ (#235):
// Vitest discovers its config only at the project root.
const ROOT_FILES = new Set(['/vitest.config.ts']);

/**
 * Apply Base mode files via sv.file()
 * Base = all UI components, layouts, styles, utils, schemas
 */
export function applyBaseMode(
	sv: SvApi,
	files: Record<string, string>,
	rootFiles: Record<string, string> = {}
): void {
	// Baseline Vitest (#235): deliver the runnable test baseline. The
	// devDependency + script mirror the template package.json (vitest ^3.1.1).
	sv.devDependency('vitest', '^3.1.1');

	// Paraglide i18n (#239): compiler-first FR/EN messages, official Svelte
	// integration. The vite plugin generates src/lib/paraglide at build time.
	sv.dependency('@inlang/paraglide-js', '^2.24.0');

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

	// Paraglide (#239): wire the vite plugin into the project's vite.config.ts.
	sv.file('vite.config.ts', (content) => {
		if (content.includes('paraglideVitePlugin')) return content;
		let updated = content;
		if (!updated.includes("from '@inlang/paraglide-js'")) {
			updated = `import { paraglideVitePlugin } from '@inlang/paraglide-js';\n${updated}`;
		}
		updated = updated.replace(
			/plugins:\s*\[/,
			'plugins: [paraglideVitePlugin({ project: \'./project.inlang\', outdir: \'./src/lib/paraglide\' }), '
		);
		return updated;
	});

	// Write all base template files
	for (const [path, content] of Object.entries(files)) {
		const dest = ROOT_FILES.has(path) ? path.slice(1) : `src${path}`;
		sv.file(dest, () => content);
	}

	// Write root-level project files (messages/, project.inlang/) at the
	// project root (#239) — same delivery model as the dashboard root files.
	for (const [path, content] of Object.entries(rootFiles)) {
		sv.file(path.slice(1), () => content);
	}

	// AI-ready: scaffold an AGENTS.md at the project root (#203)
	sv.file('AGENTS.md', () => scaffoldedAgents('base'));

	// AI context (#234): machine-readable manifest + llms.txt, derived from
	// the real scaffold state. The dashboard mode overrides with its template.
	const manifest = buildManifest('base', []);
	sv.file('.svforge.json', () => `${JSON.stringify(manifest, null, 2)}\n`);
	sv.file('llms.txt', () => renderLlmstxt(manifest));
}
