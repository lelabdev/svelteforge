# SvelteForge Base Template

UI-only starter with components, theme, and layouts. No auth, no database.

## What You Get

### Components
- **Button** — 4 variants (filled, outlined, tonal, ghost) × 7 colors, 3 sizes, loading state
- **Card** — flat, elevated, outlined variants with optional header/footer snippets
- **Badge** — filled, outlined, tonal variants × 7 colors
- **Input / Select / Textarea / Checkbox / Toggle** — form components with label + error support
- **Alert** — info, success, warning, error variants
- **Accordion** — collapsible sections
- **Tabs** — tabbed content panels
- **Table** — sortable column-based table
- **Breadcrumb** — navigation trail
- **Avatar** — image-based avatar with ring
- **Navbar** — responsive sticky nav with mobile menu + theme toggle
- **Footer** — configurable links + copyright
- **ThemeToggle** — light/dark toggle with system detection
- **Logo** — animated gradient text logo
- **Seo** — Open Graph + Twitter Card meta tags

### Routes
- `/` — Landing page with hero + feature cards
- `/demo-ui` — All components showcased

### Styles
- **Tailwind CSS v4** with `@theme` custom tokens (spacing, radius, widths)
- **Skeleton UI v4** design system with oklch colors
- **Fonts**: Inter (body), Space Grotesk (headings), Fira Code (code)
- **Theme**: `svelteForge` custom theme with primary, secondary, tertiary, success, warning, error, surface palettes

## Next Steps

- **Modify the theme**: Edit `src/lib/styles/svelteforge-theme.css` (oklch color variables)
- **Add a route**: Create `src/routes/about/+page.svelte`
- **Add components**: Skeleton v4 provides Toast, Dialog, Combobox, DatePicker, Progress, Rating, Stepper, Carousel, Pagination — use them directly
- **Remove demo**: Delete `/demo-ui` route and Navbar links
