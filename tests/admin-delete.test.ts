import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SERVER_FILE = join(
	ROOT,
	'packages/svforge/templates/dashboard/src/routes/(app)/admin/users/+page.server.ts'
);

/**
 * Regression tests for #168 — the delete action must perform a complete,
 * atomic deletion of all related records (sessions, accounts, user).
 *
 * The previous implementation deleted session rows twice, never deleted
 * accounts or the user, and reported success for unknown IDs.
 *
 * Since this is a template file (not a running SvelteKit app), we verify
 * the implementation via static analysis of the delete action body.
 */
describe('admin user deletion transaction (#168)', () => {
	const source = readFileSync(SERVER_FILE, 'utf-8');

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

	const deleteBody = extractActionBody('delete');

	it('deletes sessions exactly once (not duplicated)', () => {
		const sessionDeleteCount = (deleteBody.match(/\b(?:db|tx)\.delete\(session\)/g) || []).length;
		expect(sessionDeleteCount).toBe(1);
	});

	it('deletes accounts', () => {
		expect(deleteBody).toMatch(/\b(?:db|tx)\.delete\(account\)/);
	});

	it('deletes the user', () => {
		expect(deleteBody).toMatch(/\b(?:db|tx)\.delete\(user\b/);
	});

	it('wraps all deletions in a single transaction', () => {
		// Either db.transaction or sequential deletes in a transaction callback
		expect(deleteBody).toMatch(/transaction/);
	});

	it('checks for unknown user id and returns an error', () => {
		// Must verify the user exists before attempting deletion
		expect(deleteBody).toMatch(/select.*user|exists|not found|unknown/i);
	});

	it('preserves the self-delete protection', () => {
		expect(deleteBody).toMatch(/self.?delete|cannot delete.*own/i);
	});

	it('deletes in FK-safe order: session → account → user', () => {
		const sessionIdx = deleteBody.search(/\b(?:db|tx)\.delete\(session\)/);
		const accountIdx = deleteBody.search(/\b(?:db|tx)\.delete\(account\)/);
		const userIdx = deleteBody.search(/\b(?:db|tx)\.delete\(user\b/);

		expect(sessionIdx).toBeGreaterThan(-1);
		expect(accountIdx).toBeGreaterThan(-1);
		expect(userIdx).toBeGreaterThan(-1);
		expect(sessionIdx).toBeLessThan(accountIdx);
		expect(accountIdx).toBeLessThan(userIdx);
	});
});
