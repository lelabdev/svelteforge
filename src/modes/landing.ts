import type { landingFiles, fullstackFiles } from '../templates';

/**
 * Apply Landing mode files via sv.file()
 * Landing = UI only, no auth/DB, simplified navbar
 */
export function applyLandingMode(
	sv: any,
	files: Record<string, string>,
	projectName: string
): void {
	// Landing-specific deps (fonts, tipTap, utils)
	// Already declared in run() shared section

	// Landing overrides: navbar, layout, page, app.d.ts
	for (const [path, content] of Object.entries(files)) {
		// Replace __PROJECT_NAME__ placeholder in landing navbar
		const finalContent = content.replace(/__PROJECT_NAME__/g, projectName);
		sv.file(`src${path}`, finalContent);
	}
}
