# SvelteForge — Roadmap

## ✅ Done (Session 1 — Audit & Fixes)

### Security & Bug Fixes (commit 09acbc2)
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
- [x] Added template/.gitignore

---

## 🔴 High Priority

### 1. Wrapped UI Components (variants system)
Wrap Skeleton primitives with pre-configured variants. Goal: `variant="primary"` instead of manually writing 6 classes.

**Components to create:**
- `Button` — variants: primary, secondary, danger, ghost, outline, link
- `Input` — variants: default, error, with icon, with label
- `Card` — variants: default, elevated, outlined, interactive
- `Badge` — variants: default, success, warning, error, info
- `Alert` — variants: info, success, warning, error
- `Textarea` — same as Input variants
- `Select` — with label, error state
- `Avatar` — sizes, fallback, group
- `Tooltip` — simple wrapper
- `Dialog/Modal` — confirm, prompt variants
- `Tabs` — pre-styled
- `Toast/Notification` — system-wide feedback

### 2. Landing Page Demo with rune-scroller
- Integrate `rune-scroller` in the default landing page template
- Show animations on hero, features, CTA sections
- Serves as both demo and promotion for rune-scroller
- Landing page sections: Hero, Features, Pricing, CTA, Footer

### 3. Form Components (SuperForms + Zod integration)
- `FormField` — label + input + error message wrapper
- `FormInput` — Input with validation state from SuperForms
- `FormSelect` — Select with options + validation
- `FormTextarea` — Textarea with validation
- Pre-configured to work with SuperForms + Zod out of the box

---

## 🟡 Medium Priority

### 4. Dashboard Layout System
- `DashboardLayout` — sidebar + header + main content
- Collapsible sidebar
- Responsive (sidebar → hamburger on mobile)
- Breadcrumb integration

### 5. Sidebar + Navigation Component
- `Sidebar` with menu items, icons, active state
- Nested menu support
- Collapsible sections

### 6. Toast / Notification System
- Wrapper around Skeleton Toast or custom
- Success, error, warning, info variants
- Auto-dismiss + manual close
- Queued notifications

### 7. Email Templates (BetterAuth)
- Password reset email
- Email verification
- Welcome email
- HTML templates ready to customize

---

## 🟢 Low Priority

### 8. Data Table Component
- Sortable columns
- Filterable
- Pagination
- Row selection

### 9. Testing Setup
- Vitest configured with examples
- Playwright E2E setup
- Example tests for auth flow

### 10. SEO Utilities
- `metaTags()` helper for +page.ts
- Open Graph / Twitter Card support
- sitemap.xml generation

### 11. Dockerfile
- Multi-stage build
- Optimized for production

### 12. rune-scroller Improvements
- Audit and suggest improvements
- New animations?
- API improvements?

---

## 💡 Ideas / Maybe Later

- `svelteforge add <component>` CLI command for optional heavy deps (charts, rich text editor)
- Component playground / Storybook-like docs
- OAuth provider examples (Google, GitHub)
- Stripe integration example
- Admin panel (users, roles management)
- Multi-tenant support with BetterAuth organizations
