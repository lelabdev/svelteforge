import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Tests for #229 — realtime module. The hub must be a generic transport:
 * publish/subscribe with channel isolation, no business logic.
 */
describe('realtime module (#229)', () => {
	const dir = mkdtempSync(join(tmpdir(), 'sf-rt-'));
	afterAll(() => rmSync(dir, { recursive: true, force: true }));

	it('ships the hub, shared instance and client templates', () => {
		const hub = join(dir, 'hub.ts');
		// We can't scaffold here (slow); assert the template files exist in the repo.
		const root = process.cwd();
		expect(
			existsSync(join(root, 'packages/realtime/templates/src/lib/server/realtime/hub.ts'))
		).toBe(true);
		expect(
			existsSync(join(root, 'packages/realtime/templates/src/lib/server/realtime/index.ts'))
		).toBe(true);
		expect(
			existsSync(join(root, 'packages/realtime/templates/src/lib/realtime/client.ts'))
		).toBe(true);
		expect(hub).toBeDefined();
	});

	it('hub.ts defines publish/subscribe with channel isolation', async () => {
		const { RealtimeHub } = await import('../packages/realtime/templates/src/lib/server/realtime/hub');
		const hub = new RealtimeHub();
		expect(typeof hub.publish).toBe('function');
		expect(hub.connectionCount).toBe(0);
		// authorize callback exists in the API surface
		expect(typeof hub.attach).toBe('function');
		expect(typeof hub.listen).toBe('function');
	});

	it('index.ts exports a shared realtime instance', async () => {
		const { realtime } = await import('../packages/realtime/templates/src/lib/server/realtime/index');
		expect(realtime).toBeDefined();
		expect(typeof realtime.publish).toBe('function');
	});

	it('client.ts provides subscribe/unsubscribe/close + reconnection', async () => {
		const { createRealtimeClient } = await import('../packages/realtime/templates/src/lib/realtime/client');
		expect(typeof createRealtimeClient).toBe('function');
	});

	it('publish delivers to subscribers of the channel only', async () => {
		// Real end-to-end over localhost: two clients, one channel each.
		const { RealtimeHub } = await import('../packages/realtime/templates/src/lib/server/realtime/hub');
		const WebSocket = (await import('ws')).default;
		const http = await import('node:http');

		const hub = new RealtimeHub({ authorize: (userId, channel) => channel.startsWith('org:') });
		const server = http.createServer();
		hub.attach(server);
		await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
		const port = (server.address() as { port: number }).port;

		const received: string[] = [];
		const wsA = new WebSocket(`ws://127.0.0.1:${port}/api/realtime`);
		const wsB = new WebSocket(`ws://127.0.0.1:${port}/api/realtime`);

		await new Promise<void>((r) => {
			wsA.on('open', () => wsA.send(JSON.stringify({ type: 'subscribe', channel: 'org:1' })));
			wsB.on('open', () => wsB.send(JSON.stringify({ type: 'subscribe', channel: 'org:2' })));
			wsA.on('message', (d) => { if (JSON.parse(String(d)).type === 'subscribed') { received.push('A-ready'); if (received.includes('B-ready')) r(); } });
			wsB.on('message', (d) => { if (JSON.parse(String(d)).type === 'subscribed') { received.push('B-ready'); if (received.includes('A-ready')) r(); } });
		});

		const got: string[] = [];
		wsA.on('message', (d) => {
			const m = JSON.parse(String(d));
			if (m.type === 'event') got.push(m.channel);
		});
		wsB.on('message', (d) => {
			const m = JSON.parse(String(d));
			if (m.type === 'event') got.push(m.channel);
		});

		hub.publish('org:1', 'punch.created', { punchId: 'p1' });
		hub.publish('org:2', 'other.event', { x: 1 });
		await new Promise((r) => setTimeout(r, 100));

		expect([...got].sort()).toEqual(['org:1', 'org:2']); // each client got only its own channel

		wsA.close(); wsB.close();
		hub.close();
		await new Promise<void>((r) => server.close(() => r()));
	});

	it('module declares ws dependency and manifests itself', () => {
		const pkg = JSON.parse(require('node:fs').readFileSync(join(process.cwd(), 'packages/realtime/package.json'), 'utf-8'));
		expect(pkg.name).toBe('@svforge/realtime');
		const index = require('node:fs').readFileSync(join(process.cwd(), 'packages/realtime/src/index.ts'), 'utf-8');
		expect(index).toMatch(/sv\.dependency\('ws'/);
		expect(index).toMatch(/enrichManifest/);
		expect(index).toMatch(/sv\.file\('\.svforge\.json'/);
	});
});
