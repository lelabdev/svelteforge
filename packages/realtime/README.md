# @svforge/realtime

Generic WebSocket transport for SvelteForge projects — publish/subscribe with
authenticated, channel-isolated connections. No business logic, no dependency
on Better Auth or any auth library.

## Install

```bash
npx sv add @svforge/realtime
```

## Architecture

Business code never depends on the WS implementation:

```text
service métier → realtime.publish({ channel, event, payload })
     ↓
WebSocket hub (channels isolés par authorize)
     ↓
client Svelte → rt.subscribe(channel, event, handler)
```

## Server — publish

```ts
import { realtime } from '$lib/server/realtime';

await realtime.publish({
	channel: `organization:${orgId}`,
	event: 'punch.created',
	payload: { punchId }
});
```

`publish` takes a single object `{ channel, event, payload }` — the same
envelope shape clients receive. There is no positional form.

## Server — configuration (auth)

The shared instance is created in `$lib/server/realtime/index.ts`. Configure
`authenticate` + `authorize` there at creation time:

```ts
// $lib/server/realtime/index.ts
import { createRealtimeHub } from './hub';

export const realtime = createRealtimeHub({
	// Example: read the user id from a header set by your session layer.
	// Works standalone — swap it for your real auth (e.g. Better Auth session).
	authenticate: async (req) => {
		const header = req.headers['x-user-id'];
		return typeof header === 'string' ? header : undefined;
	},
	// Example: members may join their own organization channel, everyone may
	// join public channels.
	authorize: (userId, channel) =>
		userId != null && (channel === `org:${userId}` || channel.startsWith('public:'))
});

export type { RealtimeEvent, RealtimeServerOptions } from './hub';
```

### Secure by default

Without an `authorize` callback, **every subscription is refused** (deny-all)
and the client receives `{ type: 'error', error: 'unauthorized' }`. A hub
never accepts a channel it was not explicitly told to accept. For a local
prototype, open channels explicitly:

```ts
export const realtime = createRealtimeHub({ authorize: () => true });
```

The `RealtimeHub` constructor accepts the same options
(`new RealtimeHub({ authenticate, authorize })`) — the factory is the
recommended entry point for the shared instance.

## Server — wiring

The hub needs an HTTP server. Two options:

### Option A — adapter-node (customServer)

In `svelte.config.js` / `vite.config.ts` build, attach the hub:

```ts
import { realtime } from '$lib/server/realtime';
// inside your custom server bootstrap:
realtime.attach(server);
```

### Option B — standalone port (portable)

Start the WS server on its own port (e.g. in a server bootstrap):

```ts
import { realtime } from '$lib/server/realtime';

// in +layout.server.ts or a server bootstrap:
if (import.meta.env.PROD) realtime.listen(3001);
```

## Client — subscribe

```svelte
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createRealtimeClient } from '$lib/realtime/client';
	import { invalidate } from '$app/navigation';

	const rt = createRealtimeClient('/api/realtime');
	const unsub = rt.subscribe('organization:1', 'punch.created', (payload) => {
		console.log(payload.punchId);
		invalidate('app:punches'); // refetch rather than ship the source of truth
	});
	onDestroy(() => { unsub(); rt.close(); });
</script>
```

`subscribe` returns an unsubscribe function that removes **this** handler.
When the last handler of a channel disappears, the client stops tracking the
channel, tells the server to `unsubscribe`, and never resubscribes it after a
reconnect. `rt.unsubscribe(channel)` removes every handler of a channel and
unsubscribes it. Only channels that still have handlers are resubscribed after
a reconnection.

## What's included

- `$lib/server/realtime/hub.ts` — `RealtimeHub` + `createRealtimeHub` (publish, subscribe, isolation)
- `$lib/server/realtime/index.ts` — shared `realtime` instance (configure auth here)
- `$lib/realtime/client.ts` — Svelte client (auto-reconnect with backoff, typed envelopes, ref-counted channels)

## Envelope

```ts
type RealtimeEvent<T = unknown> = { channel: string; event: string; payload: T };
```

## Dependencies

- `ws` — WebSocket server
- `@types/ws` (dev)

## Limits (v1)

- Single hub per process — no horizontal scaling of connections in v1 (one
  instance / dev server). Channels give isolation, not multi-process fan-out.
- No message persistence — realtime is transport only; durable state belongs to
  the business modules (notifications, chat, jobs…).
- No server-side heartbeat in v1 — the client auto-reconnects with backoff.
- WSS (TLS) behind a reverse proxy is your wiring responsibility (option A).

## License

MIT
