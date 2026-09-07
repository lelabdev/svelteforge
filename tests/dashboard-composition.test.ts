import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ADMIN_LAYOUT = join(
	ROOT,
	'packages/svforge/templates/dashboard/src/lib/components/svforge/layout/AdminLayout.svelte'
);
const ADMIN_PAGE = join(
	ROOT,
	'packages/svforge/templates/dashboard/src/routes/(app)/admin/+page.svelte'
);
const MESSAGES = join(ROOT, 'packages/svforge/templates/base/root/messages');

function headingMessageKey(source: string, level: 'h1' | 'h2'): string {
	const match = source.match(new RegExp(`<${level}[^>]*>\\s*\\{m\\.([a-z0-9_]+)\\(\\)\\}\\s*</${level}>`));
	if (!match) throw new Error(`Missing localized ${level} heading`);
	return match[1];
}

describe('dashboard admin composition', () => {
	it('gives /admin a global shell context and a distinct page title in FR and EN', () => {
		const shell = readFileSync(ADMIN_LAYOUT, 'utf8');
		const page = readFileSync(ADMIN_PAGE, 'utf8');
		const shellKey = headingMessageKey(shell, 'h1');
		const pageKey = headingMessageKey(page, 'h2');
		expect(shellKey).toBe('layout_admin');
		expect(pageKey).toBe('admin_dashboard');

		for (const locale of ['fr', 'en']) {
			const messages = JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), 'utf8'));
			expect(messages[shellKey]).toBeTruthy();
			expect(messages[pageKey]).toBeTruthy();
			expect(messages[shellKey]).not.toBe(messages[pageKey]);
		}
	});
});
