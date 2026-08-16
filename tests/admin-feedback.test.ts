import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const USERS_PAGE = join(
	ROOT,
	'packages/svforge/templates/dashboard/src/routes/(app)/admin/users/+page.svelte'
);
const USERS_SERVER = join(
	ROOT,
	'packages/svforge/templates/dashboard/src/routes/(app)/admin/users/+page.server.ts'
);
const LOGIN_SERVER = join(ROOT, 'packages/svforge/templates/dashboard/src/routes/login/+page.server.ts');
const SETTINGS_SERVER = join(
	ROOT,
	'packages/svforge/templates/dashboard/src/routes/(app)/admin/settings/+page.server.ts'
);
const SETUP_SERVER = join(ROOT, 'packages/svforge/templates/dashboard/src/routes/setup/+page.server.ts');
const LAYOUT = join(ROOT, 'packages/svforge/templates/dashboard/src/routes/(app)/+layout.svelte');

/**
 * Regression guards for #188 + #196.
 *
 * #188: SvelteKit action responses are `{ type, data }` — the message lives at
 * result.data.message, not result.message. Also: never leak e.message to the UI
 * (generic message instead); toggleVerify must have an error branch.
 *
 * #196: Svelte 5 runes — $app/stores is the legacy store form; $app/state is
 * the modern equivalent (no $ prefix on access).
 */
describe('admin action feedback (#188)', () => {
	const page = readFileSync(USERS_PAGE, 'utf-8');

	it('reads the message from result.data, not result.message', () => {
		// Must read data.message with a fallback — and never the old result.message
		expect(page).not.toMatch(/result\.message\b/);
		expect(page).toMatch(/result\.data\?\.message \|\|/);
	});

	it('toggleVerify has an error branch', () => {
		// #267: the fallback copy is i18n via Paraglide (m.users_verify_failed)
		// instead of hard-coded English — the branch must still exist.
		expect(page).toMatch(/m\.users_verify_failed\(\)/);
	});

	it('never exposes raw e.message to the UI (server actions)', () => {
		for (const f of [USERS_SERVER, LOGIN_SERVER, SETTINGS_SERVER, SETUP_SERVER]) {
			const src = readFileSync(f, 'utf-8');
			// e.message may appear in comments only; the actual catch must use
			// a generic message.
			const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
			expect(code, f).not.toMatch(/e\.message/);
			expect(code, f).not.toMatch(/instanceof Error \?/);
		}
	});
});

describe('auth hooks composition (#268 screenshots regression)', () => {
	it('hooks.server.ts chains handleBetterAuth — locals.session must be populated', () => {
		// Found while capturing dashboard screenshots: `handle = handleParaglide`
		// meant better-auth never ran, so locals.session/locals.user were always
		// undefined and every protected route redirected to /login.
		const hooks = readFileSync(join(ROOT, 'packages/svforge/templates/dashboard/src/hooks.server.ts'), 'utf-8');
		expect(hooks).toMatch(/paraglideMiddleware\(event\.request, async \(\{ request, locale \}\) =>/);
		expect(hooks).toMatch(/handleBetterAuth\(\{ event, resolve \}\)/);
		expect(hooks).not.toMatch(/handle: Handle = handleParaglide/);
		expect(hooks).toMatch(/getSession/);
		expect(hooks).toMatch(/locals\.session/);
	});
});

describe('PostgreSQL-safe dashboard queries (#268 regression)', () => {
	it('admin stats never interpolate raw Date.now() into SQL', () => {
		// Found while capturing screenshots: `expires_at > ${Date.now()}` sends a
		// bigint against a timestamptz column — PostgreSQL rejects it and the
		// dashboard 500s after login. Use now() / now() - interval.
		const page = readFileSync(join(ROOT, 'packages/svforge/templates/dashboard/src/routes/(app)/admin/+page.server.ts'), 'utf-8');
		expect(page).not.toMatch(/Date\.now\(\)/);
		expect(page).toMatch(/expires_at > now\(\)/);
		expect(page).toMatch(/created_at > now\(\) - interval '7 days'/);
	});
});

describe('Svelte 5 $app/state (#196)', () => {
	it('no $app/stores imports remain in the dashboard template', () => {
		const files = [USERS_PAGE, LAYOUT];
		for (const f of files) {
			expect(readFileSync(f, 'utf-8'), f).not.toMatch(/from '\$app\/stores'/);
		}
	});

	it('page is accessed without the $ store prefix', () => {
		const page = readFileSync(USERS_PAGE, 'utf-8');
		expect(page).toMatch(/\$app\/state/);
		expect(page).not.toMatch(/\$page\./);
	});
});
