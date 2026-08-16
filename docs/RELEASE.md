# Release npm — modèle et état (#268)

## Modèle de release

La publication est pilotée par `.github/workflows/publish.yml` :

1. **Déclencheurs** : `push` sur `prod` **ou** `workflow_dispatch` (manuel, bouton
   « Run workflow » sur GitHub Actions).
2. **Gates** : le workflow build les 14 packages, lance les tests, puis exécute
   les scaffolds `base`, `dashboard` et `dashboard-foundations` (avec
   PostgreSQL réel, `CI=true`) — rien n'est publié si un scaffold casse.
3. **Ordre de publication** : les **13 packages scoped `@svforge/*` d'abord**
   (ui_toast → dnd → graph → tiptap → email → oauth → uploads → blog →
   realtime → audit → notifications → jobs → chat), puis **`svforge`
   (unscoped) en dernier** — un token qui n'aurait que des droits scoped peut
   quand même livrer les modules ; `svforge` exige un token avec les droits
   sur le nom unscoped.
4. Chaque step est un `npm publish --access public --ignore-scripts` avec
   `NODE_AUTH_TOKEN=${{ secrets.NPM_TOKEN }}`.

## Versions

Les versions sont gérées dans chaque `packages/*/package.json`. Une
publication échoue si la version locale n'est **pas strictement supérieure**
à la version publiée sur npm.

## Exigences token (`secrets.NPM_TOKEN`)

Le compte npm associé au token doit avoir :

- les droits **publish sur le scope `@svforge/*`** (créer les packages manquants
  et pousser les versions) — `npm access grant read-write <compte>
  @svforge/<package>` par package, ou les droits org si le scope a un org ;
- les droits **publish sur `svforge` (unscoped)**.

Le compte propriétaire actuel des packages existants est **`ludoloops`**
(`npm view @svforge/ui_toast maintainers`). Pour débloquer la publication :
ajouter le compte du token en collaborateur de chaque package
(`npm owner add <compte> @svforge/<package>` et `npm owner add <compte>
svforge`), ou publier avec un token de `ludoloops`.

## État vérifié (août 2026 — audit #268)

### Packages présents sur npmjs

| Package | Version npm | État |
|---|---|---|
| `@svforge/ui_toast` | 0.0.1 | publié, **types hashés** (pre-#256) |
| `@svforge/dnd` | 0.0.1 | publié, **types hashés** (pre-#256) |
| `@svforge/tiptap` | 0.0.1 | publié, **types hashés** (pre-#256) |
| `svforge` | 1.1.0 | publié |
| `@svforge/{graph,email,oauth,uploads,blog,audit,notifications,jobs,realtime,chat}` | — | **jamais publiés** |

> Les versions « 0.0.2 / 4.38.0 / 1.0.0 … » vues sur des packages homonymes
> unscoped (`realtime`, `chat`, `blog` …) ne sont **pas les nôtres** — elles
> appartiennent à des packages npm tiers sans rapport.

### Tarballs (vérifiés sur l'état courant)

Les 14 packages produisent des tarballs contenant exactement
`README.md`, `package.json`, `dist/index.js` et `dist/index.d.ts` (noms
stables, #256). Vérification : `cd packages/<p> && npm pack --dry-run`.

### Installation depuis un registry (smoke test)

Prouvé avec un registry local (Verdaccio) :

```bash
# publier les 14 packages sur le registry local
cd packages/<p> && npm publish --registry http://127.0.0.1:4873
# projet consommateur : installation + résolution des types
npm install @svforge/realtime --registry=http://127.0.0.1:4873
bunx tsc --noEmit   # 0 erreur sur @svforge/*
```

`sv add` depuis le registry npm réel ne peut pas être testé de bout en bout
tant que les 10 packages `@svforge/*` manquants ne sont pas publiés : le CLI
`sv` résout les addons community sur `registry.npmjs.org` en dur (pas de
registry custom), donc un package absent → 404.

### Blocage actuel

`secrets.NPM_TOKEN` échoue avec `E404 … not in this registry` sur le premier
step `npm publish` : le compte du token n'a pas les droits sur le scope
`@svforge/*` (ni sur `svforge`). La publication réelle ne peut pas être
terminée sans intervention sur les droits npm (voir « Exigences token »).
