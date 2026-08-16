# @svforge/audit

Business action audit trail for SvelteForge **dashboard** projects — who did
what, on which entity, when, with what context. Append-only at the application
level.

## Install

```bash
npx sv add @svforge/audit
```

Requires the **dashboard** template (auth + Drizzle). The audit schema is
auto-registered in `src/lib/server/db/schema.ts`.

## Record

```ts
import { audit } from '$lib/server/audit';

await audit.record({
	actorId: user.id, // null → system action
	action: 'punch.corrected',
	entityType: 'punch',
	entityId: punch.id,
	metadata: {
		before: { time: oldTime },
		after: { time: newTime },
		reason
	},
	ipAddress: event.getClientAddress(),
	userAgent: event.request.headers.get('user-agent')
});
```

## Read

```ts
await audit.forEntity('punch', punchId);       // full history, newest first
await audit.byActor(userId, { limit: 50 });    // actions by one actor
await audit.list({ action: 'punch.corrected', entityType: 'punch', limit: 50, offset: 0 });
```

## Admin view

`/admin/audit` — filter by action/entity, paginated, admin-only (same guard as
the other admin pages).

## Model

```ts
{ id, actorId?, action, entityType, entityId?, metadata?, ipAddress?, userAgent?, createdAt }
```

## 🔒 Confidentiality — what must NEVER go in `metadata`

- passwords, tokens, session secrets
- full object dumps containing sensitive data
- PII beyond what the feature genuinely needs
- card numbers / billing details

The audit log is a business trail, not a technical log and not an event-sourcing
store. No update/delete is exposed by the API — the table stays append-only at
the application level.

## What's included

- `$lib/server/audit/schema.ts` — Drizzle schema (`audit_logs`)
- `$lib/server/audit/index.ts` — `audit.record` / `forEntity` / `byActor` / `list`
- `src/routes/(app)/admin/audit/` — paginated admin view (FR/EN via Paraglide)

## License

MIT
