# CLAUDE.md

## What is PPR (PausePlayRepeat)

PPR is an all-in-one music production creator platform. Creators can build storefronts to sell courses, beats, sample packs, presets, Ableton racks, coaching, memberships, and more. Learners earn XP, certificates, and climb leaderboards. The platform includes AI-powered tools (Master AI for mixing/mastering chat, AI course builder), email marketing workflows, affiliate systems, and social media automation.

Live at: https://pauseplayrepeat.com

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack) + React 19 + TypeScript
- **Database/Backend:** Convex (real-time, serverless)
- **Auth:** Clerk
- **Styling:** Tailwind CSS v3 + shadcn/ui (New York style, Radix primitives, Lucide icons)
- **Payments:** Stripe (subscriptions, one-time, Connect for creator payouts)
- **Email:** AWS SES (custom queue system in Convex)
- **AI:** Claude API, OpenAI GPT-4o-mini
- **Video:** Remotion (programmatic video generation)
- **Desktop:** Electron (sample drag-and-drop app)
- **Deployment:** Vercel (frontend) + Convex (backend)
- **Testing:** Vitest
- **Package Manager:** npm

## Commands

```bash
npm install                # Install dependencies
npm run dev                # Start Next.js + Convex + Stripe listener (concurrently)
npm run dev:next           # Start Next.js dev server only
npx convex dev             # Start Convex backend only
npx convex deploy          # Deploy Convex to production
npm run build              # Production build
npm run lint               # ESLint
npm run typecheck          # TypeScript type checking
npm run test               # Run tests (Vitest)
npm run remotion:studio    # Open Remotion Studio
```

## Key Directories

```
app/                    # Next.js App Router pages
  (dashboard)/          # Authenticated dashboard routes
  [slug]/               # Creator storefront pages (public)
  api/                  # API routes (webhooks, generation endpoints)
  marketplace/          # Public marketplace (courses, beats, plugins, etc.)
  dashboard/            # Dashboard UI (create, settings, analytics)
components/             # React components
  ui/                   # shadcn/ui components (DO NOT build custom versions)
  course/               # Course-related components
  social-media/         # Social media automation components
convex/                 # Convex backend (schema, queries, mutations, actions)
  _generated/           # Auto-generated Convex types (do not edit)
  lib/                  # Shared backend utilities (auth, encryption, email)
  admin/                # Admin-only backend functions
  analytics/            # Analytics aggregation
  aiPlatform/           # AI agent platform (Master AI)
lib/                    # Frontend utilities, helpers, types
  pdf-templates/        # Remotion-based PDF generation templates
hooks/                  # Custom React hooks
emails/                 # Email templates
desktop/                # Electron desktop app
remotion/               # Remotion video compositions
__tests__/              # Test files
```

## Available Skills & References

### ShadCN UI
- **Path:** `.agents/skills/shadcn/` (symlinked to `.claude/skills/shadcn/`)
- Manages shadcn component discovery, installation, styling, debugging, and composition
- Uses `npx shadcn@latest info --json` for project context
- Uses `npx shadcn@latest docs <component>` for component documentation
- Config: `components.json` (New York style, Radix base, Lucide icons, CSS variables)
- Reference: https://ui.shadcn.com/docs

### Frontend Design
- **Path:** `.claude/skills/frontend-design/SKILL.md`
- Creates distinctive, production-grade frontend interfaces with high design quality
- Emphasizes bold aesthetic direction, intentional typography, and avoiding generic AI aesthetics
- Use when building new pages, components, or UI overhauls

### Tweet Master
- **Path:** `.claude/skills/tweet-master/SKILL.md`
- Generates tweets based on journal.md entries
- Casual, lowercase, music production + tech crossover voice
- Only tweets about real events from the journal

### Remotion Best Practices
- **Path:** `.agents/skills/remotion-best-practices/SKILL.md`
- Best practices for Remotion video creation in React
- Covers: animations, audio visualization, captions, fonts, transitions, 3D, charts, and more
- Individual rule files in `rules/` subdirectory for each topic

### Resend (Legacy -- Do Not Use)
- **Path:** `.agents/skills/resend/SKILL.md`
- Sub-skills: `send-email`, `resend-inbound`, `agent-email-inbox`, `templates`
- Email delivery is via AWS SES (migrated from Resend). The Resend skill is legacy reference only -- do not use Resend patterns for new email features.
- Reference: https://resend.com/docs

## Key Patterns

### Convex Backend
- Run `npx convex dev` alongside `npm run dev` (the `dev` script does both)
- Run `npx convex deploy` for production
- Run `npx convex codegen` after schema changes
- Use `.withIndex()` instead of `.filter()` to avoid 32K document read limits
- Use `ctx.db.get(id)` for single document lookups, never `.filter(q => q.eq(q.field("_id"), id))`

### Clerk + Convex User ID
- Clerk provides `clerkId` (string from Clerk)
- Convex has its own `_id` (document ID)
- Some tables use `clerkId`, others use Convex `_id` -- check schema

### Styling Conventions
- Use `cn()` utility for className merging (from `@/lib/utils`)
- Use shadcn/ui components from `@/components/ui/` -- don't build custom versions
- Icons: use `lucide-react`
- Use semantic color tokens (`bg-primary`, `text-muted-foreground`), not raw colors
- Use `gap-*` instead of `space-x-*` / `space-y-*`
- PPR brand: orange accent on dark backgrounds

### Data Access
- Use Convex queries/mutations for all data access
- Use Clerk for authentication
- All tokens and secrets encrypted at rest via `convex/lib/encryption.ts`

### Email
- Email delivery is via AWS SES (migrated from Resend). Do not use Resend patterns for new email features.
- Email send queue system in Convex (`convex/emailSendQueue.ts`, `convex/emailSendQueueActions.ts`)
- Workflow-based email sequences (`convex/emailWorkflows.ts`)
- Suppression, bounce handling, and unsubscribe management built in
