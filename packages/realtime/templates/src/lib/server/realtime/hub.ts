import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { IncomingMessage } from 'node:http';

/**
 * SvelteForge realtime transport (#229) — generic WebSocket hub.
 *
 * The business layer never depends on the WS implementation: it publishes and
 * subscribes through this stable API. Channels are isolated by an authorize
 * callback so a user cannot subscribe to a scope they may not read.
 *
 * Secure by default (#264): without an `authorize` callback every subscription
 * is refused (deny-all). Open channels explicitly, e.g. `authorize: () => true`
 * for development or a per-channel rule in production.
 */

export interface RealtimeEvent<T = unknown> {
	channel: string;
	event: string;
	payload: T;
}

export interface RealtimeClient {
	userId?: string;
	channels: Set<string>;
}

export interface RealtimeServerOptions {
	/** Extract the authenticated user id from the upgrade request. */
	authenticate?: (req: IncomingMessage) => Promise<string | null | undefined> | string | null | undefined;
	/**
	 * Authorize a subscription: return false to refuse a channel.
	 * Defaults to deny-all when not provided (#264) — a hub never accepts a
	 * channel it was not explicitly told to accept.
	 */
	authorize?: (userId: string | undefined, channel: string) => boolean | Promise<boolean>;
	/** Max inbound frame size in bytes (default 64 KiB). A larger frame closes the socket with 1009 (#332). */
	maxFrameBytes?: number;
	/** Max channels one client may be subscribed to (default 32) (#332). */
	maxChannelsPerClient?: number;
	/** Max inbound frames per client per second (default 60). Over-limit frames are dropped with an error frame (#332). */
	maxFramesPerSecond?: number;
	/** Max concurrent pending (async) authorizations per client (default 8) (#332). */
	maxPendingAuthorizations?: number;
	/** Max time (ms) an async authorize may take (default 5000). On timeout the subscription is refused (#332). */
	authorizeTimeoutMs?: number;
}

/** Secure defaults for the runtime limits (#332). Always ON — an endpoint exposed to the internet needs hard bounds. */
const LIMIT_DEFAULTS = {
	maxFrameBytes: 64 * 1024,
	maxChannelsPerClient: 32,
	maxFramesPerSecond: 60,
	maxPendingAuthorizations: 8,
	authorizeTimeoutMs: 5000
};

interface HubLimits {
	maxFrameBytes: number;
	maxChannelsPerClient: number;
	maxFramesPerSecond: number;
	maxPendingAuthorizations: number;
	authorizeTimeoutMs: number;
}

type SocketEntry = { ws: WebSocket; client: RealtimeClient; limits: HubLimits; rate: { windowStart: number; count: number }; pending: Set<string> };

/**
 * The realtime hub. Instantiate once in `$lib/server/realtime/index.ts` —
 * prefer the `createRealtimeHub` factory below.
 */
export class RealtimeHub {
	private wss: WebSocketServer | null = null;
	private sockets = new Map<WebSocket, SocketEntry>();
	private options: RealtimeServerOptions;

	constructor(options: RealtimeServerOptions = {}) {
		this.options = options;
	}

	/** Attach the WS server to an HTTP server (e.g. adapter-node customServer). */
	attach(server: Server): void {
		this.wss = new WebSocketServer({ server, path: '/api/realtime' });
		this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
	}

	/** Start a standalone WS server on its own port (portable, no adapter hook). */
	listen(port: number, host = '0.0.0.0'): Promise<void> {
		return new Promise((resolve) => {
			this.wss = new WebSocketServer({ port, host, path: '/api/realtime' });
			this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
			this.wss.on('listening', () => resolve());
		});
	}

	private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
		const userId = this.options.authenticate ? ((await this.options.authenticate(req)) ?? undefined) : undefined;
		const client: RealtimeClient = { userId, channels: new Set() };
		const entry: SocketEntry = {
			ws,
			client,
			limits: {
				maxFrameBytes: this.options.maxFrameBytes ?? LIMIT_DEFAULTS.maxFrameBytes,
				maxChannelsPerClient: this.options.maxChannelsPerClient ?? LIMIT_DEFAULTS.maxChannelsPerClient,
				maxFramesPerSecond: this.options.maxFramesPerSecond ?? LIMIT_DEFAULTS.maxFramesPerSecond,
				maxPendingAuthorizations: this.options.maxPendingAuthorizations ?? LIMIT_DEFAULTS.maxPendingAuthorizations,
				authorizeTimeoutMs: this.options.authorizeTimeoutMs ?? LIMIT_DEFAULTS.authorizeTimeoutMs
			},
			rate: { windowStart: Date.now(), count: 0 },
			pending: new Set()
		};
		this.sockets.set(ws, entry);

		ws.on('message', (data) => this.handleFrame(entry, data));
		ws.on('close', () => this.sockets.delete(ws));
		ws.on('error', () => this.sockets.delete(ws));
	}

	/** Send a control frame, tolerating a socket that is already closing. */
	private send(entry: SocketEntry, payload: Record<string, unknown>): void {
		try {
			if (entry.ws.readyState === entry.ws.OPEN) entry.ws.send(JSON.stringify(payload));
		} catch {
			// never let a control frame kill the hub loop
		}
	}

	/** One inbound frame: size limit → rate limit → parse → dispatch (#332). */
	private handleFrame(entry: SocketEntry, data: unknown): void {
		const { ws, client, limits, rate, pending } = entry;

		// Frame-size limit: an oversized frame is abuse — close with 1009
		// (Message Too Big) instead of buffering it.
		if (data instanceof ArrayBuffer || ArrayBuffer.isView(data) || Array.isArray(data)) {
			const size = data instanceof ArrayBuffer ? data.byteLength : ArrayBuffer.isView(data) ? data.byteLength : data[0]?.byteLength ?? 0;
			if (size > limits.maxFrameBytes) {
				ws.close(1009, 'frame too large');
				return;
			}
		}

		// Per-client inbound rate limit (1-second sliding window): drop the
		// frame with an error frame, keep the connection.
		const now = Date.now();
		if (now - rate.windowStart >= 1000) {
			rate.windowStart = now;
			rate.count = 0;
		}
		rate.count++;
		if (rate.count > limits.maxFramesPerSecond) {
			this.send(entry, { type: 'error', error: 'rate-limited' });
			return;
		}

		let msg: { type?: unknown; channel?: unknown };
		try {
			msg = JSON.parse(String(data));
		} catch {
			return; // ignore malformed frames
		}
		if (typeof msg.channel !== 'string') return;
		const channel = msg.channel;

		if (msg.type === 'subscribe') {
			if (client.channels.has(channel)) {
				// Idempotent: re-acknowledge instead of double-subscribing.
				this.send(entry, { type: 'subscribed', channel });
				return;
			}
			if (pending.has(channel)) return; // an authorization is already in flight for this channel
			if (client.channels.size >= limits.maxChannelsPerClient) {
				this.send(entry, { type: 'error', channel, error: 'channel-limit' });
				return;
			}
			if (pending.size >= limits.maxPendingAuthorizations) {
				this.send(entry, { type: 'error', channel, error: 'too-many-pending' });
				return;
			}
			pending.add(channel);
			void this.subscribe(entry, channel);
			return;
		}
		if (msg.type === 'unsubscribe' && client.channels.has(channel)) {
			client.channels.delete(channel);
		}
	}

	private async subscribe(entry: SocketEntry, channel: string): Promise<void> {
		const { ws, client, pending, limits } = entry;
		try {
			const authorize = this.options.authorize ?? (() => false);
			let authorized = false;
			try {
				// Timeout bound on the async authorization: a hanging callback
				// must not hold the subscription forever (#332).
				authorized = await Promise.race([
					Promise.resolve(authorize(client.userId, channel)).then((v) => v === true),
					new Promise<false>((resolve) => {
						const timer = setTimeout(() => resolve(false), limits.authorizeTimeoutMs);
						if (typeof timer.unref === 'function') timer.unref();
					})
				]);
			} catch {
				authorized = false; // a throwing authorize refuses, never crashes
			}
			// Socket closed mid-authorization: the result is discarded — no send,
			// no state change (the close handler already removed the entry).
			if (ws.readyState !== ws.OPEN) return;
			if (!authorized) {
				this.send(entry, { type: 'error', channel, error: 'unauthorized' });
				return;
			}
			// Re-check the channel cap: racing subscribes can all pass the
			// pre-authorization check while their authorizations are pending.
			if (!client.channels.has(channel) && client.channels.size >= limits.maxChannelsPerClient) {
				this.send(entry, { type: 'error', channel, error: 'channel-limit' });
				return;
			}
			client.channels.add(channel);
			this.send(entry, { type: 'subscribed', channel });
		} finally {
			pending.delete(channel);
		}
	}

	/**
	 * Publish an event to all sockets subscribed to the channel (#264): the
	 * single canonical contract is the object form, identical to the envelope
	 * the client receives.
	 *
	 *   await realtime.publish({ channel: `org:${orgId}`, event: 'punch.created', payload: { punchId } });
	 */
	publish<T>(event: RealtimeEvent<T>): void {
		const msg = JSON.stringify({ type: 'event', ...event });
		for (const { ws, client } of this.sockets.values()) {
			if (!client.channels.has(event.channel)) continue;
			try {
				ws.send(msg);
			} catch {
				// a closing socket must never break a publish — cleanup happens
				// on the close event
			}
		}
	}

	/** Number of connected sockets. */
	get connectionCount(): number {
		return this.sockets.size;
	}

	close(): void {
		for (const { ws } of this.sockets.values()) ws.close();
		this.sockets.clear();
		this.wss?.close();
	}
}

/**
 * Factory for the shared hub (#264) — configure auth at creation time instead
 * of mutating a read-only-looking instance:
 *
 *   export const realtime = createRealtimeHub({
 *     authenticate: async (req) => req.headers['x-user-id'] as string | undefined,
 *     authorize: (userId, channel) => userId != null && channel === `org:${userId}`
 *   });
 */
export function createRealtimeHub(options: RealtimeServerOptions = {}): RealtimeHub {
	return new RealtimeHub(options);
}
