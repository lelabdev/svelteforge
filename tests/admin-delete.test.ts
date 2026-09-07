import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SERVER_FILE = join(
	ROOT,
	'packages/svforge/templates/dashboard/src/routes/(app)/admin/users/+page.server.ts'
);

/** Regression contract for #337: routine admin lifecycle changes are non-destructive. */
describe('admin user lifecycle (#337)', () => {
	const source = readFileSync(SERVER_FILE, 'utf-8');

	it('uses deactivation rather than physically deleting identity or accounts', () => {
		expect(source).toContain('toggleStatus:');
		expect(source).toMatch(/tx\.update\(user\)\.set\(\{ disabled/);
		expect(source).not.toMatch(/\.delete\(user\)/);
		expect(source).not.toMatch(/\.delete\(account\)/);
	});

	it('revokes sessions when deactivating and protects the administrator', () => {
		expect(source).toMatch(/if \(disabled\) await tx\.delete\(session\)/);
		expect(source).toContain("code: 'self_deactivate'");
	});
});
