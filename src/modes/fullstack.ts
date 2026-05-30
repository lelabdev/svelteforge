/**
 * Apply Fullstack mode files via sv.file()
 * Fullstack = base + admin/auth/DB routes + testing
 */
export function applyFullstackMode(
	sv: any,
	baseFiles: Record<string, string>,
	fullstackFiles: Record<string, string>
): void {
	// Fullstack-specific devDeps for testing
	sv.devDependency('@testing-library/jest-dom', '^6.9.1');
	sv.devDependency('@testing-library/svelte', '^5.3.1');
	sv.devDependency('jsdom', '^29.1.1');
	sv.devDependency('vitest', '^4.1.5');

	// Write all base files first
	for (const [path, content] of Object.entries(baseFiles)) {
		sv.file(`src${path}`, () => content);
	}

	// Then overlay fullstack-specific files (routes, admin components)
	for (const [path, content] of Object.entries(fullstackFiles)) {
		sv.file(`src${path}`, () => content);
	}
}
