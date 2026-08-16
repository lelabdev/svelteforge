import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket as WsWebSocket } from 'ws';

const root = process.cwd();
const hubPath = '../packages/realtime/templates/src/lib/server/realtime/hub';
const clientPath = '../packages/realtime/templates/src/lib/realtime/client';

function delay(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(fn: () => boolean, timeout = 3000): Promise<void> {
	const start = Date.now();
	while (!fn()) {
		if (Date.now() - start > timeout) throw new Error('waitFor timeout');
		await delay(20);
	}
}

function listen(server: ReturnType<typeof createServer>): Promise<number> {
	return new Promise((r) => server.listen(0, '127.0.0.1', () => r((server.address() as { port: number }).port)));
}

/** Start a bare WebSocketServer on an ephemeral port (mock peer for client tests). */
async function startWss() {
	const wss = new WebSocketServer({ port: 0, host: '127.0.0.1' });
	await new Promise<void>((r) => wss.on('listening', () => r()));
	return { wss, port: (wss.address() as { port: number }).port };
}

/** Start a real hub attached to an ephemeral HTTP server. Returns cleanup. */
async function startHub(hub: { attach: (s: ReturnType<typeof createServer>) => void; close: () => void }) {
	const server = createServer();
	hub.attach(server);
	const port = await listen(server);
	return {
		port,
		cleanup: async () => {
			hub.close();
			await new Promise<void>((r) => server.close(() => r()));
		}
	};
}

/**
 * Tests for #229 + #264 — realtime module. The hub must be a generic,
 * secure-by-default transport: object `publish` contract, explicit auth
 * configuration, ref-counted client subscriptions, strict resubscribe.
 */
describe('realtime module (#229/#264)', () => {
	const dir = mkdtempSync(join(tmpdir(), 'sf-rt-'));
	afterAll(() => rmSync(dir, { recursive: true, force: true }));

	it('ships the hub, shared instance and client templates', () => {
		expect(existsSync(join(root, 'packages/realtime/templates/src/lib/server/realtime/hub.ts'))).toBe(true);
		expect(existsSync(join(root, 'packages/realtime/templates/src/lib/server/realtime/index.ts'))).toBe(true);
		expect(existsSync(join(root, 'packages/realtime/templates/src/lib/realtime/client.ts'))).toBe(true);
		expect(dir).toBeDefined();
	});

	it('hub.ts exposes the object publish contract and the factory', async () => {
		const { RealtimeHub, createRealtimeHub } = await import(hubPath);
		const hub = new RealtimeHub();
		expect(typeof hub.publish).toBe('function');
		expect(hub.connectionCount).toBe(0);
		expect(typeof hub.attach).toBe('function');
		expect(typeof hub.listen).toBe('function');
		// #264: factory is the documented entry point for the shared instance.
		expect(typeof createRealtimeHub).toBe('function');
		expect(createRealtimeHub()).toBeInstanceOf(RealtimeHub);
	});

	it('index.ts exports a shared realtime instance', async () => {
		const { realtime } = await import('../packages/realtime/templates/src/lib/server/realtime/index');
		expect(realtime).toBeDefined();
		expect(typeof realtime.publish).toBe('function');
	});

	it('client.ts provides subscribe/unsubscribe/close + reconnection', async () => {
		const { createRealtimeClient } = await import(clientPath);
		expect(typeof createRealtimeClient).toBe('function');
	});

	it('README example for createRealtimeHub runs as-is (compilable config)', async () => {
		// Exactly the configuration shown in the module README — no Better Auth.
		const { createRealtimeHub, RealtimeHub } = await import(hubPath);
		const hub = createRealtimeHub({
			authenticate: async (req) => {
				const header = req.headers['x-user-id'];
				return typeof header === 'string' ? header : undefined;
			},
			authorize: (userId, channel) =>
				userId != null && (channel === `org:${userId}` || channel.startsWith('public:'))
		});
		expect(hub).toBeInstanceOf(RealtimeHub);
		expect(hub.connectionCount).toBe(0);
	});

	it('README is aligned with the real API: object publish, factory, no fake authorize property', () => {
		const readme = readFileSync(join(root, 'packages/realtime/README.md'), 'utf-8');
		expect(readme).toContain('publish({');
		expect(readme).toContain('createRealtimeHub');
		expect(readme).not.toMatch(/realtime\.authorize\s*=/);
		expect(readme).toContain('deny-all');
		expect(readme).toMatch(/Secure by default/);
	});

	it('module stays independent of Better Auth and business logic', () => {
		const files = [
			join(root, 'packages/realtime/templates/src/lib/server/realtime/hub.ts'),
			join(root, 'packages/realtime/templates/src/lib/server/realtime/index.ts'),
			join(root, 'packages/realtime/templates/src/lib/realtime/client.ts'),
			join(root, 'packages/realtime/README.md')
		];
		for (const f of files) {
			expect(readFileSync(f, 'utf-8'), f).not.toMatch(/better-auth|betterAuth/);
		}
	});

	it('publish delivers to subscribers of the channel only (object contract)', async () => {
		const { RealtimeHub } = await import(hubPath);
		const hub = new RealtimeHub({ authorize: (userId, channel) => channel.startsWith('org:') });
		const { port, cleanup } = await startHub(hub);

		const received: string[] = [];
		const wsA = new WsWebSocket(`ws://127.0.0.1:${port}/api/realtime`);
		const wsB = new WsWebSocket(`ws://127.0.0.1:${port}/api/realtime`);

		await new Promise<void>((r) => {
			wsA.on('open', () => wsA.send(JSON.stringify({ type: 'subscribe', channel: 'org:1' })));
			wsB.on('open', () => wsB.send(JSON.stringify({ type: 'subscribe', channel: 'org:2' })));
			wsA.on('message', (d) => { if (JSON.parse(String(d)).type === 'subscribed') { received.push('A-ready'); if (received.includes('B-ready')) r(); } });
			wsB.on('message', (d) => { if (JSON.parse(String(d)).type === 'subscribed') { received.push('B-ready'); if (received.includes('A-ready')) r(); } });
		});

		const got: string[] = [];
		const collect = (d: unknown) => { const m = JSON.parse(String(d)); if (m.type === 'event') got.push(m.channel); };
		wsA.on('message', collect);
		wsB.on('message', collect);

		// #264: canonical contract is the object form.
		hub.publish({ channel: 'org:1', event: 'punch.created', payload: { punchId: 'p1' } });
		hub.publish({ channel: 'org:2', event: 'other.event', payload: { x: 1 } });
		await delay(100);

		expect([...got].sort()).toEqual(['org:1', 'org:2']); // each client got only its own channel

		wsA.close(); wsB.close();
		await cleanup();
	});

	it('deny-by-default: without authorize every subscription is refused and gets no event', async () => {
		const { RealtimeHub } = await import(hubPath);
		const hub = new RealtimeHub(); // no authorize callback at all (#264)
		const { port, cleanup } = await startHub(hub);

		const frames: Array<Record<string, unknown>> = [];
		const ws = new WsWebSocket(`ws://127.0.0.1:${port}/api/realtime`);
		ws.on('message', (d) => frames.push(JSON.parse(String(d))));
		await new Promise<void>((r) => ws.on('open', () => r()));
		ws.send(JSON.stringify({ type: 'subscribe', channel: 'org:1' }));

		await waitFor(() => frames.some((f) => f.type === 'error' && f.error === 'unauthorized'));
		expect(frames.some((f) => f.type === 'subscribed')).toBe(false);

		hub.publish({ channel: 'org:1', event: 'e', payload: { x: 1 } });
		await delay(100);
		expect(frames.filter((f) => f.type === 'event')).toHaveLength(0);

		ws.close();
		await cleanup();
	});

	it('a refused channel never receives events even when authorize is partial', async () => {
		const { RealtimeHub } = await import(hubPath);
		const hub = new RealtimeHub({ authorize: (userId, channel) => channel === 'org:1' });
		const { port, cleanup } = await startHub(hub);

		const frames: Array<Record<string, unknown>> = [];
		const ws = new WsWebSocket(`ws://127.0.0.1:${port}/api/realtime`);
		ws.on('message', (d) => frames.push(JSON.parse(String(d))));
		await new Promise<void>((r) => ws.on('open', () => r()));
		ws.send(JSON.stringify({ type: 'subscribe', channel: 'org:1' }));
		await waitFor(() => frames.some((f) => f.type === 'subscribed' && f.channel === 'org:1'));

		// Refused channel: unauthorized + no delivery.
		ws.send(JSON.stringify({ type: 'subscribe', channel: 'org:2' }));
		await waitFor(() => frames.some((f) => f.type === 'error' && f.error === 'unauthorized' && f.channel === 'org:2'));

		hub.publish({ channel: 'org:1', event: 'ok', payload: { n: 1 } });
		hub.publish({ channel: 'org:2', event: 'nope', payload: { n: 2 } });
		await delay(100);
		const events = frames.filter((f) => f.type === 'event');
		expect(events).toHaveLength(1);
		expect(events[0].channel).toBe('org:1'); // refused channel never delivered

		ws.close();
		await cleanup();
	});

	it('client ref-counts a shared channel and sends unsubscribe when the last handler leaves', async () => {
		const { wss, port } = await startWss();
		const received: Array<{ type: string; channel?: string }> = [];
		wss.on('connection', (ws) => {
			ws.on('message', (d) => received.push(JSON.parse(String(d))));
		});

		const { createRealtimeClient } = await import(clientPath);
		const client = createRealtimeClient(`ws://127.0.0.1:${port}/api/realtime`, { backoffMs: 10, maxBackoffMs: 30 });
		const unsub1 = client.subscribe('c', 'e', () => {});
		const unsub2 = client.subscribe('c', 'e2', () => {});

		// One subscribe for the channel despite two handlers.
		await waitFor(() => received.filter((m) => m.type === 'subscribe' && m.channel === 'c').length === 1);
		expect(received.filter((m) => m.type === 'subscribe').length).toBe(1);

		unsub1();
		await delay(60);
		// Another handler remains on 'c' → no unsubscribe yet.
		expect(received.filter((m) => m.type === 'unsubscribe')).toHaveLength(0);

		unsub2();
		await waitFor(() => received.some((m) => m.type === 'unsubscribe' && m.channel === 'c'));

		client.close();
		wss.close();
	});

	it('unsubscribe returned by subscribe() actually unsubscribes: no delivery after last handler gone', async () => {
		const { RealtimeHub } = await import(hubPath);
		const { createRealtimeClient } = await import(clientPath);
		const hub = new RealtimeHub({ authorize: () => true });
		const { port, cleanup } = await startHub(hub);

		const got: unknown[] = [];
		const client = createRealtimeClient(`ws://127.0.0.1:${port}/api/realtime`, { backoffMs: 10, maxBackoffMs: 30 });
		const unsub = client.subscribe('c', 'e', (p) => got.push(p));
		await delay(120); // connect + subscribe round-trip

		hub.publish({ channel: 'c', event: 'e', payload: { n: 1 } });
		await waitFor(() => got.length === 1);

		unsub(); // last handler gone → server told to unsubscribe
		await delay(80);
		hub.publish({ channel: 'c', event: 'e', payload: { n: 2 } });
		await delay(100);

		expect(got).toEqual([{ n: 1 }]); // nothing after unsubscribe

		client.close();
		await cleanup();
	});

	it('after reconnect, a channel whose handler was removed is not resubscribed', async () => {
		const { wss, port } = await startWss();
		const received: Array<{ type: string; channel?: string }> = [];
		let conns = 0;
		wss.on('connection', (ws) => {
			conns++;
			ws.on('message', (d) => received.push(JSON.parse(String(d))));
		});

		const { createRealtimeClient } = await import(clientPath);
		const client = createRealtimeClient(`ws://127.0.0.1:${port}/api/realtime`, { backoffMs: 10, maxBackoffMs: 30 });
		client.subscribe('keep', 'e', () => {});
		const unsubDrop = client.subscribe('drop', 'e', () => {});

		await waitFor(() => received.filter((m) => m.type === 'subscribe').length === 2);
		unsubDrop();
		await waitFor(() => received.some((m) => m.type === 'unsubscribe' && m.channel === 'drop'));

		// Server-side disconnect → the client reconnects and resubscribes only
		// channels that still have handlers.
		for (const c of wss.clients) c.close();
		await waitFor(() => conns >= 2);
		await delay(200);

		const dropSubs = received.filter((m) => m.type === 'subscribe' && m.channel === 'drop').length;
		const keepSubs = received.filter((m) => m.type === 'subscribe' && m.channel === 'keep').length;
		expect(dropSubs).toBe(1); // never resubscribed (#264)
		expect(keepSubs).toBeGreaterThanOrEqual(2); // still-active channel resubscribed

		client.close();
		wss.close();
	});

	it('module declares ws dependency and manifests itself', () => {
		const pkg = JSON.parse(readFileSync(join(root, 'packages/realtime/package.json'), 'utf-8'));
		expect(pkg.name).toBe('@svforge/realtime');
		const index = readFileSync(join(root, 'packages/realtime/src/index.ts'), 'utf-8');
		expect(index).toMatch(/sv\.dependency\('ws'/);
		expect(index).toMatch(/enrichManifest/);
		expect(index).toMatch(/sv\.file\('\.svforge\.json'/);
	});
});
