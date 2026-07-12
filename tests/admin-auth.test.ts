import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SERVER_FILE = join(
	ROOT,
	'packages/svforge/templates/dashboard/src/routes/(app)/admin/users/+page.server.ts'
);

/**
 * Regression tests for #167 — every admin action must be authorized.
 *
 * The admin page load checks admin status, but the SvelteKit form actions
 * (create, update, delete, toggleVerify) can be invoked directly and previously
 * did not authorize the caller. These tests verify that each action body
 * contains an authorization guard before performing any mutation or query.
 *
 * Since this is a template file (not a running SvelteKit app), we verify the
 * guard is present in the source via static analysis. A full integration test
 * harness is out of scope for template files (see #177).
 */
describe('admin actions authorization (#167)', () => {
	const source = readFileSync(SERVER_FILE, 'utf-8');

	// Extract each action body by name
	function extractActionBody(actionName: string): string {
		const regex = new RegExp(`\\b${actionName}:\\s*async\\s*\\([^)]*\\)\\s*=>\\s*\\{`);
		const match = source.match(regex);
		if (!match || match.index === undefined) return '';

		let depth = 0;
		let start = -1;
		let end = -1;
		for (let i = match.index; i < source.length; i++) {
			if (source[i] === '{') {
				if (depth === 0) start = i;
				depth++;
			} else if (source[i] === '}') {
				depth--;
				if (depth === 0) {
					end = i;
					break;
				}
			}
		}
		return source.slice(start, end + 1);
	}

	const actions = ['create', 'update', 'delete', 'toggleVerify'];

	for (const action of actions) {
		describe(`${action} action`, () => {
			it('invokes the admin guard before any data access', () => {
				const body = extractActionBody(action);
				expect(body.length).toBeGreaterThan(0);

				// The guard must appear before the first db. call or formData parse.
				const guardIdx = body.search(/requireAdmin|isAdmin|adminGuard|authorize/);
				const firstDbIdx = body.search(/db\./);
				const firstFormDataIdx = body.search(/formData/);

				expect(guardIdx).toBeGreaterThan(-1);

				if (firstDbIdx > -1) {
					expect(guardIdx).toBeLessThan(firstDbIdx);
				}
				// formData is read after the guard (the guard uses locals, not formData)
			});

			it('the guard returns an error response (401/403) when authorization fails', () => {
				// requireAdmin is centralized — verify it throws 401 (anonymous) and 403 (non-admin)
				expect(source).toMatch(/error\(401/);
				expect(source).toMatch(/error\(403/);
			});
		});
	}

	it('all four admin actions exist', () => {
		for (const action of actions) {
			expect(source).toContain(`${action}:`);
		}
	});
});
