import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

/**
 * UUID id contract (#265). Since #255 every DB module PK is
 * `uuid('id').primaryKey().defaultRandom()` — the canonical id type is
 * `string` in services, components and routes. This guard fails if any
 * API/component of the DB modules exposes an id as `number` again.
 */

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full));
		else if (full.endsWith('.ts') || full.endsWith('.svelte')) out.push(full);
	}
	return out;
}

const MODULE_TEMPLATES = [
	'packages/audit/templates',
	'packages/notifications/templates',
	'packages/jobs/templates',
	'packages/chat/templates'
];

// id-bearing parameters that must stay `string` (uuid), plus the UI item ids
const ID_CONTRACT_PATTERNS = [
	/jobId: number/g,
	/notificationId: number/g,
	/conversationId: number/g,
	/messageId: number/g,
	/entityId: number/g,
	/actorId: number/g,
	/id: number;/g,
	/Number\(params\./g,
	/Number\(url\.searchParams\.get\('id'\)\)/g
];

describe('UUID id contracts are string, never number (#265)', () => {
	for (const root of MODULE_TEMPLATES) {
		it(`${root} exposes no numeric id`, () => {
			const issues: string[] = [];
			for (const file of walk(join(ROOT, root))) {
				const src = readFileSync(file, 'utf-8');
				for (const re of ID_CONTRACT_PATTERNS) {
					for (const m of src.matchAll(re)) {
						issues.push(`${file}: ${m[0]}`);
					}
				}
			}
			expect(issues).toEqual([]);
		});
	}

	it('chat routes pass string ids (no Number(params))', () => {
		const route = readFileSync(
			join(ROOT, 'packages/chat/templates/src/routes/chat/[id]/+page.server.ts'),
			'utf-8'
		);
		expect(route).toMatch(/const conversationId = params\.id/);
		expect(route).not.toMatch(/Number\(params/);
	});
});
