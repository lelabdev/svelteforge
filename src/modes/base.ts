/**
 * Apply Base mode files via sv.file()
 * Base = all UI components, layouts, styles, utils, schemas
 */
export function applyBaseMode(
	sv: any,
	files: Record<string, string>
): void {
	// Write all base template files
	for (const [path, content] of Object.entries(files)) {
		sv.file(`src${path}`, () => content);
	}
}
