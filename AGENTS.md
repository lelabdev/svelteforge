# AGENTS.md — SvelteForge

Guide pour agents travaillant sur ce repo. **Positionnement d'abord** : tout le reste en découle.

## Positionnement (source de vérité)

SvelteForge est un **boilerplate de démarrage**, PAS une bibliothèque de composants et PAS un clone de shadcn/ui.

- Le template `base` fournit **uniquement les bases** : boutons, inputs, selects, cards, badges, table + l'infra (theme, SEO, layouts, dark mode).
- Pour tout composant plus riche (accordion, tabs, avatar, tooltip, dialog…), on **n'écrit pas** de composant svforge — on utilise directement les composants officiels de `@skeletonlabs/skeleton-svelte`.
- Les modules sont **composables et opt-in** : l'utilisateur choisit 2-3 modules selon ses besoins.
- Le vrai cœur du métier : **vitesse de démarrage**. Un `sv create` + `sv add` = projet production-ready.

Conséquence : avant d'ajouter quoi que ce soit au base, se demander « est-ce une base ? » (→ issue #199 pour le trim en cours).

## Architecture

Monorepo Bun workspaces. Modèle shadcn : **les sources sont copiées** dans le projet cible via `sv add`, pas importées depuis node_modules.

```
packages/
├── svforge/              ← addon principal — 2 templates
│   ├── templates/base/       ← UI kit de base + infra (skeleton, theme, seo)
│   ├── templates/dashboard/  ← overlay : base + Better Auth + Drizzle + admin
│   ├── src/index.ts          ← defineAddon(), deps scaffoldées, patch vite.config.ts
│   ├── src/modes/            ← base.ts / dashboard.ts : écrit les fichiers via sv.file()
│   ├── src/templates.ts      ← AUTO-GÉNÉRÉ par prebuild — NE JAMAIS ÉDITER À LA MAIN
│   ├── src/doctor.ts         ← diagnostics read-only (#178)
│   ├── src/upgrade.ts        ← upgrade explicite des modules (#179, partiel : #189)
│   └── scripts/prebuild.ts   ← embarque templates/*/src/** en strings dans templates.ts
├── ui_toast/ dnd/ tiptap/ graph/ email/ oauth/ uploads/ blog/  ← 8 modules indépendants
│   └── (même structure : templates/src/** + src/templates.ts auto-généré + scripts/prebuild.ts)
├── scripts/prebuild-utils.ts   ← readDirRecursively (tri déterministe) — partagé
├── scripts/test-scaffold.sh    ← scaffold réel : sv create + sv add + build (utilisé par #191)
├── tests/                      ← vitest racine (bun run test)
└── docs/ (dans packages/svforge) — dumps llms-*.txt (Skeleton v5, Svelte 5) — régénérer via `bash packages/svforge/scripts/fetch-llms-docs.sh` (fraîcheur vérifiée par `tests/llms-docs-freshness.test.ts`)
```

### ⚠️ LE gotcha du repo : le prebuild n'embarque que `src/**`

`prebuild.ts` fait `readDirRecursively(templates/{base,dashboard}/src)`. **Tout fichier posé ailleurs dans le template (racine, `static/`, `scripts/`) n'est jamais livré au scaffold** — silencieusement. Deux règles :

1. Un template file doit vivre sous `templates/*/src/**`.
2. Après TOUTE modification d'un fichier de `templates/`, relancer le prebuild du package (`bun run prebuild` ou `bun run build`) pour régénérer `src/templates.ts` — sinon le scaffold livre l'ancienne version embarquée.

## Workflow

```bash
bun install
bun run build          # build svforge (prebuild + tsdown)
bun run build:all      # build tous les packages
bun run test           # vitest racine (tests/)

# Tester un template localement (sans npm) :
cd packages/svforge && bun run build && bun scripts/test-local.ts base /tmp/sf-test
cd /tmp/sf-test && bun install && bun dev

# Scaffold complet réel (le test de vérité) :
bash scripts/test-scaffold.sh base      # ou dashboard
```

**TDD obligatoire** (voir CONTRIBUTING.md) : Red (test qui échoue pour la bonne raison) → Green → Refactor. Les tests "existence-only" (grep du source) ne comptent pas comme couverture — écrire des tests comportementaux (appel de fonction, fichier généré réel). Cf. #101, #191.

## Testing profiles du template dashboard (#180/#181)

- Défaut : **Vitest** (baseline auth + admin, `bun run test` dans le projet scaffoldé)
- Opt-in : **Playwright** (`test:e2e`), syntaxe : `svforge=template:dashboard+testing:playwright`
- Le profil filtre les fichiers e2e/playwright au scaffold — connus cassés (#186)

## Versions & état actuel

- **Skeleton v5** (`@skeletonlabs/skeleton@5.0.0` en latest). Les templates sont compatibles v5 pour l'essentiel, MAIS : theme custom pré-v5 à migrer (#194), classes fantômes à corriger (#195), versions `latest` à épingler (#197).
- **SvelteKit 2.6x / vite-plugin-svelte 7 / vite 8** : les nouveaux projets `sv create` n'ont **plus de `svelte.config.js`** (config dans `vite.config.ts`). Tout patch de `svelte.config.js` est un no-op (cf. blog, #185).
- Svelte 5 runes partout. Pas de patterns Svelte 4 (`on:click`, `<slot`, `$app/stores` → `$app/state`, #196).

## Conventions composants (templates)

- **Skeleton uniquement** : les composants wrappent des classes/presets Skeleton + Tailwind, jamais de CSS brut
- Classes Skeleton valides : `btn`, `input`, `select`, `textarea`, `checkbox`, `badge`, `card`, et presets `preset-filled-*`, `preset-tonal-*`, `preset-outlined-*` (+ suffixes couleurs `-primary-500`, `-surface-400-600`…). **`variant-*` et `preset-ghost` N'EXISTENT PAS en v5** — `variant-*` est l'ancien nommage Skeleton v2, renommé `preset-*` en v3 (cf. #195 : des résidus de l'ancien nommage traînent encore dans le dashboard)
- **`cn()` + prop `class`** sur chaque composant (merge/override)
- **`HTMLAttributes<T>`** de `svelte/elements` pour étendre les attributs natifs (`HTMLDivAttributes` n'existe pas)
- **`$bindable()`** déclaré dans l'interface Props, pas juste déstructuré
- **Phosphor** : `import X from 'phosphor-svelte/lib/IconName'` (pas de sous-dossier `icons/`, pas d'extension)
- Theme : couleurs oklch dans `[data-theme='svelteForge']` — fichier `src/lib/styles/svelteforge-theme.css`. Tokens Tailwind custom (`rounded-card`, `p-element`, `max-w-modal`, `font-heading`, `space-y-section`…) via `@theme` dans `src/lib/styles/tokens.css` — c'est du Tailwind pur, indépendant de Skeleton.

## Git

- Branches : `issue/N-slug` depuis `main`. Jamais de commit direct sur `main`.
- Commits = saves, sans cérémonie. Squash merge uniquement (via PR).
- Toujours partir de `origin/main` à jour (`git fetch` — le main local peut être en retard).

## Pièges connus (vérifiés)

- `sv create` avec plugins : syntaxe explicite `'tailwindcss=plugins:typography,forms'`
- `HTMLAttributes<HTMLImageElement>` n'inclut pas `src`/`alt` — les définir explicitement dans Props
- Réponses d'actions SvelteKit en JSON : `{ type, data }` — le message est à `result.data.message`, pas `result.message` (#188)
- Les messages d'erreur des catch : fallback générique, pas `e.message` brut exposé à l'UI (#188)
- Les dumps `packages/svforge/docs/llms-*.txt` servent de référence hors-ligne (Skeleton v5 + Svelte 5/Kit 2). Si le test de fraîcheur échoue (dump > 190 jours) : `bash packages/svforge/scripts/fetch-llms-docs.sh` puis committer le résultat

## Point d'entrée docs

- README.md — positionnement + usage
- CONTRIBUTING.md — setup + TDD
- packages/svforge/AGENTS.md — spécificités du package svforge (templates, modes)
