/**
 * SvelteForge realtime client (#229) — reusable Svelte-side WebSocket client
 * with automatic reconnection (backoff) and typed event envelopes.
 *
 *   const rt = createRealtimeClient('/api/realtime');
 *   const unsub = rt.subscribe('organization:1', 'punch.created', (payload) => {
 *     invalidate('app:punches');
 *   });
 *   onDestroy(() => unsub()); // and/or rt.close()
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

type Handler = (payload: unknown, event: string) => void;

export function createRealtimeClient(url: string, options: ClientOptions = {}) {
	const { backoffMs = 1000, maxBackoffMs = 30000, resubscribe = true } = options;
	let ws: WebSocket | null = null;
	let attempt = 0;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let closed = false;

	const handlers = new Map<string, Set<Handler>>();
	/** Channels with at least one handler — the only ones resubscribed on reconnect. */
	const channelRefs = new Map<string, number>();

	function sendSubscribe(channel: string): void {
		// Only send on an open socket: the native WebSocket throws while
		// CONNECTING, and subscriptions registered before open are replayed
		// from onopen (resubscribe loop).
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: 'subscribe', channel }));
		}
	}

	function sendUnsubscribe(channel: string): void {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
		}
	}

	function connect() {
		if (closed) return;
		ws = new WebSocket(url);
		ws.onopen = () => {
			attempt = 0;
			if (resubscribe) {
				// Only channels that still have handlers (#264): a channel whose
				// last handler was removed is never resubscribed.
				for (const channel of channelRefs.keys()) sendSubscribe(channel);
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
	 * Subscribe to (channel, event). Returns an unsubscribe function that
	 * removes this handler; when the channel's last handler disappears the
	 * client stops tracking it and tells the server to unsubscribe (#264).
	 */
	function subscribe<T = unknown>(channel: string, event: string, handler: (payload: T, event: string) => void): () => void {
		const key = `${channel}:${event}`;
		if (!handlers.has(key)) handlers.set(key, new Set());
		handlers.get(key)!.add(handler as Handler);
		const refs = channelRefs.get(channel) ?? 0;
		channelRefs.set(channel, refs + 1);
		if (refs === 0) sendSubscribe(channel);
		return () => {
			const set = handlers.get(key);
			if (!set?.delete(handler as Handler)) return;
			if (set.size === 0) handlers.delete(key);
			const remaining = (channelRefs.get(channel) ?? 1) - 1;
			if (remaining <= 0) {
				channelRefs.delete(channel);
				sendUnsubscribe(channel);
			} else {
				channelRefs.set(channel, remaining);
			}
		};
	}

	/** Remove every handler of a channel and unsubscribe it from the server. */
	function unsubscribe(channel: string): void {
		channelRefs.delete(channel);
		for (const [key, set] of handlers) {
			if (key.startsWith(`${channel}:`)) handlers.delete(key);
		}
		sendUnsubscribe(channel);
	}

	function close(): void {
		closed = true;
		if (reconnectTimer) clearTimeout(reconnectTimer);
		ws?.close();
		handlers.clear();
		channelRefs.clear();
	}

	connect();

	return { subscribe, unsubscribe, close };
}
