import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers';

// Pure policy cores of the audit module — no framework imports.
const retentionPath = join(ROOT, 'packages/audit/templates/src/lib/server/audit/retention');
const piiPath = join(ROOT, 'packages/audit/templates/src/lib/server/audit/pii');
const { RETENTION_ENV_VAR, parseRetentionDays, retentionCutoff } = await import(retentionPath);
const { PII_FIELDS, isPiiKey, redactMetadata, PII_MODE_ENV_VAR, resolvePiiMode } = await import(piiPath);

const AUDIT_DIR = join(ROOT, 'packages/audit/templates/src/lib/server/audit');

/**
 * Tests for #332 — audit retention, PII classification and append-only
 * integrity. The application-level API stays append-only; retention and PII
 * handling become explicit, documented, testable policies, and an optional
 * DB-level enforcement artifact ships with the module.
 */
describe('#332 — audit retention', () => {
	it('parses AUDIT_RETENTION_DAYS: absent → keep forever, invalid → keep forever, valid N → N days', () => {
		expect(RETENTION_ENV_VAR).toBe('AUDIT_RETENTION_DAYS');
		expect(parseRetentionDays(undefined)).toBeNull();
		expect(parseRetentionDays('')).toBeNull();
		expect(parseRetentionDays('abc')).toBeNull();
		expect(parseRetentionDays('-3')).toBeNull();
		expect(parseRetentionDays('0')).toBeNull(); // 0 would purge everything → treated as unset
		expect(parseRetentionDays('365')).toBe(365);
		expect(parseRetentionDays(' 90 ')).toBe(90);
	});

	it('retentionCutoff computes the purge boundary in the past', () => {
		const now = new Date('2026-02-10T12:00:00Z');
		expect(retentionCutoff('365', now)).toEqual(new Date('2025-02-10T12:00:00Z'));
		expect(retentionCutoff(undefined, now)).toBeNull(); // no retention → no cutoff
	});
});

describe('#332 — audit PII classification', () => {
	it('classifies ipAddress and userAgent as PII fields', () => {
		expect(PII_FIELDS).toEqual(['ipAddress', 'userAgent']);
	});

	it('flags PII metadata keys (email, phone, names, tokens, addresses…)', () => {
		expect(isPiiKey('userEmail')).toBe(true);
		expect(isPiiKey('contact_phone')).toBe(true);
		expect(isPiiKey('firstName')).toBe(true);
		expect(isPiiKey('authToken')).toBe(true);
		expect(isPiiKey('homeAddress')).toBe(true);
		expect(isPiiKey('reason')).toBe(false);
		expect(isPiiKey('before')).toBe(false);
		expect(isPiiKey('after')).toBe(false);
	});

	it('redactMetadata strips PII keys and reports what it removed — never mutates the input', () => {
		const metadata = { reason: 'correction', userEmail: 'a@b.c', nested: { ok: 1 }, phone: '555' };
		const { clean, redactedKeys } = redactMetadata(metadata);
		expect(clean).toEqual({ reason: 'correction', nested: { ok: 1 } });
		expect(redactedKeys.sort()).toEqual(['phone', 'userEmail']);
		// input untouched
		expect(Object.keys(metadata)).toContain('userEmail');
	});

	it('resolvePiiMode: keep is the default, redact is opt-in via AUDIT_PII_MODE', () => {
		expect(PII_MODE_ENV_VAR).toBe('AUDIT_PII_MODE');
		expect(resolvePiiMode(undefined)).toBe('keep');
		expect(resolvePiiMode('')).toBe('keep');
		expect(resolvePiiMode('whatever')).toBe('keep');
		expect(resolvePiiMode('redact')).toBe('redact');
		expect(resolvePiiMode('REDACT')).toBe('redact');
	});

	it('record() sanitizes metadata when the redact mode is on (wiring)', () => {
		const index = readFileSync(join(AUDIT_DIR, 'index.ts'), 'utf-8');
		expect(index).toMatch(/redactMetadata/);
		expect(index).toMatch(/resolvePiiMode/);
	});

	it('ships a DB-level append-only enforcement artifact (opt-in SQL)', () => {
		const sqlPath = join(AUDIT_DIR, 'append-only.sql');
		expect(existsSync(sqlPath)).toBe(true);
		const sql = readFileSync(sqlPath, 'utf-8');
		expect(sql).toMatch(/CREATE TRIGGER/i);
		expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON audit_logs/i);
		expect(sql).toMatch(/RAISE EXCEPTION/i);
		// Purging must stay possible through an explicit maintenance path.
		expect(sql).toMatch(/DISABLE TRIGGER/i);
	});

	it('purgeExpired exists as the ONLY sanctioned delete path (wiring)', () => {
		const index = readFileSync(join(AUDIT_DIR, 'index.ts'), 'utf-8');
		expect(index).toMatch(/purgeExpired/);
		expect(index).toMatch(/retentionCutoff/);
	});

	it('the README formalizes retention, PII and append-only policies', () => {
		const readme = readFileSync(join(ROOT, 'packages/audit/README.md'), 'utf-8');
		expect(readme).toMatch(/AUDIT_RETENTION_DAYS/);
		expect(readme).toMatch(/AUDIT_PII_MODE/);
		expect(readme).toMatch(/ipAddress/i);
		expect(readme).toMatch(/append-only\.sql/);
	});
});
