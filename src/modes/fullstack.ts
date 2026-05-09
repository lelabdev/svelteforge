/**
 * Apply Fullstack mode files via sv.file()
 * Fullstack = UI + dashboard + auth + DB
 */
export function applyFullstackMode(
	sv: any,
	files: Record<string, string>
): void {
	// Fullstack-specific deps already declared in run()
	// Additional devDeps for testing
	sv.devDependency('@testing-library/jest-dom', '^6.9.1');
	sv.devDependency('@testing-library/svelte', '^5.3.1');
	sv.devDependency('jsdom', '^29.1.1');
	sv.devDependency('vitest', '^4.1.5');

	// Write all fullstack template files
	for (const [path, content] of Object.entries(files)) {
		sv.file(`src${path}`, content);
	}
}
