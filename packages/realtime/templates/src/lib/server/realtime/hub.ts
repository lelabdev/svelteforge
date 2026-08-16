import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { IncomingMessage } from 'node:http';

/**
 * SvelteForge realtime transport (#229) — generic WebSocket hub.
 *
 * The business layer never depends on the WS implementation: it publishes and
 * subscribes through this stable API. Channels are isolated by an authorize
 * callback so a user cannot subscribe to a scope they may not read.
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
	/** Authorize a subscription: return false to refuse a channel. */
	authorize?: (userId: string | undefined, channel: string) => boolean | Promise<boolean>;
	/** Optional heartbeat interval (ms). */
	heartbeatMs?: number;
}

type SocketEntry = { ws: WebSocket; client: RealtimeClient };

/**
 * The realtime hub. Instantiate once in `$lib/server/realtime/hub.ts`.
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
		this.sockets.set(ws, { ws, client });

		ws.on('message', (data) => {
			try {
				const msg = JSON.parse(data.toString());
				if (msg.type === 'subscribe' && typeof msg.channel === 'string') {
					this.subscribe(ws, client, msg.channel);
				} else if (msg.type === 'unsubscribe' && typeof msg.channel === 'string') {
					client.channels.delete(msg.channel);
				}
			} catch {
				// ignore malformed frames
			}
		});

		ws.on('close', () => this.sockets.delete(ws));
		ws.on('error', () => this.sockets.delete(ws));
	}

	private async subscribe(ws: WebSocket, client: RealtimeClient, channel: string): Promise<void> {
		const authorized = this.options.authorize
			? await this.options.authorize(client.userId, channel)
			: true;
		if (!authorized) {
			ws.send(JSON.stringify({ type: 'error', channel, event: 'unauthorized' }));
			return;
		}
		client.channels.add(channel);
		ws.send(JSON.stringify({ type: 'subscribed', channel }));
	}

	/** Publish an event to all sockets subscribed to the channel. */
	publish<T>(channel: string, event: string, payload: T): void {
		const msg = JSON.stringify({ type: 'event', channel, event, payload } satisfies {
			type: 'event';
		} & RealtimeEvent<T>);
		for (const { ws, client } of this.sockets.values()) {
			if (client.channels.has(channel)) {
				ws.send(msg);
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
