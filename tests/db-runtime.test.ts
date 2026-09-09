import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './helpers';

// The pure policy core of the dashboard DB module — no framework imports.
const { dbConfigFor, resolveDbRuntime, SERVERLESS_CLIENT_OPTIONS } = await import(
	join(ROOT, 'packages/svforge/templates/dashboard/src/lib/server/db/config')
);

/**
 * Tests for #332 — the dashboard DB creates its PostgreSQL pool according to
 * the RUNTIME LIFECYCLE. The old template opened `postgres()` at module load
 * with no distinction between a long-lived Node process (pooling is good)
 * and serverless functions (pooling is harmful: one pool per concurrent
 * invocation exhausts the provider's connection limit).
 */
describe('#332 — DB configuration per runtime lifecycle', () => {
	it('resolveDbRuntime reads DATABASE_RUNTIME: serverless is opt-in, anything else is long-lived', () => {
		expect(resolveDbRuntime('serverless')).toBe('serverless');
		expect(resolveDbRuntime('SERVERLESS')).toBe('serverless');
		expect(resolveDbRuntime(undefined)).toBe('long-lived');
		expect(resolveDbRuntime('')).toBe('long-lived');
		expect(resolveDbRuntime('long-lived')).toBe('long-lived');
		// A typo must not silently select serverless (or vice versa).
		expect(resolveDbRuntime('serveless')).toBe('long-lived');
	});

	it('serverless runtime: a single short-lived connection with prepared statements OFF', () => {
		const config = dbConfigFor('serverless');
		expect(config.runtime).toBe('serverless');
		// Every concurrent invocation gets at most ONE connection.
		expect(config.clientOptions.max).toBe(1);
		// Connections are recycled aggressively instead of kept warm.
		expect(config.clientOptions.idle_timeout).toBeGreaterThan(0);
		expect(config.clientOptions.connect_timeout).toBeGreaterThan(0);
		expect(config.clientOptions.lifetime).toBeGreaterThan(0);
		// Transaction-mode poolers (PgBouncer/Supabase/Neon) reject prepared statements.
		expect(config.clientOptions.prepare).toBe(false);
	});

	it('long-lived runtime: driver defaults (a real pool, no artificial caps)', () => {
		const config = dbConfigFor('long-lived');
		expect(config.runtime).toBe('long-lived');
		expect(config.clientOptions.max).toBeUndefined();
		expect(config.clientOptions.prepare).toBeUndefined();
		expect(config.clientOptions.idle_timeout).toBeUndefined();
	});

	it('the serverless options are exported as one documented constant', () => {
		expect(SERVERLESS_CLIENT_OPTIONS).toEqual(dbConfigFor('serverless').clientOptions);
	});

	it('db/index.ts wires a createDb factory + a LAZY shared db (no pool at module load)', () => {
		const index = readFileSync(
			join(ROOT, 'packages/svforge/templates/dashboard/src/lib/server/db/index.ts'),
			'utf-8'
		);
		// Factory: the application can build its own client with explicit options.
		expect(index).toMatch(/export function createDb/);
		// The module-load throw is gone: no top-level `if (!env.DATABASE_URL) throw`.
		expect(index).not.toMatch(/if \(!env\.DATABASE_URL\) throw/);
		// The shared instance initializes lazily (Proxy), never at import time.
		expect(index).toMatch(/new Proxy/);
		expect(index).toMatch(/export const db: Db = new Proxy/);
		// The default runtime comes from DATABASE_RUNTIME via resolveDbRuntime.
		expect(index).toMatch(/resolveDbRuntime/);
		expect(index).toMatch(/DATABASE_RUNTIME/);
		// Modules keep importing { db } from '$lib/server/db' — unchanged public surface.
		expect(index).toMatch(/export const db/);
	});
});
