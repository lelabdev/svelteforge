/**
 * Apply Landing mode files via sv.file()
 * Landing = UI base kit for building a landing page
 *
 * Copies:
 * - Base UI components (Button, Card, Badge, Toast, ThemeToggle, etc.)
 * - All styles (svelteForge.css, tokens.css, fonts.css)
 * - All utils (cn, formatters, theme store, etc.)
 * - Schemas, errors, logger, types, index
 * - Landing-specific overrides (simplified navbar, layout, page)
 */
export function applyLandingMode(
	sv: any,
	fullstackFiles: Record<string, string>,
	landingFiles: Record<string, string>,
	projectName: string
): void {
	// ── Shared files from fullstack template ──
	// Components: all UI base components + icons + layout (footer, nav-links, etc.)
	// Styles, utils, schemas, stores, errors, logger, types, index
	const sharedPaths = Object.entries(fullstackFiles).filter(([path]) => {
		// UI components (base ones for landing)
		if (path.startsWith('/lib/components/ui/')) {
			// Skip auth/admin-only components
			const name = path.split('/').pop() || '';
			const skip = ['AuthCard', 'DataTable', 'NavigationLoader', 'NotificationBadge', 'SearchInput'];
			if (skip.some(s => name.startsWith(s))) return false;
			// Skip tests
			if (name.endsWith('.test.ts')) return false;
			return true;
		}
		// Layout components (footer, nav-links, mobile-menu — but NOT auth-buttons, AdminSidebar)
		if (path.startsWith('/lib/components/layout/')) {
			const name = path.split('/').pop() || '';
			const skip = ['auth-buttons', 'AdminSidebar', 'nav-links'];
			if (skip.some(s => name.startsWith(s))) return false;
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
		if (['/lib/errors.ts', '/lib/logger.ts', '/lib/types.ts', '/lib/index.ts'].includes(path)) return true;
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
