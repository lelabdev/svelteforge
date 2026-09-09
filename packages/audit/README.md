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

## Retention (#332)

Default: **keep forever**. The only sanctioned delete path is
`audit.purgeExpired()`:

```ts
import { audit } from '$lib/server/audit';

// Period from AUDIT_RETENTION_DAYS (no-op when unset):
await audit.purgeExpired();
// Explicit period (days):
await audit.purgeExpired({ days: 365 });
```

Run it from a scheduled job (e.g. the jobs module) or a cron hitting an
admin-only endpoint. With `append-only.sql` applied (below), purging requires
the documented maintenance window — plan the two together.

## PII classification & redaction (#332)

Two columns are personal data under GDPR — collect them only when the feature
genuinely needs them:

- `ipAddress`, `userAgent`

Free-form `metadata` is where PII leaks in practice. Set
`AUDIT_PII_MODE=redact` to make `audit.record()` strip PII-classified keys
(email, phone, names, addresses, tokens, card/IBAN…) before insert and null
the PII columns. The classification lives in `$lib/server/audit/pii.ts` —
adjust the patterns to your jurisdiction, keep the contract. Default mode is
`keep` (collect as provided).

## Append-only integrity (#332)

The application API has no update/delete path — but nothing stops another
database client. For a DB-level guarantee, apply the shipped trigger once per
environment:

```bash
psql "$DATABASE_URL" -f src/lib/server/audit/append-only.sql
```

Every `UPDATE`/`DELETE` on `audit_logs` then fails at the database level.
Purges run through the explicit maintenance window documented in the same
file (disable trigger → purge → re-enable).

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

## Limits (v1)

- Retention is opt-in (`AUDIT_RETENTION_DAYS` / `purgeExpired`); without it
  the log grows forever.
- `metadata` is a JSONB free-form map: keep it small and non-sensitive (see
  the PII policy above). Redaction is key-pattern-based, not content-aware —
  deeply nested PII inside a non-flagged key is not detected.
- List endpoint is a simple page-based read; no search/indexing in v1.

## License

MIT
