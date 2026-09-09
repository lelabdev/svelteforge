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

## Deployment profiles & adapter compatibility (#332)

Realtime requires a runtime that can hold a WebSocket server open. Check the
profile BEFORE choosing a host — the capability is declared in `.svforge.json`
(`deployment.profile`) and enforced as a warning by `npx svforge doctor`.

| Profile | Realtime | How |
|---|---|---|
| `node-long-lived` (default) | ✅ in-process | `realtime.attach(server)` on an adapter-node custom server, behind a reverse proxy that forwards the `Upgrade` header |
| `separate-worker` | ✅ on the worker only | run `realtime.listen(PORT)` on a dedicated long-lived Node/WS deployment (the **separate-WS-server option**); web replicas never touch WebSockets |
| `serverless` | ❌ | function instances are killed after each request — no WS server survives; use the separate-worker profile |
| `edge` | ❌ | no WebSocket server and no Node net stack |

Precisely, by SvelteKit adapter:

- **adapter-node** — compatible (option A): boot an HTTP server yourself and
  `attach()` the hub, or use option B on a second deployment.
- **adapter-auto / adapter-vercel (functions)** — NOT compatible: functions
  cannot hold WS connections. Deploy the hub as a separate WS server (option B
  on a VPS/container) and point the client at its URL.
- **adapter-cloudflare / edge runtimes** — NOT compatible: `ws` needs Node's
  net stack (Durable Objects are the platform-native alternative, outside
  SVForge scope).
- **adapter-static** — no server at all; same separate-WS-server option.

### The separate-WS-server option (profile `separate-worker`)

1. Deploy the SAME codebase twice: web (serverless) + WS worker (long-lived
   Node container running `realtime.listen(PORT)`).
2. Point the client at the worker: `createRealtimeClient('wss://ws.example.dev/api/realtime')`.
3. Publish from the web app. v1 keeps a single hub per process — the web app
   cannot `publish()` into another process's memory. Bridge the two
   deployments with a shared backend (e.g. Postgres `LISTEN/NOTIFY` polled by
   the worker, or HTTP calls from the app to a small publish endpoint on the
   worker) — wire it in `$lib/server/realtime/index.ts`.

## Runtime limits (#332)

Always ON — an internet-exposed endpoint needs hard bounds. All are tunable
via `createRealtimeHub({ ... })`:

| Option | Default | Behavior when exceeded |
|---|---|---|
| `maxFrameBytes` | 64 KiB | socket closed with `1009` (message too big) |
| `maxChannelsPerClient` | 32 | `{ type: 'error', channel, error: 'channel-limit' }`, channel not joined |
| `maxFramesPerSecond` | 60 | frame dropped, `{ type: 'error', error: 'rate-limited' }`, connection kept |
| `maxPendingAuthorizations` | 8 | `{ type: 'error', channel, error: 'too-many-pending' }` |
| `authorizeTimeoutMs` | 5000 | authorization unresolved → subscription refused (`unauthorized`) |

### Asynchronous authorization — defined behavior

`authorize` may be async. While a subscription is pending:

- a **duplicate subscribe for the same channel is ignored** (one authorization
  call, one ack — no double-add);
- pending authorizations count toward `maxPendingAuthorizations`;
- the channel cap is **re-checked after** authorization resolves (racing
  subscribes cannot exceed `maxChannelsPerClient`);
- if the socket **closes mid-authorization**, the result is discarded: no
  send, no state change, no crash;
- a **throwing** authorize refuses the subscription (`unauthorized`) and never
  crashes the hub.

## Limits (v1)

- Single hub per process — no horizontal scaling of connections in v1 (one
  instance / dev server). Channels give isolation, not multi-process fan-out.
- No message persistence — realtime is transport only; durable state belongs to
  the business modules (notifications, chat, jobs…).
- No server-side heartbeat in v1 — the client auto-reconnects with backoff.
- WSS (TLS) behind a reverse proxy is your wiring responsibility (option A).

## License

MIT
