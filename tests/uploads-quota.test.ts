import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers';

// Pure quota policy of the uploads module — no framework imports.
const { parseUserQuotaBytes, quotaExceededMessage, USER_QUOTA_ENV_VAR } = await import(
	join(ROOT, 'packages/uploads/templates/src/lib/uploads/quota')
);

/**
 * Tests for #332 — uploads size enforcement.
 *
 * The presigned POST policy enforces the size of ONE request at storage
 * level; a presigned PUT does not (ContentLength is signed but not enforced
 * by the storage). When size must be truly enforced, the module documents
 * the POST policy, a per-user quota gate, and a storage-side scan callback.
 */
describe('#332 — uploads per-user quota', () => {
	it('parses S3_USER_QUOTA_BYTES: absent/invalid means no quota, never an accident', () => {
		expect(USER_QUOTA_ENV_VAR).toBe('S3_USER_QUOTA_BYTES');
		expect(parseUserQuotaBytes(undefined)).toBeNull();
		expect(parseUserQuotaBytes('')).toBeNull();
		expect(parseUserQuotaBytes('   ')).toBeNull();
		expect(parseUserQuotaBytes('abc')).toBeNull(); // invalid → no quota, loudly documented, never NaN
		expect(parseUserQuotaBytes('-5')).toBeNull(); // negative → ignored
		expect(parseUserQuotaBytes('10.5')).toBeNull(); // fractional bytes → ignored
		expect(parseUserQuotaBytes('0')).toBeNull(); // 0 would block everything → treated as unset
		expect(parseUserQuotaBytes('1048576')).toBe(1048576);
	});

	it('computes a readable 413 message only when the declared size exceeds the quota', () => {
		expect(quotaExceededMessage(1048576, 1048577)).toMatch(/quota/);
		expect(quotaExceededMessage(1048576, 1048576)).toBeNull(); // at-limit is allowed
		expect(quotaExceededMessage(1048576, 1048575)).toBeNull();
	});

	it('the endpoint gates the per-user quota BEFORE signing and documents the fallback', () => {
		const endpoint = readFileSync(join(ROOT, 'packages/uploads/templates/src/routes/api/upload/+server.ts'), 'utf-8');
		// Quota gate wired with the shared policy helpers.
		expect(endpoint).toMatch(/parseUserQuotaBytes/);
		expect(endpoint).toMatch(/quotaExceededMessage/);
		expect(endpoint).toMatch(/USER_QUOTA_ENV_VAR/);
		// The gate runs on every path (both POST and PUT branches return after it).
		const gateIndex = endpoint.indexOf('quotaExceededMessage');
		const postIndex = endpoint.indexOf("method: 'POST'");
		const putIndex = endpoint.indexOf("method: 'PUT'");
		expect(gateIndex).toBeGreaterThan(-1);
		expect(gateIndex).toBeLessThan(postIndex);
		expect(gateIndex).toBeLessThan(putIndex);
	});

	it('the README documents POST policy, per-user quota, and scan callback', () => {
		const readme = readFileSync(join(ROOT, 'packages/uploads/README.md'), 'utf-8');
		expect(readme).toMatch(/POST policy|presigned POST/i);
		expect(readme).toMatch(/S3_USER_QUOTA_BYTES/);
		expect(readme).toMatch(/per-user/i);
		// The scan callback pattern is documented with concrete mechanics.
		expect(readme).toMatch(/scan/i);
		expect(readme).toMatch(/quarantine/i);
		// The PUT fallback is still explicitly best-effort.
		expect(readme).toMatch(/best-effort/i);
	});
});
