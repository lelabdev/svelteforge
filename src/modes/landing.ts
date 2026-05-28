import type { landingFiles, fullstackFiles } from '../templates';

/**
 * Apply Landing mode files via sv.file()
 * Landing = UI base kit for building a landing page
 */

// Components excluded from landing mode
const UI_SKIP = [
	'AuthCard',
	'DataTable',
	'NavigationLoader',
	'NotificationBadge',
	'SearchInput',
	'.test.ts'
];
const LAYOUT_SKIP = ['auth-buttons', 'AdminSidebar'];

function shouldSkipUi(name: string): boolean {
	return UI_SKIP.some((s) => name.startsWith(s) || name.endsWith(s));
}

function shouldSkipLayout(name: string): boolean {
	return LAYOUT_SKIP.some((s) => name.startsWith(s));
}

/**
 * Convert a kebab-case filename to PascalCase component name
 * e.g. "mobile-menu" → "MobileMenu", "nav-links" → "NavLinks"
 */
function toPascalCase(str: string): string {
	return str
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

/**
 * Generate a barrel index.ts that only exports files present in the filtered set
 */
function generateBarrel(
	files: Map<string, string>,
	directory: string
): string {
	const lines: string[] = [];
	// Sort for deterministic output
	const sortedPaths = [...files.keys()].filter((p) => p.startsWith(directory)).sort();

	for (const path of sortedPaths) {
		const name = path.split('/').pop() || '';
		if (name === 'index.ts' || name.endsWith('.test.ts')) continue;

		if (name.endsWith('.svelte')) {
			const baseName = name.replace(/\.svelte$/, '');
			const exportName = baseName.includes('-') ? toPascalCase(baseName) : baseName;
			lines.push(`export { default as ${exportName} } from './${name}';`);
		} else if (name.endsWith('.ts')) {
			// TS files — re-export all named exports
			lines.push(`export * from './${name}';`);
		}
	}
	return lines.join('\n') + '\n';
}

export function applyLandingMode(
	sv: any,
	landingFiles: Record<string, string>,
	fullstackFiles: Record<string, string>,
	projectName: string
): void {
	// ── Filter fullstack files for landing mode ──
	const includedFiles = new Map<string, string>();
	// Track which UI/layout component files exist (for barrel generation)
	const uiFiles = new Map<string, string>();
	const uiFormFiles = new Map<string, string>();
	const uiRichTextFiles = new Map<string, string>();
	const layoutFiles = new Map<string, string>();

	for (const [path, content] of Object.entries(fullstackFiles)) {
		// UI components
		if (path.startsWith('/lib/components/ui/')) {
			const name = path.split('/').pop() || '';
			if (shouldSkipUi(name)) continue;

			includedFiles.set(path, content);

			// Categorize for barrel generation
			if (path.startsWith('/lib/components/ui/form/') && !path.endsWith('index.ts')) {
				uiFormFiles.set(path, content);
			} else if (path.startsWith('/lib/components/ui/rich-text/') && !path.endsWith('index.ts')) {
				uiRichTextFiles.set(path, content);
			} else if (!path.endsWith('index.ts')) {
				uiFiles.set(path, content);
			}
			continue;
		}

		// Layout components
		if (path.startsWith('/lib/components/layout/')) {
			const name = path.split('/').pop() || '';
			if (shouldSkipLayout(name)) continue;

			includedFiles.set(path, content);
			if (!path.endsWith('index.ts')) {
				layoutFiles.set(path, content);
			}
			continue;
		}

		// Skip barrel files — we'll regenerate them
		if (
			path === '/lib/components/ui/index.ts' ||
			path === '/lib/components/ui/form/index.ts' ||
			path === '/lib/components/layout/index.ts' ||
			path === '/lib/components/index.ts'
		) {
			continue;
		}

		// Icons
		if (path.startsWith('/lib/components/icons/')) {
			includedFiles.set(path, content);
			continue;
		}
		// Styles
		if (path.startsWith('/lib/styles/')) {
			includedFiles.set(path, content);
			continue;
		}
		// Utils (but skip test files and export/slugify/form-errors)
		if (path.startsWith('/lib/utils/')) {
			const name = path.split('/').pop() || '';
			if (name.endsWith('.test.ts')) continue;
			if (['export.ts', 'slugify.ts', 'form-errors.ts'].includes(name)) continue;
			includedFiles.set(path, content);
			continue;
		}
		// Core files
		if (['/lib/errors.ts', '/lib/logger.ts', '/lib/types.ts', '/lib/index.ts'].includes(path)) {
			includedFiles.set(path, content);
			continue;
		}
		// Schemas
		if (path.startsWith('/lib/schemas/')) {
			includedFiles.set(path, content);
			continue;
		}
		// Shared config files
		if (['/app.css', '/app.html'].includes(path)) {
			includedFiles.set(path, content);
			continue;
		}
		// Legal routes
		if (path.startsWith('/routes/(legal)/')) {
			includedFiles.set(path, content);
			continue;
		}
		// Error page
		if (path === '/routes/+error.svelte') {
			includedFiles.set(path, content);
			continue;
		}
		// Skip everything else (admin routes, auth routes, protected routes, dashboard, etc.)
	}

	// ── Write filtered files ──
	for (const [path, content] of includedFiles) {
		sv.file(`src${path}`, () => content);
	}

	// ── Write generated barrel files ──
	sv.file('src/lib/components/ui/index.ts', () => {
		let barrel = generateBarrel(uiFiles, '/lib/components/ui/');
		// Append rich-text barrel re-export if files exist
		if (uiRichTextFiles.size > 0) {
			barrel += '\n// === Rich Text ===\nexport * from \'./rich-text\';\n';
		}
		// Append form barrel re-export if files exist
		if (uiFormFiles.size > 0) {
			barrel += '\n// === Form ===\nexport * from \'./form\';\n';
		}
		return barrel;
	});

	sv.file('src/lib/components/ui/form/index.ts', () => {
		const svelteComponents: string[] = [];
		const tsFiles: string[] = [];
		for (const path of [...uiFormFiles.keys()].sort()) {
			const name = path.split('/').pop() || '';
			if (name.endsWith('.svelte')) {
				svelteComponents.push(name.replace('.svelte', ''));
			} else if (name.endsWith('.ts') && name !== 'index.ts') {
				tsFiles.push(name);
			}
		}
		const imports = svelteComponents
			.map((c) => `import ${c} from './${c}.svelte';`)
			.join('\n');
		const exports = svelteComponents.join(', ');
		let result = `${imports}\n\nexport { ${exports} };\n`;
		for (const ts of tsFiles) {
			result += `export * from './${ts}';\n`;
		}
		return result;
	});

	sv.file('src/lib/components/layout/index.ts', () => {
		return generateBarrel(layoutFiles, '/lib/components/layout/');
	});

	// Top-level components barrel — re-exports layout + ui
	sv.file('src/lib/components/index.ts', () => {
		return `// Layout components\nexport * from './layout';\n\n// UI components\nexport * from './ui';\n`;
	});

	// Rich-text barrel
	if (uiRichTextFiles.size > 0) {
		sv.file('src/lib/components/ui/rich-text/index.ts', () => {
			return generateBarrel(uiRichTextFiles, '/lib/components/ui/rich-text/');
		});
	}

	// ── Landing-specific overrides (replace fullstack versions) ──
	for (const [path, content] of Object.entries(landingFiles)) {
		const finalContent = content.replace(/__PROJECT_NAME__/g, projectName);
		sv.file(`src${path}`, () => finalContent);
	}
}
