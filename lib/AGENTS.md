# LIB KNOWLEDGE

Utilities, types, and helpers for PPR Academy.

## STRUCTURE

```
lib/
├── types.ts              # TypeScript type definitions
├── utils.ts              # General utilities (cn, etc.)
├── convex-data.ts        # Convex data fetching helpers
├── convex-api.ts         # Convex API utilities
├── convex-rag.ts         # RAG/embedding helpers
├── email.ts              # Resend email utilities
├── auth-helpers.ts       # Clerk auth utilities
├── rate-limit.ts         # Upstash rate limiting
├── content-scraper.ts    # YouTube/article scraping
├── ai-course-generator.ts # AI course generation
├── music-url-parser.ts   # Spotify/SoundCloud URL parsing
├── course-categories.ts  # Course taxonomy
├── discord-config.ts     # Discord integration config
├── features.ts           # Feature flags
├── errors.ts             # Custom error classes
├── text-utils.ts         # Text manipulation
├── query-client.ts       # React Query client
├── build-providers.tsx   # Provider composition
└── services/             # External service integrations
```

## KEY FILES

### utils.ts

```typescript
import { cn } from "@/lib/utils"; // Tailwind class merger

// Usage
cn("px-4 py-2", conditional && "bg-blue-500", className);
```

### types.ts

Shared TypeScript types. Import from here, not inline definitions.

### convex-data.ts

Convex query helpers for server components:

```typescript
import { fetchQuery } from "@/lib/convex-data";
```

### auth-helpers.ts

Clerk authentication utilities:

```typescript
import { getCurrentUser } from "@/lib/auth-helpers";
```

## PATTERNS

### Error Handling

```typescript
import { ConvexError } from "@/lib/errors";

throw new ConvexError("User not found", { code: "NOT_FOUND" });
```

### Rate Limiting

```typescript
import { ratelimit } from "@/lib/rate-limit";

const { success } = await ratelimit.limit(identifier);
```

### Email

```typescript
import { sendEmail } from "@/lib/email";

await sendEmail({
  to: "user@example.com",
  subject: "Welcome",
  template: "welcome",
});
```

## ANTI-PATTERNS

| Pattern                     | Fix                          |
| --------------------------- | ---------------------------- |
| Inline type definitions     | Add to `types.ts`            |
| Duplicate utility functions | Add to `utils.ts`            |
| API keys in code            | Use env vars                 |
| Direct fetch to Convex      | Use `convex-data.ts` helpers |
