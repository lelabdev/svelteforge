import type { landingFiles, fullstackFiles } from '../templates';

/**
 * Apply Landing mode files via sv.file()
 * Landing = UI base kit for building a landing page
 */
export function applyLandingMode(
	sv: any,
	landingFiles: Record<string, string>,
	fullstackFiles: Record<string, string>,
	projectName: string
): void {
	// ── Shared base components from fullstack template ──
	const sharedPaths = Object.entries(fullstackFiles).filter(([path]) => {
		// UI components (base ones for landing)
		if (path.startsWith('/lib/components/ui/')) {
			const name = path.split('/').pop() || '';
			// Skip auth/admin-only components and tests
			const skip = [
				'AuthCard',
				'DataTable',
				'NavigationLoader',
				'NotificationBadge',
				'SearchInput',
				'.test.ts'
			];
			if (skip.some((s) => name.startsWith(s) || name.endsWith(s))) return false;
			return true;
		}
		// Layout components (footer, nav-links, mobile-menu — but NOT auth-buttons, AdminSidebar)
		if (path.startsWith('/lib/components/layout/')) {
			const name = path.split('/').pop() || '';
			const skip = ['auth-buttons', 'AdminSidebar'];
			if (skip.some((s) => name.startsWith(s))) return false;
			return true;
		}
		// Icons
		if (path.startsWith('/lib/components/icons/')) return true;
		// Component barrel exports
		if (path === '/lib/components/index.ts') return true;
		if (path.startsWith('/lib/components/layout/index.ts')) return true;
		if (path.startsWith('/lib/components/ui/index.ts')) return true;
		if (path.startsWith('/lib/components/ui/form/index.ts')) return true;
		// Styles
		if (path.startsWith('/lib/styles/')) return true;
		// Utils (but skip test files and export/slugify/form-errors)
		if (path.startsWith('/lib/utils/')) {
			const name = path.split('/').pop() || '';
			if (name.endsWith('.test.ts')) return false;
			if (['export.ts', 'slugify.ts', 'form-errors.ts'].includes(name)) return false;
			return true;
		}
		// Core files
		if (['/lib/errors.ts', '/lib/logger.ts', '/lib/types.ts', '/lib/index.ts'].includes(path))
			return true;
		// Schemas
		if (path.startsWith('/lib/schemas/')) return true;
		// Shared config files
		if (['/app.css', '/app.html'].includes(path)) return true;
		// Legal routes
		if (path.startsWith('/routes/(legal)/')) return true;
		// Error page
		if (path === '/routes/+error.svelte') return true;
		return false;
	});

	for (const [path, content] of sharedPaths) {
		sv.file(`src${path}`, () => content);
	}

	// ── Landing-specific overrides (replace fullstack versions) ──
	for (const [path, content] of Object.entries(landingFiles)) {
		const finalContent = content.replace(/__PROJECT_NAME__/g, projectName);
		sv.file(`src${path}`, () => finalContent);
	}
}
