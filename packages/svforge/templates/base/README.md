# SvelteForge Base Template

UI-only starter with components, a complete Skeleton v5 theme, and layouts. No auth, no database.

## What You Get

### Components
- **Button** — filled, outlined, tonal and ghost variants × 7 colors, 3 sizes, loading state
- **Card** — flat, elevated, outlined variants with optional header/footer snippets
- **Badge** — filled, outlined, tonal variants × 7 colors
- **Input / Select / Textarea / Checkbox / Toggle** — form components with label + error support
- **Alert** — info, success, warning, error variants
- **Table** — column-based table with optional rich-cell renderer
- **Navbar** — responsive sticky nav with mobile menu + theme toggle
- **Footer** — configurable links + copyright
- **ThemeToggle** — light/dark toggle with system detection and no-hydration-flash initialization
- **Logo** — brand logo that respects reduced-motion preferences
- **Seo** — canonical, Open Graph and Twitter Card meta tags with absolute URLs
- **generateSitemap()** — XML sitemap generator utility with escaped output

> Richer components (Accordion, Tabs, Avatar, Breadcrumb, dialogs…) are NOT
> re-implemented here — use the official ones from `@skeletonlabs/skeleton-svelte`
> directly. They ship the interaction/accessibility behavior with Skeleton.

### Routes
- `/` — Landing page with hero + feature cards
- `/demo-ui` — Base components showcased

### Styles

The CSS architecture is intentionally small:

```text
src/routes/layout.css
└── single global CSS entrypoint
    ├── Tailwind
    ├── Skeleton / Skeleton Svelte
    ├── fonts
    ├── plugins / dark variant
    └── imports ../lib/styles/svelteforge-theme.css

src/lib/styles/svelteforge-theme.css
└── complete Skeleton v5 theme
```

- **Tailwind CSS v4** for local layout, spacing and responsive composition using standard utilities
- **Skeleton UI v5** as the visual/UI foundation
- **Fonts**: Inter (body) and Space Grotesk (headings) are configured by the Skeleton theme; Fira Code is preinstalled and applied to `code`/`pre` snippets because Skeleton has no dedicated code-typography role
- **Theme**: `svelteForge` with complete primary, secondary, tertiary, success, warning, error and surface palettes, plus brand/root/typography/shape values
- **No generic `tokens.css` or `index.css` layer** is scaffolded by default

If a consumer project later develops a real repeated design need that Skeleton/Tailwind do not model, it can add a project-specific layer at that point. The generic boilerplate does not pre-invent one.

## Defaults vs constraints

The template is opinionated so the app renders and type-checks immediately after `sv add`. The palette, the three fonts and the FR/EN locale pair are **ready-made defaults, not framework constraints** — each has one identified source of truth:

| Concern | Scaffolded default | Source of truth (edit here) |
|---------|--------------------|-----------------------------|
| Palette / theme | complete Skeleton v5 theme (`svelteForge`) | `src/lib/styles/svelteforge-theme.css` |
| Fonts | Inter (body), Space Grotesk (headings), Fira Code (code) | `src/routes/layout.css` (`@fontsource-variable/*` imports) |
| UI copy locales | `fr` (baseLocale) + `en` catalogs | `messages/<locale>.json` + `project.inlang/settings.json` |

- **Replace the palette**: edit the theme values in `svelteforge-theme.css` (or import a different Skeleton v5 theme). The architecture — Skeleton + Tailwind + the single CSS entrypoint — does not change.
- **Change or remove a font**: the `@fontsource-variable/inter`, `@fontsource-variable/space-grotesk` and `@fontsource-variable/fira-code` imports in `src/routes/layout.css` are the only font declarations. Swap an import and its role mapping in the theme (Space Grotesk = headings, Inter = body, Fira Code = `code`/`pre`), or delete both to drop the font.
- **UI copy (Paraglide)**: `messages/<locale>.json` catalogs are the AI-first, diffable source of truth for static UI copy — edit the JSON, never the generated `src/lib/paraglide/` output. `fr` and `en` are the initial locale set, not the only supported locales. Keep key parity across every configured locale.
- **Static UI copy vs content**: static UI copy belongs in the catalogs; long-form editorial, business and CMS content (MDsveX posts, database records) belongs in its own storage, not in `messages/`.

### Adding a locale (example: Spanish)

1. create `messages/es.json` with the same key set as `messages/fr.json` (translations included);
2. add `"es"` to `locales` in `project.inlang/settings.json`:

```json
{
  "baseLocale": "fr",
  "locales": ["fr", "en", "es"]
}
```

Removing a locale is the reverse (delete the catalog + the `locales` entry). Changing the base locale is a one-line edit of `baseLocale` in the same file.

## SEO and theme customization

- **Base URL**: pass your deployed absolute URL to `generateSitemap()` (for example, `https://example.com`). `Seo` resolves relative `url` and `image` props against the current page URL.
- **Title, description and image**: pass product-specific values to `<Seo title="…" description="…" image="/social-card.png" />`; replace the default route titles as you build your app.
- **Theme initialization**: `static/theme-init.js` runs before hydration. Keep it external when editing it so strict CSP policies can allow it without `unsafe-inline`.

## Next Steps

- **Modify the theme**: edit `src/lib/styles/svelteforge-theme.css`
- **Change fonts or locales**: see “Defaults vs constraints” above
- **Add a route**: create `src/routes/about/+page.svelte`
- **Add richer UI**: use components from `@skeletonlabs/skeleton-svelte` directly before creating a project-local primitive
- **Remove demo**: delete `/demo-ui` route and Navbar links
