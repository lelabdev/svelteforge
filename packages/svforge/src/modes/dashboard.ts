/**
 * Apply Dashboard mode files via sv.file()
 * Dashboard = base + admin dashboard + auth + DB
 */

// Files that must land at the PROJECT ROOT, not under src/ (#186):
// Playwright and Vitest discover their config only at the root, and e2e/
// is the default testDir referenced by playwright.config.ts.
const ROOT_FILES = new Set(['/playwright.config.ts', '/vitest.config.ts']);

export function applyDashboardMode(
	sv: any,
	baseFiles: Record<string, string>,
	dashboardFiles: Record<string, string>,
	testing: 'vitest' | 'playwright' = 'vitest',
	rootFiles: Record<string, string> = {}
): void {
	// Dashboard-specific runtime dependencies
	sv.dependency('drizzle-orm', '^0.45.2');
	sv.dependency('@libsql/client', '^0.17.2');
	sv.dependency('better-auth', '~1.4.21');

	// Dashboard-specific dev dependencies
	sv.devDependency('drizzle-kit', '^0.31.10');
	sv.devDependency('@better-auth/cli', '~1.4.21');
	sv.devDependency('@types/node', '^22');

	// Dashboard-specific Vitest baseline (#180)
	sv.devDependency('@testing-library/jest-dom', '^6.9.1');
	sv.devDependency('@testing-library/svelte', '^5.3.1');
	sv.devDependency('jsdom', '^29.1.1');
	sv.devDependency('vitest', '^4.1.5');

	if (testing === 'playwright') {
		// Full browser profile is explicitly opt-in (#181)
		sv.devDependency('@playwright/test', '^1.52.0');
	}

	// Add runnable test scripts to the generated dashboard.
	sv.file('package.json', (content: string) => {
		const pkg = JSON.parse(content);
		pkg.scripts = {
			...pkg.scripts,
			test: 'vitest run',
			...(testing === 'playwright' ? { 'test:e2e': 'playwright test' } : {})
		};
		return `${JSON.stringify(pkg, null, 2)}\n`;
	});

	// Write all base files first
	for (const [path, content] of Object.entries(baseFiles)) {
		sv.file(`src${path}`, () => content);
	}

	// Then overlay dashboard-specific files (routes, admin components)
	for (const [path, content] of Object.entries(dashboardFiles)) {
		const isPlaywrightFile = path === '/playwright.config.ts' || path.startsWith('/e2e/');
		if (isPlaywrightFile && testing !== 'playwright') continue;
		// Root-level files (test configs) go to the project root; everything
		// else is src-relative (#186).
		const isRoot = ROOT_FILES.has(path) || path.startsWith('/e2e/');
		const dest = isRoot ? path.slice(1) : `src${path}`;
		sv.file(dest, () => content);
	}

	// Finally, write root-level project files (drizzle.config.ts, .env.example,
	// scripts/setup.sh, static/robots.txt) at the project root (#187).
	for (const [path, content] of Object.entries(rootFiles)) {
		sv.file(path.slice(1), () => content);
	}
}
