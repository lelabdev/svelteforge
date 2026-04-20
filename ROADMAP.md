# SvelteForge — Roadmap

## ✅ Done

### Session 1 — Security Audit (commit 09acbc2)
- [x] Race conditions backend (initPromise reset, atomic first-user-admin)
- [x] redirect() swallowed in reset-password catch
- [x] Password data leaked in debug logs
- [x] Zod v4 API syntax + validation order
- [x] Shell injection in CLI projectName
- [x] Auto .env generation (deleted setup.ts)
- [x] CSP `unsafe-inline` removed in production
- [x] Rate limit XFF spoofing + key bypass fix
- [x] `text-white`/`bg-white` → Skeleton color pairings
- [x] Inline SVGs → Icon component

### Session 2 — Component Audit & Reorganization (commit 80ef02e)
- [x] `text-muted-foreground` → `text-surface-500` (11 occurrences, 8 files)
- [x] `<a><button>` nesting bug → Button with href
- [x] DataTable `sortedData` was a function, not a value
- [x] PasswordInput double binding simplified
- [x] Card icon prop now renders Icon component
- [x] FormField composes Input internally
- [x] ErrorAlert + SuccessAlert → unified Alert with variant
- [x] Deleted unused nav-links.svelte
- [x] Reorganized into atomic sub-directories

---

## 📦 Component Inventory (47 components)

### Structure
```
ui/
  feedback/      Alert, Toast, Loader, EmptyState, SkeletonLoader
  data-display/  Card, DataTable, Badge, Avatar, Breadcrumb, Progress
  navigation/    Tabs, Stepper, Menu, Carousel
  overlay/       Modal, Sheet, ConfirmDialog, PopOver, Tooltip
  input/         Button, SearchInput, Switch, RadioGroup, ThemeToggle
  form/          Input, FormField, PasswordInput, SubmitButton, Checkbox, Select, TextArea
  root/          Accordion, AuthCard, Divider, NavigationLoader, NotificationBadge
icons/           Icon (90+ lucide icons via map)
layout/          Navbar, MobileMenu, AuthButtons, Footer
```

### Key Components
| Component | Variants/Features |
|-----------|-------------------|
| Button | primary, secondary, outline, ghost, danger, success, glass, cta, tonal, none |
| Card | flat, elevated, outlined, none + icon prop |
| Alert | error, success, warning, info (unified) |
| Badge | primary, secondary, success, warning, error, surface |
| DataTable | Sortable columns, custom cell renderers, loading/empty states |

---

## 🔴 High Priority

### 1. Dashboard Layout
- Sidebar + header + main content area
- Collapsible sidebar
- Responsive (sidebar → hamburger on mobile)
- Currently `/dashboard` is a placeholder page

### 2. Landing Page
- The template `+page.svelte` is basic (Welcome + 2 buttons)
- Should showcase what the boilerplate can do
- rune-scroller integration for animations (if desired)
- Keep it simple — this is a boilerplate, not a product page

### 3. README & Documentation
- Installation guide
- Project structure explanation
- Component usage examples
- CLI usage (`npx svelteforge@latest`)
- Mention rune-scroller in "Ecosystem" section

---

## 🟡 Medium Priority

### 4. Component Demo Page
- Route `/demo` showing all 47 components
- Interactive playground
- Useful for development and as living documentation

### 5. Email Templates (BetterAuth)
- Password reset, email verification, welcome email
- HTML templates ready to customize

### 6. Accessibility Pass
- Audit all components for aria attributes
- Keyboard navigation consistency
- Focus management in modals/sheets

---

## 🟢 Low Priority

### 7. Testing
- Vitest configured with examples
- Playwright E2E setup
- Example tests for auth flow

### 8. SEO Utilities
- `metaTags()` helper
- Open Graph / Twitter Card
- sitemap.xml

### 9. DevOps
- Dockerfile (multi-stage build)
- GitHub Actions CI (lint, test, build)
- Auto-publish CLI to npm

---

## 💡 Ideas / Maybe Later

- `svelteforge add <component>` CLI for optional heavy deps
- OAuth provider examples (Google, GitHub)
- Stripe integration example
- Admin panel (users, roles management)
- Multi-tenant with BetterAuth organizations
- Publish rune-scroller to npm + list in ecosystem
