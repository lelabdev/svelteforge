     1|     1|# SvelteForge
     2|     2|
     3|     3|UI/UX layer on top of `sv create`. SvelteForge adds 34 production-ready components, a three-layer theme system, layout primitives, and Zod schemas — while `sv` handles SvelteKit, Tailwind, auth (better-auth), and database (Drizzle + SQLite).
     4|     4|
     5|     5|## Quick Start
     6|     6|
     7|     7|```bash
     8|     8|# Clone and scaffold
     9|     9|git clone https://github.com/lelabdev/svelteforge
    10|    10|cd svelteforge
    11|    11|bunx create-svelteforge my-project --fullstack
    12|    12|
    13|    13|# Or once published on npm:
    14|    14|bunx create-svelteforge my-project
    15|    15|```
    16|    16|
    17|    17|## Post-Install
    18|    18|
    19|    19|```bash
    20|    20|cd my-project
    21|    21|bun dev                # → http://localhost:5173
    22|    22|```
    23|    23|
    24|    24|`sv create` handles `.env` generation (auth secret, DB path). No extra setup step needed.
    25|    25|
    26|    26|## CLI Options
    27|    27|
    28|    28|```bash
    29|    29|bunx create-svelteforge <project-name-or-path> [options]
    30|    30|
    31|    31|Options:
    32|    32|  --fullstack, -f   Full Stack mode (UI + Auth + DB via sv)
    33|    33|  --landing, -l     Landing Page mode (UI only, no auth/DB)
    34|    34|  --help, -h        Show help
    35|    35|
    36|    36|Examples:
    37|    37|  bunx create-svelteforge my-app --fullstack      # Full Stack
    38|    38|  bunx create-svelteforge my-app --landing        # Landing Page
    39|    39|  bunx create-svelteforge my-app                  # Interactive mode
    40|    40|```
    41|    41|
    42|    42|## What's Included
    43|    43|
    44|    44|### Full Stack Mode
    45|    45|
    46|    46|| Layer | Technology |
    47|    47||-------|-----------|
    48|    48|| Framework | **SvelteKit 2** + **Svelte 5** (runes) |
    49|    49|| Styling | **Tailwind CSS v4** + **Skeleton UI v4** |
    50|    50|| Auth | via **sv add-on** (better-auth — email/password, admin plugin, sessions) |
    51|    51|| Database | via **sv add-on** (SQLite `better-sqlite3` + Drizzle ORM) |
    52|    52|| Forms | **SuperForms v2** + **Zod v4** |
    53|    53|| Rich Text | **Tiptap** — editor & preview |
    54|    54|| Icons | **Lucide** (via Icon wrapper component) |
    55|    55|| Logging | **Pino** |
    56|    56|| Testing | **Vitest** (configured, ready to write tests) |
    57|    57|
    58|    58|### 34 UI Components
    59|    59|
    60|    60|All theme-aware, built on Skeleton UI v4:
    61|    61|
    62|    62|**Surfaces** — Card, AuthCard, Modal, Sheet, PopOver, Carousel
    63|    63|**Feedback** — Toast, ErrorAlert, SuccessAlert, Loader, Progress, SkeletonLoader, NavigationLoader
    64|    64|**Navigation** — Tabs, Breadcrumb, Stepper, Menu
    65|    65|**Data** — DataTable, EmptyState, NotificationBadge, Badge, Avatar
    66|    66|**Controls** — Button, Switch, Divider, Accordion, Tooltip, RadioGroup, SearchInput, ThemeToggle, ConfirmDialog
    67|    67|**Forms** — Input, PasswordInput (with strength meter), TextArea, Select, Checkbox, FormField, SubmitButton
    68|    68|**Rich Text** — RichTextEditor, RichTextPreview
    69|    69|
    70|    70|### Theme System
    71|    71|
    72|    72|Three-layer theming — change the look without touching components:
    73|    73|
    74|    74|| Layer | File | Purpose |
    75|    75||-------|------|---------|
    76|    76|| Colors | `svelteForge.css` | 7 domains × 10 shades (oklch) |
    77|    77|| Spacing | `tokens.css` | 60+ semantic tokens (padding, radius, sizing, typography) |
    78|    78|| Fonts | `fonts.css` | Inter, Space Grotesk, Manrope, Fira Code |
    79|    79|
    80|    80|**To create a theme:** copy `svelteForge.css` + `tokens.css`, change the `[data-theme]` name and values. Done. Every component adapts automatically.
    81|    81|
    82|    82|### What SvelteForge Adds vs. `sv create`
    83|    83|
    84|    84|| | `sv create` | + SvelteForge |
    85|    85||--|:-----------:|:-------------:|
    86|    86|| SvelteKit + Tailwind + ESLint + Prettier | ✓ | ✓ |
    87|    87|| Auth (better-auth) | ✓ (add-on) | ✓ |
    88|    88|| Database (Drizzle + SQLite) | ✓ (add-on) | ✓ |
    89|    89|| 34 UI components | — | ✓ |
    90|    90|| 3-layer theme system | — | ✓ |
    91|    91|| Layout (Navbar, Footer, MobileMenu, AuthButtons) | — | ✓ |
    92|    92|| Zod validation schemas | — | ✓ |
    93|    93|| Utils (cn, formatters, theme store) | — | ✓ |
    94|    94|| Auth routes (login, signup, forgot/reset, dashboard, admin) | — | ✓ |
    95|    95|
    96|    96|### Project Structure (Generated)
    97|    97|
    98|    98|```
    99|    99|src/
   100|   100|├── lib/
   101|   101|│   ├── components/
   102|   102|│   │   ├── ui/              # 34 components
   103|   103|│   │   ├── layout/          # Navbar, Footer, AuthButtons, MobileMenu
   104|   104|│   │   └── icons/           # Lucide wrapper
   105|   105|│   ├── schemas/             # Zod v4 validation
   106|   106|│   ├── styles/              # Theme + tokens + fonts
   107|   107|│   └── utils/               # cn, formatters, theme store
   108|   108|├── routes/
   109|   109|│   ├── (public)/            # login, signup, forgot/reset-password
   110|   110|│   ├── (protected)/         # dashboard, admin
   111|   111|│   └── api/                 # auth, health
   112|   112|└── hooks.server.ts          # Auth session, CSP
   113|   113|```
   114|   114|
   115|   115|Auth config, DB connection, and Drizzle schemas live in the standard `sv` locations — SvelteForge doesn't override them.
   116|   116|
   117|   117|## Modes
   118|   118|
   119|   119|| Mode | UI + Forms | Auth + DB |
   120|   120||------|:----------:|:---------:|
   121|   121|| **Full Stack** (default) | ✓ | ✓ (via sv) |
   122|   122|| **Landing Page** | ✓ | ✗ |
   123|   123|
   124|   124|## Scaffold Flow
   125|   125|
   126|   126|1. `sv create` — base SvelteKit + Tailwind + ESLint + Prettier (+ better-auth + Drizzle if Full Stack)
   127|   127|2. SvelteForge copies template — components, layouts, schemas, theme, routes
   128|   128|3. `bun install` — all dependencies
   129|   129|4. Done — `bun dev` to start
   130|   130|
   131|   131|## Development
   132|   132|
   133|   133|```bash
   134|   134|# Test the CLI locally
   135|   135|bunx create-svelteforge test-project --fullstack
   136|   136|
   137|   137|# Interactive mode
   138|   138|bunx create-svelteforge test-project
   139|   139|```
   140|   140|
   141|   141|## Requirements
   142|   142|
   143|   143|- [pnpm](https://pnpm.io) >= 1.0.0
   144|   144|
   145|   145|## License
   146|   146|
   147|   147|MIT
   148|   148|