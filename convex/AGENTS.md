# CONVEX BACKEND KNOWLEDGE

Backend logic for PPR Academy. Real-time database, queries, mutations, actions.

## STRUCTURE

```
convex/
├── schema.ts              # Database schema (2000+ lines, 60+ tables)
├── masterAI/              # AI orchestration (18 files)
│   ├── index.ts           # Main coordinator
│   ├── llmClient.ts       # OpenAI wrapper
│   ├── retriever.ts       # RAG retrieval
│   └── {agent}.ts         # Specialized agents
├── _generated/            # Auto-generated (DO NOT EDIT)
├── {domain}.ts            # Domain-specific functions
└── {domain}Schema.ts      # Modular schema definitions
```

## WHERE TO LOOK

| Task                      | File          | Pattern                            |
| ------------------------- | ------------- | ---------------------------------- |
| Add table                 | `schema.ts`   | `defineTable({...}).index()`       |
| Add query                 | `{domain}.ts` | `export const x = query({...})`    |
| Add mutation              | `{domain}.ts` | `export const x = mutation({...})` |
| Add action (external API) | `{domain}.ts` | `export const x = action({...})`   |
| AI feature                | `masterAI/`   | Orchestrated agents                |
| Webhooks                  | `http.ts`     | `httpRouter()`                     |
| Scheduled jobs            | `crons.ts`    | `cronJobs()`                       |

## KEY TABLES

| Table                            | Purpose             | Key Indexes                          |
| -------------------------------- | ------------------- | ------------------------------------ |
| `users`                          | User profiles       | `by_clerkId`, `by_email`             |
| `courses`                        | Course content      | `by_userId`, `by_slug`, `by_storeId` |
| `courseModules/Lessons/Chapters` | Content hierarchy   | `by_courseId`, `by_position`         |
| `stores`                         | Creator storefronts | `by_userId`, `by_slug`               |
| `digitalProducts`                | Products for sale   | `by_storeId`, `by_userId`            |
| `purchases`                      | Transaction records | `by_userId`, `by_courseId`           |
| `audioSamples`                   | Sample marketplace  | `by_genre`, `by_category`            |
| `userCredits`                    | Credit balances     | `by_userId`                          |

## CONVENTIONS

### Function Types

```typescript
// Public functions (exposed to client)
import { query, mutation, action } from "./_generated/server";

// Internal functions (server-only)
import { internalQuery, internalMutation, internalAction } from "./_generated/server";
```

### Validator Patterns

```typescript
// ALWAYS include args + returns validators
export const myFunc = query({
  args: { id: v.id("courses") },
  returns: v.object({...}),
  handler: async (ctx, args) => {...},
});

// Null return = v.null()
returns: v.null(),
```

### Database Access

```typescript
// Queries/Mutations: Direct DB access
const doc = await ctx.db.get(args.id);
const list = await ctx.db
  .query("table")
  .withIndex("by_x", (q) => q.eq("x", val))
  .collect();

// Actions: NO direct DB access
const data = await ctx.runQuery(internal.file.queryFunc, { args });
await ctx.runMutation(internal.file.mutateFunc, { args });
```

## ANTI-PATTERNS

| Pattern                    | Why Bad                 | Fix                     |
| -------------------------- | ----------------------- | ----------------------- |
| `.filter()` in queries     | Full table scan         | `.withIndex()`          |
| `ctx.db` in actions        | Actions can't access DB | `ctx.runQuery/Mutation` |
| `v.bigint()`               | Deprecated              | `v.int64()`             |
| Missing return validator   | Type safety             | Add `returns: v.xxx()`  |
| `filter` after `collect()` | Memory inefficient      | Filter in query         |

## MASTERAI AGENTS

| Agent         | File               | Purpose               |
| ------------- | ------------------ | --------------------- |
| Coordinator   | `index.ts`         | Orchestrates workflow |
| Planner       | `planner.ts`       | Task planning         |
| Retriever     | `retriever.ts`     | RAG context fetch     |
| Critic        | `critic.ts`        | Output review         |
| FinalWriter   | `finalWriter.ts`   | Content generation    |
| WebResearch   | `webResearch.ts`   | External research     |
| MemoryManager | `memoryManager.ts` | Conversation memory   |

## CRON JOBS

Defined in `crons.ts`. Use `internal` references:

```typescript
crons.interval("job-name", { hours: 2 }, internal.crons.jobFunc, {});
```

## HTTP ENDPOINTS

Defined in `http.ts` for webhooks:

```typescript
http.route({
  path: "/webhook/stripe",
  method: "POST",
  handler: httpAction(async (ctx, req) => {...}),
});
```

## INDEX NAMING

Always include all fields: `by_field1_and_field2`

```typescript
.index("by_userId_and_status", ["userId", "status"])
```
