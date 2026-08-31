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
- **ThemeToggle** — light/dark toggle with system detection
- **Logo** — brand logo
- **Seo** — Open Graph + Twitter Card meta tags
- **generateSitemap()** — XML sitemap generator utility

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
- **Fonts**: Inter (body) and Space Grotesk (headings), configured by the Skeleton theme
- **Theme**: `svelteForge` with complete primary, secondary, tertiary, success, warning, error and surface palettes, plus brand/root/typography/shape values
- **No generic `tokens.css` or `index.css` layer** is scaffolded by default

If a consumer project later develops a real repeated design need that Skeleton/Tailwind do not model, it can add a project-specific layer at that point. The generic boilerplate does not pre-invent one.

## Next Steps

- **Modify the theme**: edit `src/lib/styles/svelteforge-theme.css`
- **Add a route**: create `src/routes/about/+page.svelte`
- **Add richer UI**: use components from `@skeletonlabs/skeleton-svelte` directly before creating a project-local primitive
- **Remove demo**: delete `/demo-ui` route and Navbar links
