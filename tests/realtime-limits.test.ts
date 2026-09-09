import { describe, it, expect } from 'vitest';
import { createServer } from 'node:http';
import { WebSocket as WsWebSocket } from 'ws';
import { RealtimeHub } from '../packages/realtime/templates/src/lib/server/realtime/hub';

/**
 * Tests for #332 — realtime limits. A WS endpoint exposed to the internet
 * needs hard bounds: frame size, channels per client, inbound frame rate,
 * and defined behavior while an ASYNC authorization is pending (dedupe,
 * cap, timeout, disconnect mid-flight). Each limit is opt-out-able via the
 * hub options but always ON by default.
 */

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

async function startHub(hub: RealtimeHub) {
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

/** Open a raw client connection and collect its parsed inbound frames. */
async function connect(port: number) {
	const frames: Array<Record<string, unknown>> = [];
	const ws = new WsWebSocket(`ws://127.0.0.1:${port}/api/realtime`);
	let closeCode: number | undefined;
	ws.on('message', (d) => frames.push(JSON.parse(String(d))));
	ws.on('close', (code) => {
		closeCode = code;
	});
	await new Promise<void>((r) => ws.on('open', () => r()));
	const sent = () => frames.some((f) => f.type === 'subscribed');
	return {
		ws,
		frames,
		sent,
		getCloseCode: () => closeCode,
		closed: () => closeCode !== undefined
	};
}

describe('#332 — realtime hub limits', () => {
	it('closes the socket with 1009 when an inbound frame exceeds maxFrameBytes', async () => {
		const hub = new RealtimeHub({ authorize: () => true, maxFrameBytes: 32 });
		const { port, cleanup } = await startHub(hub);
		const client = await connect(port);

		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'x'.repeat(64) }));
		await waitFor(() => client.closed());
		expect(client.getCloseCode()).toBe(1009);

		client.ws.close();
		await cleanup();
	});

	it('refuses subscriptions beyond maxChannelsPerClient with a channel-limit error', async () => {
		const hub = new RealtimeHub({ authorize: () => true, maxChannelsPerClient: 2 });
		const { port, cleanup } = await startHub(hub);
		const client = await connect(port);

		for (const channel of ['a', 'b', 'c']) {
			client.ws.send(JSON.stringify({ type: 'subscribe', channel }));
		}
		await waitFor(() => client.frames.some((f) => f.error === 'channel-limit'));
		expect(client.sent()).toBe(true);
		// a and b are subscribed; c never is.
		expect(client.frames.some((f) => f.type === 'subscribed' && f.channel === 'c')).toBe(false);

		hub.publish({ channel: 'c', event: 'e', payload: {} });
		hub.publish({ channel: 'a', event: 'e', payload: {} });
		await delay(100);
		const events = client.frames.filter((f) => f.type === 'event');
		expect(events).toHaveLength(1);
		expect((events[0] as { channel: string }).channel).toBe('a');

		client.ws.close();
		await cleanup();
	});

	it('drops frames over maxFramesPerSecond with a rate-limited error, without closing the socket', async () => {
		const hub = new RealtimeHub({ authorize: () => true, maxFramesPerSecond: 3 });
		const { port, cleanup } = await startHub(hub);
		const client = await connect(port);

		// 12 subscribe frames in a tight loop — only the first 3 are processed.
		for (let i = 0; i < 12; i++) {
			client.ws.send(JSON.stringify({ type: 'subscribe', channel: `ch${i}` }));
		}
		await waitFor(() => client.frames.some((f) => f.error === 'rate-limited'));
		expect(client.closed()).toBe(false);
		// Only 3 subscriptions went through before the limit.
		expect(client.frames.filter((f) => f.type === 'subscribed')).toHaveLength(3);

		// The connection stays usable after the window resets.
		await delay(1100);
		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'later' }));
		await waitFor(() => client.frames.some((f) => f.type === 'subscribed' && f.channel === 'later'));

		client.ws.close();
		await cleanup();
	});

	it('deduplicates concurrent subscribes to the SAME channel while async authorization is pending', async () => {
		let authorizeCalls = 0;
		const hub = new RealtimeHub({
			authorize: () => {
				authorizeCalls++;
				return delay(80).then(() => true);
			}
		});
		const { port, cleanup } = await startHub(hub);
		const client = await connect(port);

		// Same channel twice while the first authorize is still pending.
		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'org:1' }));
		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'org:1' }));
		await waitFor(() => client.frames.some((f) => f.type === 'subscribed'));
		await delay(80); // let any duplicate resolution land
		expect(authorizeCalls).toBe(1); // pending dedupe: one authorization call
		const acks = client.frames.filter((f) => f.type === 'subscribed');
		expect(acks).toHaveLength(1); // exactly one ack, no double-add

		client.ws.close();
		await cleanup();
	});

	it('discards the authorization result when the socket closes mid-authorization (no crash, no send)', async () => {
		let resolveAuthorize: ((v: boolean) => void) | undefined;
		const hub = new RealtimeHub({
			authorize: () => new Promise<boolean>((resolve) => (resolveAuthorize = resolve))
		});
		const { port, cleanup } = await startHub(hub);
		const client = await connect(port);

		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'org:1' }));
		await delay(50); // authorize now pending
		client.ws.close();
		await waitFor(() => hub.connectionCount === 0);

		// Resolving AFTER the disconnect must be a silent no-op.
		expect(() => resolveAuthorize?.(true)).not.toThrow();
		await delay(80);
		expect(hub.connectionCount).toBe(0);

		await cleanup();
	});

	it('caps concurrent pending authorizations (maxPendingAuthorizations) with an error frame', async () => {
		const hub = new RealtimeHub({
			authorize: () => delay(200).then(() => true),
			maxPendingAuthorizations: 2
		});
		const { port, cleanup } = await startHub(hub);
		const client = await connect(port);

		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'a' }));
		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'b' }));
		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'c' }));
		await waitFor(() => client.frames.some((f) => f.error === 'too-many-pending'));
		expect(client.frames.some((f) => f.error === 'too-many-pending' && f.channel === 'c')).toBe(true);

		client.ws.close();
		await cleanup();
	});

	it('refuses the subscription when async authorization exceeds authorizeTimeoutMs', async () => {
		const hub = new RealtimeHub({
			authorize: () => new Promise<boolean>(() => {}), // never resolves
			authorizeTimeoutMs: 60
		});
		const { port, cleanup } = await startHub(hub);
		const client = await connect(port);

		client.ws.send(JSON.stringify({ type: 'subscribe', channel: 'org:1' }));
		await waitFor(() => client.frames.some((f) => f.error === 'unauthorized'));
		expect(client.frames.some((f) => f.type === 'subscribed')).toBe(false);

		client.ws.close();
		await cleanup();
	});
});
