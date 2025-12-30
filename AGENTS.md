# PROJECT KNOWLEDGE BASE

**Generated:** 2025-12-30
**Commit:** bbbea71
**Branch:** main

## OVERVIEW

Music production education platform. Creators sell courses, samples, digital products. Students browse marketplace, enroll, track progress. Multi-tenant storefronts with custom domains. Credits-based sample marketplace (Splice clone).

## STACK

- **Framework**: Next.js 15 App Router + React 19 + Turbopack
- **Backend**: Convex (real-time NoSQL, NOT Prisma despite README)
- **Auth**: Clerk (webhook sync to Convex)
- **Payments**: Stripe Connect (10% platform fee)
- **UI**: Tailwind CSS + shadcn/ui + Radix primitives
- **Email**: Resend
- **AI**: OpenAI + LangChain + ElevenLabs TTS

## STRUCTURE

```
ppr-academy/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Route group: creator dashboard
│   ├── [slug]/             # Public storefronts
│   ├── actions/            # Server actions (4 files)
│   ├── api/                # API routes + webhooks
│   └── dashboard/          # Learner dashboard
├── components/             # React components
│   ├── ui/                 # shadcn/ui (49 files)
│   └── {domain}/           # Feature-specific
├── convex/                 # Backend (153 files) ← CORE
│   ├── masterAI/           # AI orchestration
│   ├── schema.ts           # Database schema (2000+ lines)
│   └── *.ts                # Queries, mutations, actions
├── lib/                    # Utilities, types, providers
├── hooks/                  # Custom React hooks
├── emails/                 # React Email templates
└── .docs/                  # Documentation (date-organized)
```

## WHERE TO LOOK

| Task                   | Location                           | Notes                       |
| ---------------------- | ---------------------------------- | --------------------------- |
| Add Convex table       | `convex/schema.ts`                 | Add table + indexes         |
| Add Convex function    | `convex/{domain}.ts`               | query/mutation/action       |
| Add API route          | `app/api/{route}/route.ts`         | Use for webhooks mainly     |
| Add server action      | `app/actions/*.ts`                 | `"use server"` directive    |
| Add UI component       | `components/ui/`                   | Follow shadcn patterns      |
| Add feature component  | `components/{feature}/`            | Colocate with feature       |
| Add page               | `app/{route}/page.tsx`             | Server component by default |
| Store/creator features | `app/(dashboard)/store/`           | Multi-tenant                |
| Learner features       | `app/dashboard/` or `app/library/` | User-facing                 |
| Documentation          | `.docs/2025-01-january/`           | Date-based organization     |

## DATA MODEL KEYS

```
Course → Module → Lesson → Chapter (hierarchy)
Store → Products/Courses (multi-tenant)
User.clerkId ← use for course queries
User._id (Convex) ← use for product queries
```

## CONVENTIONS

- **Toast/Dropdown BG**: Always `bg-white dark:bg-black`
- **User ID disambiguation**: Courses use `clerkId`, products use Convex `_id`
- **Server components default**: Add `"use client"` only when needed
- **Forms**: React Hook Form + Zod + server actions
- **Real-time**: Use Convex for live updates, not polling
- **Docs placement**: NEVER root `.md` except README.md → use `.docs/`
- **File naming**: UPPERCASE_WITH_UNDERSCORES.md for docs

## ANTI-PATTERNS (THIS PROJECT)

| Pattern                      | Why Bad                  | Alternative                      |
| ---------------------------- | ------------------------ | -------------------------------- |
| `filter()` in Convex queries | Full table scan          | Use `.withIndex()`               |
| `ctx.db` in actions          | Actions can't access DB  | `ctx.runQuery`/`ctx.runMutation` |
| `v.bigint()`                 | Deprecated               | Use `v.int64()`                  |
| API routes for data          | Bypasses Convex benefits | Use Convex functions             |
| Prisma imports               | Legacy, not used         | Use Convex                       |
| Root markdown files          | Disorganized             | `.docs/{date}/FILE.md`           |

## PROTECTED ROUTES

```typescript
// middleware.ts
"/dashboard(.*)",
  "/library(.*)",
  "/home(.*)",
  "/courses/create(.*)",
  "/api/courses/create(.*)",
  "/api/user(.*)",
  "/profile(.*)";
```

## COMMANDS

```bash
npm run dev              # Next + Convex + Stripe listener (concurrent)
npm run dev:next         # Next.js only (Turbopack)
npm run dev:convex       # Convex only
npm run build            # Production build
npm run typecheck        # TypeScript check
npx convex deploy        # Deploy Convex functions
```

## ENV VARS (CRITICAL)

```
NEXT_PUBLIC_CONVEX_URL   # Convex deployment
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET     # User sync webhook
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY           # AI features
ELEVEN_LABS_API_KEY      # TTS
RESEND_API_KEY           # Email
```

## NOTES

- **README is outdated**: Says Prisma/Planetscale, actually uses Convex
- **Schema is massive**: 2000+ lines, 60+ tables
- **Dual dashboard**: `/dashboard/` (learner) vs `/(dashboard)/store/` (creator)
- **Custom domains**: Middleware rewrites to `/{slug}` paths
- **Credits system**: Sample marketplace uses credits, not direct purchase
- **Follow gates**: Free products can require social follows
- **AI features**: `convex/masterAI/` has 18+ files for AI orchestration
