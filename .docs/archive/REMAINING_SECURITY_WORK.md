# 🔒 Remaining Security Work - Option B Implementation

**Current Progress:** 6/15 critical routes secured (40%)  
**Time Remaining:** ~3-4 hours  
**Target:** All critical routes secured before beta

---

## ✅ Completed So Far (2 hours)

### Payment Routes (6/8)
1. ✅ `app/api/courses/create-checkout-session/route.ts`
2. ✅ `app/api/credits/create-checkout-session/route.ts`
3. ✅ `app/api/subscriptions/create-checkout/route.ts`
4. ✅ `app/api/verify-payment/route.ts`
5. ✅ `app/api/courses/payment-success/route.ts`
6. ⏳ `app/api/courses/purchase/route.ts` - IN PROGRESS

### Admin Routes (1/4)
1. ✅ `app/api/admin/generate-course/route.ts`

---

## 🎯 Remaining Critical Routes (9 routes - 2-3 hours)

### A. Payment Routes (2 remaining - 30 min)

**1. `app/api/courses/purchase/route.ts`**
```typescript
// Add at top:
import { requireAuth } from "@/lib/auth-helpers";

// Add in POST handler after try {:
const user = await requireAuth();

// Add validation if has userId:
if (body.userId && body.userId !== user.id) {
  return NextResponse.json({ error: "User mismatch" }, { status: 403 });
}
```

**2. `app/api/courses/sync-to-stripe/route.ts`**
- Same pattern as above
- This route syncs courses to Stripe, needs auth

---

### B. Admin Routes (3 remaining - 45 min)

**1. `app/api/admin/migrate/route.ts`**
```typescript
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(); // Admin only!
    // rest of logic...
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Admin required" }, { status: 403 });
      }
    }
    // rest of error handling...
  }
}
```

**2. `app/api/test-admin-notification/route.ts`**
- Delete this file (it's a test route)
- Or gate with `requireAdmin()`

**3. `app/api/get-test-stores/route.ts`**
- Delete this file (it's a test route)
- Or gate with `requireAdmin()`

---

### C. Stripe Connect Routes (3 routes - 45 min)

**1. `app/api/stripe/connect/create-account/route.ts`**
```typescript
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const { userId } = await request.json();
    
    // Verify user can only create account for themselves
    if (userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }
    
    // rest of logic...
  }
}
```

**2. `app/api/stripe/connect/onboarding-link/route.ts`**
- Same pattern as #1
- User can only get their own onboarding link

**3. `app/api/stripe/connect/account-status/route.ts`**
- Same pattern
- User can only check their own account status

---

### D. Debug/Test Routes (3 routes - 15 min)

**Recommended: DELETE these files**

```bash
rm app/api/debug-tripwire/route.ts
rm app/api/debug-user/route.ts
rm app/api/test-email/route.ts
rm app/api/test-email-config/route.ts
```

Keep if needed for local development but gate:
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: "Not available" }, { status: 404 });
}
```

---

## 🚀 Quick Implementation Script

### Step 1: Secure Remaining Payment Routes (30 min)

```bash
# Add auth to purchase route
code app/api/courses/purchase/route.ts

# Add auth to sync-to-stripe route  
code app/api/courses/sync-to-stripe/route.ts
```

For each file:
1. Add import: `import { requireAuth } from "@/lib/auth-helpers";`
2. Add at start of handler: `const user = await requireAuth();`
3. Add user ID validation if applicable
4. Add error handling for Unauthorized

---

### Step 2: Secure Admin Routes (45 min)

```bash
# Secure migrate route
code app/api/admin/migrate/route.ts

# Delete or secure test routes
rm app/api/test-admin-notification/route.ts
rm app/api/get-test-stores/route.ts
```

For admin routes:
1. Import: `import { requireAdmin } from "@/lib/auth-helpers";`
2. Add: `await requireAdmin();`
3. Add error handling for both 401 and 403

**Don't forget to set admin emails in `.env`:**
```bash
ADMIN_EMAILS=your-email@domain.com
```

---

### Step 3: Secure Stripe Connect Routes (45 min)

```bash
# Secure all 3 Stripe Connect routes
code app/api/stripe/connect/create-account/route.ts
code app/api/stripe/connect/onboarding-link/route.ts
code app/api/stripe/connect/account-status/route.ts
```

For each:
1. Add `requireAuth()`
2. Verify userId matches authenticated user
3. Add proper error handling

---

### Step 4: Remove Debug Routes (15 min)

```bash
# Delete test routes (recommended)
rm app/api/debug-tripwire/route.ts
rm app/api/debug-user/route.ts
rm app/api/test-email/route.ts
rm app/api/test-email-config/route.ts

# Or gate them if you want to keep for local dev
```

---

## 🔥 After Completing Above (Next Session)

### Phase 2: Basic Rate Limiting (2-3 hours)

**This requires Upstash setup - can do tomorrow:**

1. **Sign up for Upstash** (5 min)
   - Go to https://upstash.com
   - Create free Redis database
   - Copy REST_URL and REST_TOKEN

2. **Install dependencies** (2 min)
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

3. **Create rate limit helper** (30 min)
   - Use code from `SECURITY_IMPLEMENTATION_GUIDE.md`
   - File: `lib/rate-limit.ts`

4. **Apply to critical routes** (2 hours)
   - Payment routes: strict limit (5/min)
   - Admin routes: strict limit (5/min)
   - Stripe Connect: standard limit (30/min)

---

## ✅ Completion Checklist

### Today (Must Complete)
- [ ] Secure remaining 2 payment routes
- [ ] Secure 3 admin routes
- [ ] Secure 3 Stripe Connect routes
- [ ] Remove/gate debug routes
- [ ] Test all secured routes manually

### Tomorrow (Before Beta Launch)
- [ ] Setup Upstash Redis
- [ ] Create rate limiting helper
- [ ] Apply rate limiting to critical routes
- [ ] Test rate limits
- [ ] Final security review
- [ ] Deploy to production
- [ ] 🚀 BETA LAUNCH!

---

## 🧪 Quick Testing After Implementation

### Test Authentication
```bash
# Should fail with 401
curl -X POST http://localhost:3001/api/courses/purchase \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test Admin Routes
```bash
# Should fail with 403 if not admin
curl -X POST http://localhost:3001/api/admin/migrate \
  -H "Authorization: Bearer $USER_TOKEN"
```

### Test Stripe Connect
```bash
# Should fail if userId doesn't match auth
curl -X POST http://localhost:3001/api/stripe/connect/create-account \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"userId": "different-user"}'
```

---

## 📊 Progress Tracking

**Use this to check progress:**

```bash
# Count unsecured routes
grep -r "export async function POST" app/api --include="*.ts" | \
  grep -v "requireAuth\|requireAdmin\|webhook" | \
  wc -l

# Should be 0 when complete
```

---

## ⏱️ Time Breakdown

| Task | Estimate | Reality |
|------|----------|---------|
| Payment routes (2) | 30 min | TBD |
| Admin routes (3) | 45 min | TBD |
| Stripe Connect (3) | 45 min | TBD |
| Debug routes (4) | 15 min | TBD |
| Testing | 30 min | TBD |
| **TOTAL** | **2.5-3h** | **TBD** |

---

## 🎯 Success Criteria

**Before marking complete:**
✅ All 15 critical routes secured  
✅ Manual testing passes  
✅ No security warnings in code  
✅ Debug routes removed/gated  
✅ `.env` documented with ADMIN_EMAILS  

**After rate limiting (tomorrow):**
✅ Upstash configured  
✅ Rate limits applied  
✅ Rate limit testing passes  
✅ Ready for beta launch  

---

## 💡 Tips for Fast Implementation

1. **Use VS Code multi-cursor** - Edit similar files simultaneously
2. **Copy-paste the pattern** - Don't retype auth code each time
3. **Test in batches** - Secure 3 routes, then test all 3
4. **Use search/replace** - Find all `export async function POST` without auth
5. **Keep guide open** - Reference `SECURITY_IMPLEMENTATION_GUIDE.md`

---

## 🚨 Don't Forget

- [ ] Add `ADMIN_EMAILS` to `.env.local`
- [ ] Add `ADMIN_EMAILS` to `.env.example`
- [ ] Test each secured route
- [ ] Commit changes with good messages
- [ ] Update `SECURITY_PROGRESS_SUMMARY.md` when done

---

**Status:** 40% complete  
**Next:** Secure remaining 9 routes  
**Time needed:** 2-3 hours  
**Then:** Rate limiting tomorrow → Beta launch! 🚀

