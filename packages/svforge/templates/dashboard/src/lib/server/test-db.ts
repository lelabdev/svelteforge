/**
 * Dedicated test-database contract (#312).
 *
 * Integration suites must NEVER touch the application database. They resolve
 * their connection exclusively from TEST_DATABASE_URL, and they REFUSE to run
 * unless the target database name carries an explicit `test` segment — a dev
 * URL like `postgres://…/myapp` is rejected before a single row is read.
 *
 * This module is intentionally dependency-free so both the scaffolded suites
 * and the repository-level contract tests can import it directly.
 */

/**
 * Every identity created by an integration suite is namespaced with a
 * PER-RUN email domain (see {@link runEmailDomain}). Cleanup only ever
 * deletes rows of the CURRENT run's domain — a concurrent test process
 * (another run) is never touched (#312).
 */
export const TEST_EMAIL_DOMAIN = 'sf-test.example';

/**
 * The email domain reserved to ONE test run: `'<run>.sf-test.example'`.
 * Cleanup predicates MUST be built from this (never from the bare
 * TEST_EMAIL_DOMAIN), otherwise a second concurrently running process would
 * have its identities deleted by the first run's cleanup (#312 review).
 */
export function runEmailDomain(run: string): string {
	if (!/^[a-z0-9][a-z0-9-]*$/.test(run)) {
		throw new Error(`[svelteforge:test-db] invalid run marker: ${JSON.stringify(run)}`);
	}
	return `${run}.${TEST_EMAIL_DOMAIN}`;
}

/** A database name counts as a test database when a `test`/`tests` segment appears. */
const TEST_DB_MARKER = /(^|[_-])tests?([_-]|[0-9]|$)/i;

/** True when the URL points at a database whose name carries a test marker. */
export function isTestDatabaseUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		const name = parsed.pathname.replace(/^\/+/, '').split('/')[0] ?? '';
		return TEST_DB_MARKER.test(name);
	} catch {
		return false;
	}
}

/** URL with credentials redacted — safe for error messages and CI logs. */
export function redactUrl(url: string): string {
	return url.replace(/\/\/([^:/@]+):[^@/]*@/, '//$1:***@');
}

/** Throws unless the URL is explicitly a test database (#312). */
export function assertTestDatabaseUrl(url: string): void {
	if (!isTestDatabaseUrl(url)) {
		throw new Error(
			`[svelteforge:test-db] refusing to run against ${redactUrl(url)}: ` +
				'integration suites only accept a database whose name contains a "test" segment ' +
				'(e.g. myapp_test). Create a dedicated database and point TEST_DATABASE_URL at it.'
		);
	}
}

/**
 * Resolves the dedicated test database URL from the environment.
 * Never reads `.env` and never falls back to DATABASE_URL (#312).
 */
export function resolveTestDbUrl(env: Record<string, string | undefined> = process.env): string {
	const url = env.TEST_DATABASE_URL?.trim();
	if (!url) {
		throw new Error(
			'[svelteforge:test-db] TEST_DATABASE_URL is not set. Integration suites refuse to ' +
				"touch the application database. Create a dedicated one (createdb myapp_test, or " +
				'docker run -e POSTGRES_DB=myapp_test postgres:17) and export ' +
				'TEST_DATABASE_URL=postgres://…/myapp_test before running the tests.'
		);
	}
	assertTestDatabaseUrl(url);
	return url;
}
