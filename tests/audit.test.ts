import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers';

/**
 * Tests for #232 — audit module. Append-only business audit trail:
 * record + query helpers + admin view, no update/delete exposed.
 */
describe('audit module (#232)', () => {
	const auditDir = join(ROOT, 'packages/audit/templates/src/lib/server/audit');
	const routeDir = join(ROOT, 'packages/audit/templates/src/routes/(app)/admin/audit');

	it('ships schema + API + admin view', () => {
		expect(existsSync(join(auditDir, 'schema.ts'))).toBe(true);
		expect(existsSync(join(auditDir, 'index.ts'))).toBe(true);
		expect(existsSync(join(routeDir, '+page.server.ts'))).toBe(true);
		expect(existsSync(join(routeDir, '+page.svelte'))).toBe(true);
	});

	it('schema is append-only (no update/delete in API)', () => {
		const api = readFileSync(join(auditDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/async record/);
		expect(api).toMatch(/forEntity/);
		expect(api).toMatch(/byActor/);
		expect(api).toMatch(/async list/);
		// No mutation/update/delete exposed
		expect(api).not.toMatch(/\.update\(/);
		expect(api).not.toMatch(/\.delete\(/);
		expect(api).not.toMatch(/updateAudit|deleteAudit/);
	});

	it('record stores the full model (actorId nullable, metadata, createdAt)', () => {
		const api = readFileSync(join(auditDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/actorId/);
		expect(api).toMatch(/entityType/);
		expect(api).toMatch(/entityId/);
		expect(api).toMatch(/metadata/);
		expect(api).toMatch(/new Date\(\)/);
		const schema = readFileSync(join(auditDir, 'schema.ts'), 'utf-8');
		expect(schema).toMatch(/actorId/);
		expect(schema).toMatch(/audit_logs/);
	});

	it('list supports filters + pagination (limit/offset, newest first)', () => {
		const api = readFileSync(join(auditDir, 'index.ts'), 'utf-8');
		expect(api).toMatch(/limit/);
		expect(api).toMatch(/offset/);
		expect(api).toMatch(/orderBy\(desc/);
		expect(api).toMatch(/action/);
		expect(api).toMatch(/entityType/);
	});

	it('admin view guards access + paginates', () => {
		const page = readFileSync(join(routeDir, '+page.server.ts'), 'utf-8');
		expect(page).toMatch(/requireAdmin/);
		expect(page).toMatch(/401|Authentication required/);
		expect(page).toMatch(/403|Admin access required/);
		expect(page).toMatch(/limit/);
		expect(page).toMatch(/offset/);
		// Never unbounded (#297): limit is clamped to the explicit 1..100 range
		// via the pure parsePagination helper (Math.min alone let -10 through).
		expect(page).toMatch(/parsePagination/);
		expect(page).toMatch(/from '\$lib\/server\/audit\/pagination'/);
	});

	it('module requires dashboard (DB) and enriches context/messages', () => {
		const index = readFileSync(join(ROOT, 'packages/audit/src/index.ts'), 'utf-8');
		expect(index).toMatch(/template:dashboard/);
		expect(index).toMatch(/enrichManifest/);
		expect(index).toMatch(/sv\.file\('\.svforge\.json'/);
		expect(index).toMatch(/mergeMessages/);
		expect(index).toMatch(/audit_title/);
	});

	it('registers the audit schema in the Drizzle barrel', () => {
		const index = readFileSync(join(ROOT, 'packages/audit/src/index.ts'), 'utf-8');
		expect(index).toMatch(/schema\.ts/);
		expect(index).toMatch(/auditLogs/);
	});

	it('documents confidentiality (what must never go in metadata)', () => {
		const readme = readFileSync(join(ROOT, 'packages/audit/README.md'), 'utf-8');
		expect(readme).toMatch(/passwords|tokens|secrets/);
		expect(readme).toMatch(/append-only/);
	});
});
