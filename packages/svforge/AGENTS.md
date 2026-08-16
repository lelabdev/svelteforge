# AGENTS.md — package `svforge`

Spécificiques du package principal. **Lire d'abord le [AGENTS.md racine](../../AGENTS.md)** — positionnement, gotchas prebuild, conventions, état v5.

## Templates

```
templates/base/
├── src/lib/components/svforge/ui/   ← composants de base (Button, Input, Card, …)
├── src/lib/components/layout/       ← Navbar, Footer
├── src/lib/styles/                  ← theme skeleton + tokens @theme Tailwind
└── src/routes/                      ← landing + demo-ui

templates/dashboard/                 ← overlay : base + auth + admin + DB
├── src/lib/server/                  ← auth (better-auth), db (drizzle/postgres), schemas (zod), admin.ts
├── src/routes/(app)/admin/          ← users CRUD, settings, dashboard
├── src/routes/login/ setup/         ← setup = création 1er admin (dev-only, 1er user = admin)
├── src/hooks.server.ts              ← session better-auth → locals
├── e2e/ + playwright.config.ts      ← profil playwright opt-in (⚠️ #186 : écrit dans src/)
└── vitest.config.ts                 ← ⚠️ racine du template = jamais embarqué (#186)
```

Le pattern admin : **premier utilisateur = admin** (`src/lib/server/admin.ts`, tri par `createdAt`). Multi-rôles = ajouter une colonne `role`.

## Modes (`src/modes/`)

- `base.ts` : écrit tous les fichiers de `baseFiles`
- `dashboard.ts` : deps runtime (drizzle-orm, better-auth, postgres) + devDeps (drizzle-kit, vitest, playwright si opt-in) + patch `package.json` (scripts test) + `baseFiles` puis overlay `dashboardFiles` (filtrage playwright)

L'entry `src/index.ts` : declare les deps communes (fonts, skeleton, tailwind v4, phosphor, clsx, tailwind-merge) et patche `vite.config.ts` (plugin `@tailwindcss/vite`).

## doctor / upgrade

`src/doctor.ts` (read-only, #178) et `src/upgrade.ts` (#179) sont exportés du package mais **sans CLI** — connus incomplets, voir #189 avant d'y toucher.

## Après modification d'un template

**Toujours** régénérer le manifest :

```bash
cd packages/svforge && bun run build   # prebuild (templates.ts) + tsdown
bun run test                           # tests racine
```

Puis vérifier en réel si la modif touche le scaffold : `bash scripts/test-scaffold.sh <base|dashboard>` (cf. #191 pour la réintégration CI).

## Conventions PostgreSQL (#255)

Le dashboard et tous les modules DB (`audit`, `notifications`, `jobs`, `chat`) utilisent **PostgreSQL via `drizzle-orm/pg-core`**. Conventions canoniques — à respecter pour tout nouveau module DB :

- **ids** : `uuid('id').primaryKey().defaultRandom()` pour les tables métier ; `text` pour les tables Better Auth (user/session/account/verification)
- **timestamps** : `timestamp('created_at', { withTimezone: true }).notNull().defaultNow()` — `withTimezone` partout
- **JSON** : `jsonb` pour les champs structurés (`metadata`, `payload`, `result`)
- **FK** : `.references(() => table.id, { onDelete: 'cascade' })` explicite
- **join tables** : PK composite explicite (`primaryKey({ columns: [...] })`) — PostgreSQL n'a pas de rowid implicite
- **driver** : `postgres` (postgres.js) via `drizzle-orm/postgres-js` — jamais de `@libsql/client` / `sqlite-core`
- **better-auth** : `drizzleAdapter(db, { provider: 'pg' })`
- **config** : `drizzle.config.ts` dialect `postgresql`, URL via `process.env.DATABASE_URL` (drizzle-kit charge `.env` automatiquement)
