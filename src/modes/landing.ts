/**
 * Apply Landing mode files via sv.file()
 * Landing = UI only, no auth/DB, simplified navbar
 */
export function applyLandingMode(
	sv: any,
	files: Record<string, string>,
	projectName: string
): void {
	// Landing overrides: navbar, layout, page, app.d.ts
	for (const [path, content] of Object.entries(files)) {
		// Replace __PROJECT_NAME__ placeholder in landing navbar
		const finalContent = content.replace(/__PROJECT_NAME__/g, projectName);
		sv.file(`src${path}`, () => finalContent);
	}
}
