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

## 📦 Current Component Inventory

The boilerplate already includes **48 components** across 3 categories:

### UI Components (34)
| Component | Variants/Features |
|-----------|-------------------|
| Accordion | Skeleton wrapper |
| AuthCard | Auth form card |
| Avatar | — |
| Badge | primary, secondary, success, warning, error, surface |
| Breadcrumb | Skeleton wrapper |
| Button | ✅ variant system (primary, secondary, etc.) — 104 lines |
| Card | flat, elevated, outlined, none |
| Carousel | Skeleton wrapper |
| ConfirmDialog | Confirmation modal |
| DataTable | Table component |
| Divider | — |
| EmptyState | — |
| ErrorAlert | Error alert |
| Loader | — |
| Menu | Skeleton wrapper |
| Modal | Dialog component |
| NavigationLoader | Route transition loader |
| NotificationBadge | count, max, size |
| PopOver | Skeleton wrapper |
| Progress | Skeleton wrapper |
| RadioGroup | Skeleton wrapper |
| SearchInput | Search field |
| Sheet | Side panel (Dialog-based) |
| SkeletonLoader | Loading skeleton |
| Stepper | Custom (completed/current/upcoming) |
| SuccessAlert | Success alert |
| Switch | Skeleton wrapper |
| Tabs | Skeleton wrapper |
| ThemeToggle | Dark/light toggle |
| Toast | Toast notification |
| Tooltip | Skeleton wrapper |

### Form Components (8)
| Component | Features |
|-----------|----------|
| Checkbox | — |
| FormField | Label + error wrapper |
| Input | Text input |
| PasswordInput | With show/hide toggle |
| Select | Dropdown select |
| SubmitButton | Form submit button |
| TextArea | Multiline input |

### Layout Components (6)
Navbar, MobileMenu, AuthButtons, Footer, NavLinks, index

---

## 🔴 High Priority

### 1. Landing Page Demo with rune-scroller
- Integrate `rune-scroller` (lelabdev/rune-scroller) in the default landing page
- Sections: Hero, Features, Pricing, CTA, Footer
- Serves as demo for rune-scroller + promotion
- Make landing page look polished and professional

### 2. Audit Existing Components Quality
- Verify all 48 components follow consistent patterns
- Check variant systems are complete
- Ensure all respect Skeleton color pairings (no `text-white` etc.)
- Accessibility pass (aria attributes, keyboard nav)

### 3. rune-scroller Improvements
- Audit rune-scroller for potential improvements
- New animations?
- API refinements?

---

## 🟡 Medium Priority

### 4. Dashboard Layout
- Sidebar + header + main content
- Collapsible sidebar
- Responsive (sidebar → hamburger on mobile)

### 5. Component Demo Page
- A route like `/demo` or `/components` that shows all components
- Interactive playground
- Useful for development and as documentation

### 6. Email Templates (BetterAuth)
- Password reset, email verification, welcome email
- HTML templates ready to customize

### 7. Better Docs / Comments
- JSDoc on all component Props
- Usage examples in component files
- AGENTS.md or CONTRIBUTING.md

---

## 🟢 Low Priority

### 8. Testing Setup
- Vitest configured with examples
- Playwright E2E setup
- Example tests for auth flow

### 9. SEO Utilities
- `metaTags()` helper
- Open Graph / Twitter Card
- sitemap.xml

### 10. Dockerfile
- Multi-stage build
- Production-optimized

### 11. CI/CD
- GitHub Actions for lint, test, build
- Auto-publish CLI to npm

---

## 💡 Ideas / Maybe Later

- `svelteforge add <component>` CLI for optional heavy deps
- OAuth provider examples (Google, GitHub)
- Stripe integration example
- Admin panel (users, roles management)
- Multi-tenant with BetterAuth organizations
