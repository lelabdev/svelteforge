import type { SvApi } from 'sv';
import { resolveDestination, initTrackingJson } from '@svforge/addon-kit';
import { scaffoldedAgents } from '../scaffolded-agents';
import { buildManifest, renderLlmstxt } from '../ai-context';
import { BASE_ROOT_PATHS } from '../destinations';
import { SDFORGE_RECIPE_VERSION } from '../recipe-version';
import { scaffoldedLocalDocs } from '../local-docs';

// Files that must land at the PROJECT ROOT, not under src/ (#235):
// resolved through the ONE canonical resolver shared with the upgrade engine
// (#327) — BASE_ROOT_PATHS in destinations.ts.

const LEFTHOOK_CONFIG = `pre-commit:
  commands:
    svforge-check:
      glob: '*.{svelte,html,css,json}'
      run: node svforge-check.mjs --strict
`;

type HookMode = 'none' | 'lefthook';

// `sv add --install` is valid before `git init`. The conditional preserves an
// installation failure inside a repository while making the lifecycle script a
// successful no-op outside one.
const LEFTHOOK_PREPARE = 'if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then lefthook install; fi';

/**
 * Apply Base mode files via sv.file()
 * Base = all UI components, layouts, styles, utils, schemas
 */
export function applyBaseMode(
	sv: SvApi,
	files: Record<string, string>,
	rootFiles: Record<string, string> = {},
	hooks: HookMode = 'none'
): void {
	// Baseline Vitest (#235): deliver the runnable test baseline. The
	// devDependency + script mirror the template package.json (vitest ^5.0.0).
	sv.devDependency('vitest', '^5.0.0');

	// Node types (#271): the Paraglide server runtime (generated
	// src/lib/paraglide/server.js) imports async_hooks — svelte-check fails
	// without @types/node in the generated project (the template package.json
	// reference is not enough, the dependency must be declared at scaffold).
	sv.devDependency('@types/node', '^22');

	// Paraglide i18n (#239): compiler-first FR/EN messages, official Svelte
	// integration. The vite plugin generates src/lib/paraglide at build time.
	sv.dependency('@inlang/paraglide-js', '^2.24.0');

	// Add runnable test + type-check scripts to the generated project.
	// `check` compiles Paraglide first: the vite plugin generates
	// src/lib/paraglide at build/dev time, but svelte-check needs the files
	// present (and their .d.ts) to type-check the generated messages (#271).
	sv.file('package.json', (content: string) => {
		const pkg = JSON.parse(content);
		pkg.scripts = {
			...pkg.scripts,
			lint: 'eslint .',
			test: 'vitest run',
			'test:watch': 'vitest',
			// #343: the design-system check rides on `bun run check` —
			// self-contained local invocation (no network install). The checker
			// exits non-zero on ERROR and zero on WARN-only, so plain && keeps
			// "ERROR fails the command, WARN stays informational".
			check:
				'svelte-kit sync && paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide && svelte-check --tsconfig ./tsconfig.json && node svforge-check.mjs'
		};
		return `${JSON.stringify(pkg, null, 2)}\n`;
	});

// Strict checks stay opt-in (#344): Lefthook only runs for commits with
	// staged relevant files, then checks the project because the checker has no
	// safe partial-file mode. Its prepare script installs the Git hook on install.
	if (hooks === 'lefthook') {
		sv.devDependency('lefthook', '^2.0.13');
		sv.file('.lefthook.yml', () => LEFTHOOK_CONFIG);
		sv.file('package.json', (content: string) => {
			const pkg = JSON.parse(content);
			const prepare = pkg.scripts?.prepare;
			pkg.scripts = {
				...pkg.scripts,
				prepare: prepare?.includes('lefthook install') ? prepare : prepare ? `${prepare} && ${LEFTHOOK_PREPARE}` : LEFTHOOK_PREPARE
			};
			return `${JSON.stringify(pkg, null, 2)}\n`;
		});
	}

	// Paraglide (#239) and the production-only design-system gate (#350)
	// share vite.config.ts. The gate imports the scaffolded checker, so Vite
	// builds and `bun run check` produce the same diagnostics.
	sv.file('vite.config.ts', (content) => {
		let updated = content;
		if (!updated.includes("from '@inlang/paraglide-js'")) {
			updated = `import { paraglideVitePlugin } from '@inlang/paraglide-js';\n${updated}`;
		}
		if (!updated.includes("from './svforge-design-system-vite-plugin.mjs'")) {
			updated = `import { svforgeDesignSystemPlugin } from './svforge-design-system-vite-plugin.mjs';\n${updated}`;
		}
		if (!updated.includes('paraglideVitePlugin({')) {
			updated = updated.replace(
				/plugins:\s*\[/,
				'plugins: [paraglideVitePlugin({ project: \'./project.inlang\', outdir: \'./src/lib/paraglide\' }), '
			);
		}
		if (!updated.includes('svforgeDesignSystemPlugin()')) {
			updated = updated.replace(/plugins:\s*\[/, 'plugins: [svforgeDesignSystemPlugin(), ');
		}
		return updated;
	});

	// Write all base template files — destinations come from the ONE canonical
	// resolver shared with the upgrade engine (#327): no install/upgrade drift.
	for (const [path, content] of Object.entries(files)) {
		sv.file(resolveDestination(path, BASE_ROOT_PATHS), () => content);
	}

	// Write root-level project files (messages/, project.inlang/) at the
	// project root (#239) — same delivery model as the dashboard root files.
	for (const [path, content] of Object.entries(rootFiles)) {
		sv.file(path.slice(1), () => content);
	}

	// Upgrade baseline (#327): initialize .svforge-versions.json at INSTALL
	// time — SHA-256 of every recipe-delivered file (src + root) — so the
	// FIRST upgrade already has a real baseline instead of treating every
	// divergence as a user modification (#283). Skipped when no recipe files
	// are delivered (the dashboard flow reuses the base mode with an empty
	// file set; the dashboard mode initializes its own merged baseline).
	if (Object.keys(files).length > 0) {
		sv.file('.svforge-versions.json', () =>
			initTrackingJson('base', SDFORGE_RECIPE_VERSION, { ...files, ...rootFiles }, BASE_ROOT_PATHS)
		);
	}

	// AI-ready: scaffold AGENTS.md at the project root (#203, #347) — the
	// sole agent convention of a SvelteForge project.
	sv.file('AGENTS.md', () => scaffoldedAgents('base'));

	// #317: ship the cached Skeleton/Svelte LLM references so agents search
	// local, version-matched docs before changing Skeleton UI/theme.
	for (const [doc, content] of Object.entries(scaffoldedLocalDocs())) {
		sv.file(doc, () => content);
	}

	// AI context (#234): machine-readable manifest + llms.txt, derived from
	// the real scaffold state. The dashboard mode overrides with its template.
	const manifest = buildManifest('base', []);
	sv.file('.svforge.json', () => `${JSON.stringify(manifest, null, 2)}\n`);
	sv.file('llms.txt', () => renderLlmstxt(manifest));
}
