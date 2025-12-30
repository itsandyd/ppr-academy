# HOOKS KNOWLEDGE

Custom React hooks for PPR Academy. Client-side utilities.

## FILES

| Hook                       | Purpose           | Key Features                                     |
| -------------------------- | ----------------- | ------------------------------------------------ |
| `useAnalytics.ts`          | Event tracking    | Convex mutation, batched events, 30+ event types |
| `useAuth.ts`               | Auth wrapper      | Clerk integration, user state                    |
| `useStoreId.ts`            | Store context     | Extract storeId from URL params                  |
| `use-products.ts`          | Product data      | Product fetching, caching                        |
| `use-coaching-products.ts` | Coaching products | Specialized coaching queries                     |
| `use-feature-access.tsx`   | Feature flags     | Plan-based access control                        |
| `use-mobile.tsx`           | Responsive        | Mobile breakpoint detection                      |
| `use-toast.ts`             | Notifications     | Toast API wrapper                                |
| `useDiscordAutoSync.ts`    | Discord           | Role sync automation                             |

## PATTERNS

### Analytics Hook

```typescript
import { useAnalytics } from "@/hooks/useAnalytics";

const { trackEvent } = useAnalytics();

trackEvent({
  eventType: "page_view",
  resourceType: "course",
  resourceId: courseId,
  metadata: { page: "/courses" },
});
```

Event types include: `page_view`, `purchase`, `video_play`, `lesson_complete`, `creator_started`, `email_opened`, etc.

### Store ID Hook

```typescript
import { useStoreId } from "@/hooks/useStoreId";

const storeId = useStoreId(); // From URL params
```

### Feature Access

```typescript
import { useFeatureAccess } from "@/hooks/use-feature-access";

const { hasAccess, isLoading } = useFeatureAccess("premium_feature");
```

## CONVENTIONS

- All hooks must start with `use`
- Keep hooks focused on single responsibility
- Prefer Convex hooks (`useQuery`, `useMutation`) over custom fetch logic
- Export from individual files, no barrel exports
