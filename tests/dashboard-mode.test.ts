import { describe, it, expect } from 'vitest';
import { applyDashboardMode } from '../packages/svforge/src/modes/dashboard';

type FakeSv = {
	dependencies: string[];
	devDependencies: string[];
	files: Map<string, string>;
	dependency: (name: string, version: string) => void;
	devDependency: (name: string, version: string) => void;
	file: (path: string, transform: (content: string) => string) => void;
};

function fakeSv(): FakeSv {
	const sv: FakeSv = {
		dependencies: [],
		devDependencies: [],
		files: new Map(),
		dependency(name) {
			this.dependencies.push(name);
		},
		devDependency(name) {
			this.devDependencies.push(name);
		},
		file(path, transform) {
			this.files.set(path, transform(path === 'package.json' ? '{"scripts":{}}' : ''));
		}
	};
	return sv;
}

const baseFiles = { '/lib/base.ts': 'base' };
const dashboardFiles = {
	'/routes/(app)/+layout.server.test.ts': 'vitest',
	'/playwright.config.ts': 'playwright',
	'/vitest.config.ts': 'vitest-config',
	'/e2e/auth.test.ts': 'e2e'
};
const rootFiles = {
	'/drizzle.config.ts': 'drizzle-config',
	'/.env.example': 'env-example',
	'/scripts/setup.sh': 'setup-script',
	'/static/robots.txt': 'robots'
};

describe('dashboard testing profiles', () => {
	it('includes Vitest and excludes Playwright files by default', () => {
		const sv = fakeSv();
		applyDashboardMode(sv, baseFiles, dashboardFiles, 'vitest');

		expect(sv.devDependencies).toContain('vitest');
		expect(sv.devDependencies).not.toContain('@playwright/test');
		expect(sv.files.has('src/routes/(app)/+layout.server.test.ts')).toBe(true);
		expect(sv.files.has('playwright.config.ts')).toBe(false);
		expect(sv.files.has('e2e/auth.test.ts')).toBe(false);
		expect(JSON.parse(sv.files.get('package.json')!).scripts.test).toBe('vitest run');
	});

	it('adds Playwright files, dependency, and script only when selected', () => {
		const sv = fakeSv();
		applyDashboardMode(sv, baseFiles, dashboardFiles, 'playwright');

		expect(sv.devDependencies).toContain('vitest');
		expect(sv.devDependencies).toContain('@playwright/test');
		expect(sv.files.has('playwright.config.ts')).toBe(true);
		expect(sv.files.has('e2e/auth.test.ts')).toBe(true);
		expect(JSON.parse(sv.files.get('package.json')!).scripts['test:e2e']).toBe('playwright test');
	});

	it('adds the PostgreSQL driver and never libsql (#255)', () => {
		const sv = fakeSv();
		applyDashboardMode(sv, baseFiles, dashboardFiles, 'vitest');

		expect(sv.dependencies).toContain('postgres');
		expect(sv.dependencies).not.toContain('@libsql/client');
		expect(sv.dependencies).toContain('drizzle-orm');
	});

	it('writes test configs at the project root, not under src/ (#186)', () => {
		const sv = fakeSv();
		applyDashboardMode(sv, baseFiles, dashboardFiles, 'playwright');

		// Playwright and Vitest discover their config only at the project root,
		// and playwright.config.ts references testDir './e2e' relative to root.
		expect(sv.files.has('playwright.config.ts')).toBe(true);
		expect(sv.files.has('vitest.config.ts')).toBe(true);
		expect(sv.files.has('e2e/auth.test.ts')).toBe(true);
		expect(sv.files.has('src/playwright.config.ts')).toBe(false);
		expect(sv.files.has('src/vitest.config.ts')).toBe(false);
		expect(sv.files.has('src/e2e/auth.test.ts')).toBe(false);
	});

	it('writes root-level files at the project root (#187)', () => {
		const sv = fakeSv();
		applyDashboardMode(sv, baseFiles, dashboardFiles, 'vitest', rootFiles);

		// drizzle.config.ts, .env.example, scripts/setup.sh, static/robots.txt
		// must land at the project root — prebuild only ships templates/src/**,
		// so without the root/ embed they were never scaffolded (#187).
		expect(sv.files.has('drizzle.config.ts')).toBe(true);
		expect(sv.files.has('.env.example')).toBe(true);
		expect(sv.files.has('scripts/setup.sh')).toBe(true);
		expect(sv.files.has('static/robots.txt')).toBe(true);
		expect(sv.files.has('src/drizzle.config.ts')).toBe(false);
		expect(sv.files.has('src/.env.example')).toBe(false);
	});
});
