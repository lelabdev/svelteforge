/**
 * Apply Dashboard mode files via sv.file()
 * Dashboard = base + admin dashboard + auth + DB
 */
export function applyDashboardMode(
	sv: any,
	baseFiles: Record<string, string>,
	dashboardFiles: Record<string, string>
): void {
	// Dashboard-specific devDeps for testing
	sv.devDependency('@testing-library/jest-dom', '^6.9.1');
	sv.devDependency('@testing-library/svelte', '^5.3.1');
	sv.devDependency('jsdom', '^29.1.1');
	sv.devDependency('vitest', '^4.1.5');

	// Write all base files first
	for (const [path, content] of Object.entries(baseFiles)) {
		sv.file(`src${path}`, () => content);
	}

	// Then overlay dashboard-specific files (routes, admin components)
	for (const [path, content] of Object.entries(dashboardFiles)) {
		sv.file(`src${path}`, () => content);
	}
}
