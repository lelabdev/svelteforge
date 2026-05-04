     1|# SvelteForge
     2|
     3|UI/UX layer on top of `sv create`. SvelteForge adds 34 production-ready components, a three-layer theme system, layout primitives, and Zod schemas — while `sv` handles SvelteKit, Tailwind, auth (better-auth), and database (Drizzle + SQLite).
     4|
     5|## Quick Start
     6|
     7|```bash
     8|# Clone and scaffold
     9|git clone https://github.com/lelabdev/svelteforge
    10|cd svelteforge
    11|pnpm dlx create-svelteforge my-project --fullstack
    12|
    13|# Or once published on npm:
    14|pnpm dlx create-svelteforge my-project
    15|```
    16|
    17|## Post-Install
    18|
    19|```bash
    20|cd my-project
    21|pnpm dev                # → http://localhost:5173
    22|```
    23|
    24|`sv create` handles `.env` generation (auth secret, DB path). No extra setup step needed.
    25|
    26|## CLI Options
    27|
    28|```bash
    29|pnpm dlx create-svelteforge <project-name-or-path> [options]
    30|
    31|Options:
    32|  --fullstack, -f   Full Stack mode (UI + Auth + DB via sv)
    33|  --landing, -l     Landing Page mode (UI only, no auth/DB)
    34|  --help, -h        Show help
    35|
    36|Examples:
    37|  pnpm dlx create-svelteforge my-app --fullstack      # Full Stack
    38|  pnpm dlx create-svelteforge my-app --landing        # Landing Page
    39|  pnpm dlx create-svelteforge my-app                  # Interactive mode
    40|```
    41|
    42|## What's Included
    43|
    44|### Full Stack Mode
    45|
    46|| Layer | Technology |
    47||-------|-----------|
    48|| Framework | **SvelteKit 2** + **Svelte 5** (runes) |
    49|| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
    50|| Auth | via **sv add-on** (better-auth — email/password, admin plugin, sessions) |
    51|| Database | via **sv add-on** (SQLite `better-sqlite3` + Drizzle ORM) |
    52|| Forms | **SuperForms v2** + **Zod v4** |
    53|| Rich Text | **Tiptap** — editor & preview |
    54|| Icons | **Lucide** (via Icon wrapper component) |
    55|| Logging | **Pino** |
    56|| Testing | **Vitest** (configured, ready to write tests) |
    57|
    58|### 34 UI Components
    59|
    60|All theme-aware, built on Skeleton UI v4:
    61|
    62|**Surfaces** — Card, AuthCard, Modal, Sheet, PopOver, Carousel
    63|**Feedback** — Toast, ErrorAlert, SuccessAlert, Loader, Progress, SkeletonLoader, NavigationLoader
    64|**Navigation** — Tabs, Breadcrumb, Stepper, Menu
    65|**Data** — DataTable, EmptyState, NotificationBadge, Badge, Avatar
    66|**Controls** — Button, Switch, Divider, Accordion, Tooltip, RadioGroup, SearchInput, ThemeToggle, ConfirmDialog
    67|**Forms** — Input, PasswordInput (with strength meter), TextArea, Select, Checkbox, FormField, SubmitButton
    68|**Rich Text** — RichTextEditor, RichTextPreview
    69|
    70|### Theme System
    71|
    72|Three-layer theming — change the look without touching components:
    73|
    74|| Layer | File | Purpose |
    75||-------|------|---------|
    76|| Colors | `svelteForge.css` | 7 domains × 10 shades (oklch) |
    77|| Spacing | `tokens.css` | 60+ semantic tokens (padding, radius, sizing, typography) |
    78|| Fonts | `fonts.css` | Inter, Space Grotesk, Manrope, Fira Code |
    79|
    80|**To create a theme:** copy `svelteForge.css` + `tokens.css`, change the `[data-theme]` name and values. Done. Every component adapts automatically.
    81|
    82|### What SvelteForge Adds vs. `sv create`
    83|
    84|| | `sv create` | + SvelteForge |
    85||--|:-----------:|:-------------:|
    86|| SvelteKit + Tailwind + ESLint + Prettier | ✓ | ✓ |
    87|| Auth (better-auth) | ✓ (add-on) | ✓ |
    88|| Database (Drizzle + SQLite) | ✓ (add-on) | ✓ |
    89|| 34 UI components | — | ✓ |
    90|| 3-layer theme system | — | ✓ |
    91|| Layout (Navbar, Footer, MobileMenu, AuthButtons) | — | ✓ |
    92|| Zod validation schemas | — | ✓ |
    93|| Utils (cn, formatters, theme store) | — | ✓ |
    94|| Auth routes (login, signup, forgot/reset, dashboard, admin) | — | ✓ |
    95|
    96|### Project Structure (Generated)
    97|
    98|```
    99|src/
   100|├── lib/
   101|│   ├── components/
   102|│   │   ├── ui/              # 34 components
   103|│   │   ├── layout/          # Navbar, Footer, AuthButtons, MobileMenu
   104|│   │   └── icons/           # Lucide wrapper
   105|│   ├── schemas/             # Zod v4 validation
   106|│   ├── styles/              # Theme + tokens + fonts
   107|│   └── utils/               # cn, formatters, theme store
   108|├── routes/
   109|│   ├── (public)/            # login, signup, forgot/reset-password
   110|│   ├── (protected)/         # dashboard, admin
   111|│   └── api/                 # auth, health
   112|└── hooks.server.ts          # Auth session, CSP
   113|```
   114|
   115|Auth config, DB connection, and Drizzle schemas live in the standard `sv` locations — SvelteForge doesn't override them.
   116|
   117|## Modes
   118|
   119|| Mode | UI + Forms | Auth + DB |
   120||------|:----------:|:---------:|
   121|| **Full Stack** (default) | ✓ | ✓ (via sv) |
   122|| **Landing Page** | ✓ | ✗ |
   123|
   124|## Scaffold Flow
   125|
   126|1. `sv create` — base SvelteKit + Tailwind + ESLint + Prettier (+ better-auth + Drizzle if Full Stack)
   127|2. SvelteForge copies template — components, layouts, schemas, theme, routes
   128|3. `pnpm install` — all dependencies
   129|4. Done — `pnpm dev` to start
   130|
   131|## Development
   132|
   133|```bash
   134|# Test the CLI locally
   135|pnpm dlx create-svelteforge test-project --fullstack
   136|
   137|# Interactive mode
   138|pnpm dlx create-svelteforge test-project
   139|```
   140|
   141|## Requirements
   142|
   143|- [pnpm](https://pnpm.io) >= 1.0.0
   144|
   145|## License
   146|
   147|MIT
   148|