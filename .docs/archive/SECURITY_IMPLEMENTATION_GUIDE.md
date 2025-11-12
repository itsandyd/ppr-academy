# 🔒 Security Implementation Guide - Complete All Fixes

**Status:** ⚡ IN PROGRESS  
**Completed:** 4/30 routes secured  
**Remaining:** ~8-10 hours of work

---

## ✅ What's Been Done (30 minutes)

### 1. Auth Helpers Created ✅
**File:** `lib/auth-helpers.ts`

Utilities available:
- `requireAuth()` - Require authentication, throws on failure
- `requireAdmin()` - Require admin authentication
- `withAuth()` - Middleware wrapper for protected routes
- `withAdmin()` - Middleware wrapper for admin routes

### 2. Routes Secured ✅

**Payment Routes (3/8):**
- ✅ `app/api/courses/create-checkout-session/route.ts`
- ✅ `app/api/credits/create-checkout-session/route.ts`
- ✅ `app/api/subscriptions/create-checkout/route.ts`

**Admin Routes (1/4):**
- ✅ `app/api/admin/generate-course/route.ts`

---

## 📋 Step-by-Step Implementation Plan

### PHASE 1: Complete Authentication (4-5 hours)

#### A. Remaining Payment Routes (5 routes - 1.5 hours)

**Routes to Secure:**
1. `app/api/verify-payment/route.ts`
2. `app/api/courses/payment-success/route.ts`
3. `app/api/courses/purchase/route.ts`
4. `app/api/courses/sync-to-stripe/route.ts`
5. `app/api/courses/by-user/[userId]/route.ts`

**Pattern to Apply:**
```typescript
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    // Add this at the start
    const user = await requireAuth();
    
    const body = await request.json();
    
    // If route has userId parameter, verify it matches
    if (body.userId && body.userId !== user.id) {
      return NextResponse.json(
        { error: "User mismatch" },
        { status: 403 }
      );
    }
    
    // Rest of existing logic...
    
  } catch (error) {
    // Add auth error handling
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }
    // Rest of existing error handling...
  }
}
```

---

#### B. Admin Routes (3 routes - 45 minutes)

**Routes to Secure:**
1. `app/api/admin/migrate/route.ts`
2. `app/api/test-admin-notification/route.ts`
3. `app/api/get-test-stores/route.ts`

**Pattern to Apply:**
```typescript
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    // Admin routes use requireAdmin instead of requireAuth
    await requireAdmin();
    
    // Rest of existing logic...
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { error: "Unauthorized. Please sign in." },
          { status: 401 }
        );
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json(
          { error: "Forbidden. Admin access required." },
          { status: 403 }
        );
      }
    }
    // Rest of error handling...
  }
}
```

**Note:** Add admin emails to `.env`:
```bash
ADMIN_EMAILS=your-email@domain.com,admin2@domain.com
```

---

#### C. Stripe Connect Routes (3 routes - 45 minutes)

**Routes to Secure:**
1. `app/api/stripe/connect/create-account/route.ts`
2. `app/api/stripe/connect/onboarding-link/route.ts`
3. `app/api/stripe/connect/account-status/route.ts`

**Same pattern as payment routes** - use `requireAuth()`

---

#### D. Social Media Routes (2 routes - 30 minutes)

**Routes to Secure:**
1. `app/api/social/oauth/[platform]/callback/route.ts`
2. `app/api/social/webhooks/[platform]/route.ts`

**Note:** Callback route should already have OAuth verification.  
Webhook route doesn't need auth (verified by platform signature).

---

#### E. AI Generation Routes (3 routes - 45 minutes)

**Routes to Secure:**
1. `app/api/generate-audio/route.ts`
2. `app/api/generate-video/route.ts`
3. `app/api/generate-thumbnail/route.ts`

**Pattern:** Use `requireAuth()` - users should only generate content for their own courses.

---

### PHASE 2: Rate Limiting (4-6 hours)

#### Step 1: Setup Upstash Redis (30 minutes)

1. **Create Upstash Account:**
   ```
   https://upstash.com/
   ```

2. **Create Redis Database:**
   - Click "Create Database"
   - Choose region closest to your users
   - Copy REST URL and TOKEN

3. **Add to `.env.local`:**
   ```bash
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

4. **Install Dependencies:**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

---

#### Step 2: Create Rate Limiting Utilities (1 hour)

**File:** `lib/rate-limit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Initialize Redis
const redis = Redis.fromEnv();

// Different rate limiters for different routes
export const rateLimiters = {
  // Strict limit for expensive operations
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
    analytics: true,
  }),
  
  // Standard limit for API routes
  standard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
    analytics: true,
  }),
  
  // Generous limit for reads
  generous: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
    analytics: true,
  }),
};

// Rate limit check helper
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit = rateLimiters.standard
) {
  const { success, limit, reset, remaining } = await limiter.limit(identifier);
  
  if (!success) {
    const resetDate = new Date(reset);
    return NextResponse.json(
      {
        error: "Too many requests",
        limit,
        remaining: 0,
        reset: resetDate.toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetDate.toISOString(),
        },
      }
    );
  }
  
  return { success: true, remaining, limit };
}

// Middleware wrapper with rate limiting
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter: Ratelimit = rateLimiters.standard
) {
  return async (request: Request): Promise<Response> => {
    // Use IP or user ID as identifier
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    
    const rateCheck = await checkRateLimit(ip, limiter);
    
    if (rateCheck.success !== true) {
      return rateCheck;
    }
    
    return handler(request);
  };
}
```

---

#### Step 3: Apply Rate Limiting (2-3 hours)

**Pattern for Each Route:**

```typescript
import { requireAuth } from "@/lib/auth-helpers";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // ✅ ADD RATE LIMITING
    const ip = request.headers.get("x-forwarded-for") ?? user.id;
    const rateCheck = await checkRateLimit(ip, rateLimiters.standard);
    
    if (rateCheck.success !== true) {
      return rateCheck; // Returns 429 response
    }
    
    // Rest of route logic...
    
  } catch (error) {
    // Error handling...
  }
}
```

**Rate Limiter Selection:**
- `rateLimiters.strict` - Payment routes, AI generation
- `rateLimiters.standard` - Most API routes
- `rateLimiters.generous` - Read-only routes, analytics

**Routes Requiring Rate Limiting:**
- ✓ All 30+ API routes
- Prioritize payment, AI, and admin routes first

---

### PHASE 3: Input Validation (3-4 hours)

#### Step 1: Install Zod (if not already)

```bash
npm install zod
```

#### Step 2: Create Validation Schemas

**File:** `lib/validation-schemas.ts`

```typescript
import { z } from "zod";

// Course checkout validation
export const courseCheckoutSchema = z.object({
  courseId: z.string().min(1, "Course ID required"),
  courseSlug: z.string().min(1),
  customerEmail: z.string().email("Valid email required"),
  customerName: z.string().min(1, "Name required"),
  coursePrice: z.number().min(0),
  courseTitle: z.string().min(1),
  userId: z.string().min(1),
  stripePriceId: z.string().optional(),
  creatorStripeAccountId: z.string().optional(),
});

// Credit package checkout
export const creditCheckoutSchema = z.object({
  packageId: z.string().min(1),
  packageName: z.string().min(1),
  credits: z.number().int().positive(),
  bonusCredits: z.number().int().nonnegative().optional(),
  priceUsd: z.number().positive(),
  customerEmail: z.string().email(),
  userId: z.string().min(1),
});

// Subscription checkout
export const subscriptionCheckoutSchema = z.object({
  planId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  billingCycle: z.enum(["monthly", "yearly"]),
});

// Add more as needed...
```

#### Step 3: Apply Validation

**Pattern:**

```typescript
import { courseCheckoutSchema } from "@/lib/validation-schemas";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const body = await request.json();
    
    // ✅ ADD INPUT VALIDATION
    const validatedData = courseCheckoutSchema.parse(body);
    
    // Use validatedData instead of body
    const { courseId, customerEmail, ... } = validatedData;
    
    // Rest of logic...
    
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    // Other error handling...
  }
}
```

**Priority Routes for Validation:**
1. All payment/checkout routes
2. Admin routes
3. User data modification routes

---

### PHASE 4: Remove Debug Routes (30 minutes)

#### Option A: Delete Files (Recommended)

Delete these files:
```bash
rm app/api/debug-tripwire/route.ts
rm app/api/debug-user/route.ts
rm app/api/get-test-stores/route.ts
rm app/api/test-admin-notification/route.ts
rm app/api/test-email/route.ts
rm app/api/test-email-config/route.ts
```

#### Option B: Gate Behind Environment Check

```typescript
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }
  
  // Rest of test logic...
}
```

---

### PHASE 5: CORS Configuration (1 hour)

**Update:** `middleware.ts`

```typescript
import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/webhooks/(.*)",
    "/api/auth/(.*)",
    "/(.*)",
  ],
  afterAuth(auth, req) {
    // Add CORS headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      
      const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "*";
      
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
      
      // Handle preflight
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers: response.headers });
      }
      
      return response;
    }
    
    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

---

### PHASE 6: Testing (2 hours)

#### Security Testing Checklist

**Authentication Testing:**
```bash
# Test without auth (should fail)
curl -X POST http://localhost:3001/api/courses/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"courseId": "test"}'

# Expected: 401 Unauthorized
```

**Rate Limiting Testing:**
```bash
# Send multiple requests rapidly
for i in {1..35}; do
  curl -X POST http://localhost:3001/api/analytics/track
done

# Expected: 429 after limit exceeded
```

**Input Validation Testing:**
```bash
# Send invalid data
curl -X POST http://localhost:3001/api/courses/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"courseId": "", "customerEmail": "invalid"}'

# Expected: 400 with validation errors
```

**CORS Testing:**
```bash
# Test from different origin
curl -H "Origin: https://different-domain.com" \
  http://localhost:3001/api/analytics/track

# Expected: Proper CORS headers in response
```

---

## 📊 Progress Tracking

### Quick Status Check

Run this to see which routes still need auth:

```bash
grep -r "export async function POST" app/api --include="*.ts" | \
  grep -v "requireAuth\|requireAdmin\|webhook" | \
  wc -l
```

### Route Inventory

**Total API Routes:** 35  
**Completed:** 4  
**Remaining:** 31

**By Category:**
- Payment/Checkout: 3/8 ✅
- Admin: 1/4 ⏳
- Stripe Connect: 0/3 ❌
- Social Media: 0/2 ❌
- AI Generation: 0/3 ❌
- Analytics: 0/1 ❌
- Other: 0/14 ❌

---

## ⏱️ Time Estimates

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1A | Payment routes (5) | 1.5h | 🔴 Critical |
| 1B | Admin routes (3) | 45m | 🔴 Critical |
| 1C | Stripe Connect (3) | 45m | 🔴 Critical |
| 1D | Social routes (2) | 30m | 🟡 Medium |
| 1E | AI routes (3) | 45m | 🟡 Medium |
| 2 | Rate limiting setup | 4-6h | 🔴 Critical |
| 3 | Input validation | 3-4h | 🟡 Medium |
| 4 | Remove debug routes | 30m | 🟡 Medium |
| 5 | CORS config | 1h | 🟡 Medium |
| 6 | Testing | 2h | 🔴 Critical |
| **TOTAL** | **All Tasks** | **14-18h** | |

---

## 🎯 Recommended Order

### Day 1 (6-8 hours)
1. ✅ Complete Phase 1A-C (payment + admin + Stripe Connect)
2. ✅ Setup Upstash + create rate limit utilities
3. ✅ Apply rate limiting to critical routes

### Day 2 (4-6 hours)
4. ✅ Apply rate limiting to remaining routes
5. ✅ Add input validation to payment routes
6. ✅ CORS configuration

### Day 3 (4 hours)
7. ✅ Complete remaining auth routes
8. ✅ Remove debug routes
9. ✅ Comprehensive testing
10. ✅ Deploy to production

---

## 🚨 Critical Reminders

1. **Always test locally first** - Don't deploy untested security changes
2. **Update `.env.example`** - Document new environment variables
3. **Test error scenarios** - Make sure auth/rate limit errors are user-friendly
4. **Monitor after deployment** - Watch for legitimate users being blocked

---

## 📝 Next Steps

**To continue from where we left off:**

1. Complete remaining payment routes (1.5 hours)
2. Finish admin routes (45 minutes)
3. Secure Stripe Connect routes (45 minutes)
4. Setup Upstash Redis (30 minutes)
5. Create rate limiting utilities (1 hour)
6. Apply rate limiting progressively

**Need help?** Refer to the patterns shown above. Every route follows the same basic structure.

---

**Status:** Implementation in progress  
**Completion:** ~10-15% done  
**Estimate to finish:** 10-14 hours

Good luck! 🚀

