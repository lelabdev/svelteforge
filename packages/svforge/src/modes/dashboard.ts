/**
 * Apply Dashboard mode files via sv.file()
 * Dashboard = base + admin dashboard + auth + DB
 */
export function applyDashboardMode(
	sv: any,
	baseFiles: Record<string, string>,
	dashboardFiles: Record<string, string>,
	testing: 'vitest' | 'playwright' = 'vitest'
): void {
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
		sv.file(`src${path}`, () => content);
	}
}
