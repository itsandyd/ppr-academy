# PPR Academy — Documentation Index

> **Last Full Scan:** 2026-02-19
> **Passes Completed:** 3 (Foundation + Frontend & UI + Cheat Sheet Pack & PDF Systems)

---

## How to Use This Documentation

These docs describe the PPR Academy codebase as it exists today. They are written for developers (and AI agents) who need to understand the system before making changes.

### Keeping Docs Updated

- When adding a new system or major feature, create or update the relevant doc
- When architectural patterns change, update CONVENTIONS.md and FRONTEND.md
- When new tables are added, update DATABASE_SCHEMA.md
- Run a full scan periodically to catch drift between docs and code
- Each document notes areas that need expansion in future passes

---

## Table of Contents

### Architecture

| Document | Description |
|----------|-------------|
| [OVERVIEW.md](architecture/OVERVIEW.md) | High-level system architecture, hosting, deployment, external services, data flow diagram |
| [FRONTEND.md](architecture/FRONTEND.md) | Next.js App Router structure, layouts, middleware, client/server components, state management, styling, forms, error handling, loading, responsiveness, theming |
| [COMPONENT_MAP.md](architecture/COMPONENT_MAP.md) | Complete component hierarchy — shadcn/ui base (33), custom UI (20), domain components (100+), layouts, navigation, modals, forms, hooks, composition patterns |
| [CONVENTIONS.md](architecture/CONVENTIONS.md) | File naming, component structure, Convex function patterns, API routes, server actions, error handling, TypeScript, imports, env vars, testing, utilities |
| [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md) | Convex schema — 196 tables, indexes, relationships, key fields |
| [TECH_STACK.md](architecture/TECH_STACK.md) | Full dependency inventory with versions and purposes |
| [API_ROUTES.md](architecture/API_ROUTES.md) | All Next.js API routes — webhooks, checkout sessions, OAuth callbacks, content generation |

### Systems

| Document | Description |
|----------|-------------|
| [DASHBOARD.md](systems/DASHBOARD.md) | Dual-mode dashboard (Learn/Create) — mode toggle, state persistence, sidebar navigation, shell layout, route map, auth protection |
| [COURSES.md](systems/COURSES.md) | Course system — creation, enrollment, chapters, drip content, cheat sheets, reference PDFs |
| [PAYMENTS.md](systems/PAYMENTS.md) | Stripe integration — checkout sessions, Connect, webhooks, subscription management |
| [EMAIL_MARKETING.md](systems/EMAIL_MARKETING.md) | Email system — workflows, campaigns, drip sequences, deliverability, queue |
| [PRODUCTS_MARKETPLACE.md](systems/PRODUCTS_MARKETPLACE.md) | Digital products, marketplace, storefronts, product types |
| [SOCIAL_MEDIA.md](systems/SOCIAL_MEDIA.md) | Social media — publishing, scheduling, automation, follow gates |
| [AI_FEATURES.md](systems/AI_FEATURES.md) | AI integrations — Master AI, course builder, content generation, video scripts |

### Product

| Document | Description |
|----------|-------------|
| [PRODUCT_OVERVIEW.md](prd/PRODUCT_OVERVIEW.md) | What PPR Academy is, target users, value proposition |
| [USER_TYPES.md](prd/USER_TYPES.md) | User personas — learners, creators, admins |
| [FEATURE_MAP.md](prd/FEATURE_MAP.md) | Feature inventory by area |

### Historical

| Document | Description |
|----------|-------------|
| [2025-01-january/](2025-01-january/) | 16 historical docs from January 2025 — deployment notes, feature plans, implementation summaries |

---

## Documentation Stats

| Metric | Value |
|--------|-------|
| Total documentation files | 27 |
| Architecture docs | 7 |
| Systems docs | 7 |
| Product docs | 3 |
| Historical docs | 16 |
| Estimated total word count | ~25,000 |

### Created in Pass 2 (2026-02-19)

- `architecture/FRONTEND.md` — ~2,800 words
- `architecture/COMPONENT_MAP.md` — ~2,400 words
- `architecture/CONVENTIONS.md` — ~2,200 words
- `systems/DASHBOARD.md` — ~2,000 words
- `README.md` (this file) — ~400 words

### Updated in Pass 3 (2026-02-19)

- `architecture/DATABASE_SCHEMA.md` — Added full `cheatSheets` and `cheatSheetPacks` table definitions, `referencePdfGeneratedAt` field on courses
- `architecture/API_ROUTES.md` — Expanded cheat sheet pack and reference PDF route docs, added `publish-cheat-sheet-pack` route (total: 85 routes)
- `prd/FEATURE_MAP.md` — Added cheat sheet pack generation/publishing/student view features, updated AI model references
- `systems/COURSES.md` — Full cheat sheet pack system documentation (pipeline, constraints, publishing, student view, Convex functions), PDF template library, reference PDF model updates
- `systems/AI_FEATURES.md` — Model change from OpenAI to Claude 3.5 Haiku via OpenRouter, cheat sheet limits enforcement, PDF rendering, cost estimates

### Remaining Gaps

- **Deployment & CI/CD** — Vercel config, Convex deploy flow, environment promotion
- **Remotion Video System** — Compositions, rendering pipeline, Lambda integration
- **Desktop App (Electron)** — Architecture of `/desktop/` directory
- **RAG & Embeddings** — Vector search, contextual retrieval pipeline
- **Notification System** — Real-time notifications architecture
- **Accessibility Audit** — WCAG compliance status
- **Performance** — Bundle analysis, Core Web Vitals, optimization patterns
- **ESLint & Formatting** — Linting rules, Prettier config, git hooks
