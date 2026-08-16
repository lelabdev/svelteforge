# @svforge/realtime

Generic WebSocket transport for SvelteForge projects — publish/subscribe with
authenticated, channel-isolated connections. No business logic.

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

Start the WS server on its own port (e.g. in `hooks.server.ts` init):

```ts
import { realtime } from '$lib/server/realtime';

// in +layout.server.ts or a server bootstrap:
if (import.meta.env.PROD) realtime.listen(3001);
```

Configure authentication + channel authorization:

```ts
// $lib/server/realtime/index.ts
realtime.authorize = async (userId, channel) => {
	// only members of an organization may subscribe to its channel
	if (channel.startsWith('organization:')) {
		const orgId = channel.split(':')[1];
		return await userBelongsToOrg(userId, orgId);
	}
	return true;
};
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

## What's included

- `$lib/server/realtime/hub.ts` — `RealtimeHub` (publish, subscribe, isolation, heartbeat-ready)
- `$lib/server/realtime/index.ts` — shared `realtime` instance
- `$lib/realtime/client.ts` — Svelte client (auto-reconnect with backoff, typed envelopes)

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
- Heartbeats: the client auto-reconnects with backoff; server-side auth is the
  `authorize` callback you provide.
- WSS (TLS) behind a reverse proxy is your wiring responsibility (option A).

## License

MIT
