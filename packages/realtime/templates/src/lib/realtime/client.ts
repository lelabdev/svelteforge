/**
 * SvelteForge realtime client (#229) — reusable Svelte-side WebSocket client
 * with automatic reconnection (backoff) and typed event envelopes.
 *
 *   const rt = createRealtimeClient('/api/realtime');
 *   const unsub = rt.subscribe('organization:1', 'punch.created', (payload) => {
 *     invalidate('app:punches');
 *   });
 */

export interface RealtimeEvent<T = unknown> {
	channel: string;
	event: string;
	payload: T;
}

interface ClientOptions {
	/** Reconnect delay base in ms (exponential backoff). */
	backoffMs?: number;
	/** Maximum backoff in ms. */
	maxBackoffMs?: number;
	/** Auto-resubscribe to channels after reconnect. */
	resubscribe?: boolean;
}

export function createRealtimeClient(url: string, options: ClientOptions = {}) {
	const { backoffMs = 1000, maxBackoffMs = 30000, resubscribe = true } = options;
	let ws: WebSocket | null = null;
	let attempt = 0;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let closed = false;

	const handlers = new Map<string, Set<(payload: unknown, event: string) => void>>();
	const channels = new Set<string>();

	function connect() {
		if (closed) return;
		ws = new WebSocket(url);
		ws.onopen = () => {
			attempt = 0;
			if (resubscribe) {
				for (const channel of channels) ws?.send(JSON.stringify({ type: 'subscribe', channel }));
			}
		};
		ws.onmessage = (e) => {
			try {
				const msg = JSON.parse(String(e.data));
				if (msg.type !== 'event' || !msg.channel || !msg.event) return;
				const key = `${msg.channel}:${msg.event}`;
				const set = handlers.get(key);
				if (set) for (const fn of set) fn(msg.payload, msg.event);
			} catch {
				// ignore malformed frames
			}
		};
		ws.onclose = () => {
			if (closed) return;
			attempt++;
			const delay = Math.min(backoffMs * 2 ** (attempt - 1), maxBackoffMs);
			reconnectTimer = setTimeout(connect, delay);
		};
		ws.onerror = () => ws?.close();
	}

	/**
	 * Subscribe to (channel, event). Returns an unsubscribe function.
	 */
	function subscribe<T = unknown>(channel: string, event: string, handler: (payload: T, event: string) => void): () => void {
		const key = `${channel}:${event}`;
		if (!handlers.has(key)) handlers.set(key, new Set());
		handlers.get(key)!.add(handler as (payload: unknown, event: string) => void);
		channels.add(channel);
		ws?.send(JSON.stringify({ type: 'subscribe', channel }));
		return () => {
			handlers.get(key)?.delete(handler as (payload: unknown, event: string) => void);
		};
	}

	function unsubscribe(channel: string): void {
		channels.delete(channel);
		ws?.send(JSON.stringify({ type: 'unsubscribe', channel }));
	}

	function close(): void {
		closed = true;
		if (reconnectTimer) clearTimeout(reconnectTimer);
		ws?.close();
		handlers.clear();
		channels.clear();
	}

	connect();

	return { subscribe, unsubscribe, close };
}
