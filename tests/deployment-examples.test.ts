import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
	DEPLOYMENT_PROFILES,
	DEPLOYMENT_PROFILE_INFO,
	MODULE_PROFILES
} from '../packages/addon-kit/src/index';
import { ROOT } from './helpers';

/**
 * Tests for #332 — minimal deployment examples. Each profile has ONE
 * validated example in docs/deploy/. The examples must stay in sync with the
 * contract: they may only reference env vars the templates actually read,
 * must document the right module compatibility (derived from the matrix),
 * and the serverless example must set the serverless DB runtime.
 */
describe('#332 — deployment examples are validated', () => {
	const deployDir = join(ROOT, 'docs/deploy');

	it('has one example per profile, named after it', () => {
		const files = readdirSync(deployDir).filter((f) => f.endsWith('.md'));
		expect(files.sort()).toEqual([...DEPLOYMENT_PROFILES].map((p) => `${p}.md`).sort());
	});

	const read = (profile: string) => readFileSync(join(deployDir, `${profile}.md`), 'utf-8');

	it('examples only reference environment variables the templates actually read', () => {
		const knownEnvVars = new Set([
			'DATABASE_URL', // dashboard db/index.ts
			'DATABASE_RUNTIME', // dashboard db/config.ts via index.ts
			'JOBS_WORKER', // jobs module hooks guard
			'BETTER_AUTH_SECRET', // dashboard auth
			'ORIGIN', // better-auth
			'RESEND_API_KEY', // email
			'S3_ENDPOINT', // uploads
			'S3_BUCKET',
			'S3_REGION',
			'S3_ACCESS_KEY_ID',
			'S3_SECRET_ACCESS_KEY',
			'S3_UPLOAD_SIZE_POLICY',
			'S3_USER_QUOTA_BYTES',
			'REALTIME_PORT' // documented realtime listen() port for the worker
		]);
		for (const profile of DEPLOYMENT_PROFILES) {
			const content = read(profile);
			const declared = [...content.matchAll(/^[A-Z][A-Z0-9_]+=/gm)].map((m) => m[0].replace(/=$/, ''));
			for (const name of declared) {
				expect(knownEnvVars.has(name), `${profile}.md references unknown env var ${name}`).toBe(true);
			}
		}
	});

	it('the node-long-lived example keeps the long-lived defaults', () => {
		const content = read('node-long-lived');
		// No serverless DB runtime override — the default pool is the point.
		expect(content).toMatch(/DATABASE_RUNTIME is UNSET|DATABASE_RUNTIME.*unset/i);
		expect(content).not.toMatch(/^DATABASE_RUNTIME="?serverless/m);
		// Documents that the runtime modules work in-process.
		expect(content).toMatch(/jobs/);
		expect(content).toMatch(/realtime/);
		expect(content).toMatch(/node-long-lived/);
	});

	it('the serverless example sets DATABASE_RUNTIME=serverless and matches the module matrix', () => {
		const content = read('serverless');
		expect(content).toMatch(/^DATABASE_RUNTIME="?serverless"?/m);
		// The example's compatibility list must match MODULE_PROFILES exactly:
		// unsupported → flagged with ❌, supported → mentioned by id.
		const lines = content.split('\n');
		for (const [id, entry] of Object.entries(MODULE_PROFILES)) {
			const unsupportedHere = entry.unsupported.includes('serverless');
			const flaggedUnsupported = lines.some((l) => l.includes('❌') && l.includes(`\`${id}\``));
			if (unsupportedHere) {
				expect(flaggedUnsupported, `serverless.md must flag ${id} as unsupported`).toBe(true);
			} else if (entry.supported.includes('serverless')) {
				expect(content, `serverless.md must mention ${id} as supported`).toContain(`\`${id}\``);
			}
		}
		// Points at the escape hatch.
		expect(content).toMatch(/separate-worker/);
	});

	it('the separate-worker example documents the JOBS_WORKER split and the WS-server option', () => {
		const content = read('separate-worker');
		expect(content).toMatch(/^JOBS_WORKER="?web"?/m);
		expect(content).toMatch(/^JOBS_WORKER="?worker"?/m);
		expect(content).toMatch(/realtime\.listen/i);
		expect(content).toMatch(/exactly one worker|Scale = 1|one worker/i);
	});

	it('every example names its profile exactly as the contract spells it', () => {
		for (const profile of DEPLOYMENT_PROFILES) {
			const content = read(profile);
			expect(content).toContain(profile);
			// The profile title from the registry appears so docs and code share vocabulary.
			expect(content).toContain(DEPLOYMENT_PROFILE_INFO[profile].title.split(' + ')[0].trim());
		}
	});
});
