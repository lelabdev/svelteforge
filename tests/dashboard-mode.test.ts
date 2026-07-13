import { describe, it, expect } from 'vitest';
import { applyDashboardMode } from '../packages/svforge/src/modes/dashboard';

type FakeSv = {
	devDependencies: string[];
	files: Map<string, string>;
	devDependency: (name: string, version: string) => void;
	file: (path: string, transform: (content: string) => string) => void;
};

function fakeSv(): FakeSv {
	const sv: FakeSv = {
		devDependencies: [],
		files: new Map(),
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
	'/e2e/auth.test.ts': 'e2e'
};

describe('dashboard testing profiles', () => {
	it('includes Vitest and excludes Playwright files by default', () => {
		const sv = fakeSv();
		applyDashboardMode(sv, baseFiles, dashboardFiles, 'vitest');

		expect(sv.devDependencies).toContain('vitest');
		expect(sv.devDependencies).not.toContain('@playwright/test');
		expect(sv.files.has('src/routes/(app)/+layout.server.test.ts')).toBe(true);
		expect(sv.files.has('src/playwright.config.ts')).toBe(false);
		expect(sv.files.has('src/e2e/auth.test.ts')).toBe(false);
		expect(JSON.parse(sv.files.get('package.json')!).scripts.test).toBe('vitest run');
	});

	it('adds Playwright files, dependency, and script only when selected', () => {
		const sv = fakeSv();
		applyDashboardMode(sv, baseFiles, dashboardFiles, 'playwright');

		expect(sv.devDependencies).toContain('vitest');
		expect(sv.devDependencies).toContain('@playwright/test');
		expect(sv.files.has('src/playwright.config.ts')).toBe(true);
		expect(sv.files.has('src/e2e/auth.test.ts')).toBe(true);
		expect(JSON.parse(sv.files.get('package.json')!).scripts['test:e2e']).toBe('playwright test');
	});
});
