# Ralph Loop: PPR Academy Launch Fixes

## Completion Criteria

The loop is COMPLETE when ALL of the following are true:
1. Lead capture form saves to database (calls submitLead mutation)
2. Post-purchase confirmation emails send for courses and digital products
3. Stripe Connect account ID is passed to payment forms
4. Dashboard shows real data instead of mock data
5. Console.log statements reduced to < 50 in production code (excluding convex/_generated, node_modules, scripts/, tests/)
6. Admin role checking is implemented in lib/auth-helpers.ts
7. Course and thumbnail file uploads work
8. Digital product draft save is implemented
9. All changes pass `npm run typecheck` and `npm run build`

When complete, output: "RALPH_COMPLETE: All launch blockers fixed"

---

## Task Instructions

You are fixing critical launch blockers for PPR Academy. Work through each issue systematically, testing as you go.

### Priority 1: Lead Capture (CRITICAL)

**File**: `app/[slug]/page.tsx`
**Issue**: The email capture/lead magnet form doesn't save leads to the database
**Fix**:
- Find the TODO around line 319-325 about submitting to Convex
- Import and call the existing `api.leadSubmissions.submitLead` mutation
- The mutation already exists in `convex/leadSubmissions.ts` and works correctly
- Pass: name, email, productId, storeId, adminUserId, source

### Priority 2: Post-Purchase Emails (CRITICAL)

**Files**:
- `app/api/webhooks/stripe-library/route.ts` (lines 65-66)
- `app/api/courses/payment-success/route.ts` (line 56)

**Issue**: Customers don't receive confirmation emails after purchase
**Fix**:
- Look at how emails are sent in `convex/leadSubmissions.ts` as a reference
- Use the email templates in `emails/templates/` directory
- For courses: send enrollment confirmation with course details
- For products: send purchase confirmation with download link
- Use Resend via the existing email infrastructure in `lib/email.ts` or schedule via Convex

### Priority 3: Stripe Connect Account ID (CRITICAL)

**File**: `app/courses/[slug]/checkout/components/StripePaymentForm.tsx` (line 56)
**Issue**: Creator's Stripe Connect account ID not passed to payment form
**Fix**:
- The store data should have `stripeConnectAccountId`
- Pass it through to the Stripe payment intent creation
- Check `convex/stores.ts` for how store data includes this field

### Priority 4: Dashboard Real Data (CRITICAL)

**File**: `app/(dashboard)/home/page-enhanced.tsx` (lines 13, 60)
**Issue**: Dashboard shows mock data instead of real metrics
**Fix**:
- Replace mock data with actual Convex queries
- Use existing queries from `convex/analytics.ts` or `convex/courses.ts`
- Connect enrollment counts, revenue, etc. to real data

### Priority 5: Console.log Cleanup (IMPORTANT)

**Target**: Reduce from 1,383 to < 50 in production code
**Approach**:
1. Focus on these high-count files first:
   - `convex/aiCourseBuilder.ts` (63)
   - `convex/webhooks/instagram.ts` (47)
   - `convex/masterAI/index.ts` (45)
   - `app/api/webhooks/stripe/route.ts` (41)
   - `components/create-course-form.tsx` (36)
2. Either remove console.log or wrap critical ones with:
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     console.log(...)
   }
   ```
3. Keep error logging (console.error) for production debugging
4. Skip files in: convex/_generated/, node_modules/, scripts/, tests/

### Priority 6: Admin Role Checking (IMPORTANT)

**File**: `lib/auth-helpers.ts` (line 84)
**Issue**: `// TODO: Add actual admin role checking`
**Fix**:
- Implement proper admin role verification
- Check user's role from Clerk metadata or Convex users table
- The user schema in `convex/schema.ts` has a `role` field

### Priority 7: File Uploads (IMPORTANT)

**Files**:
- `app/dashboard/create/course/steps/CourseContentForm.tsx` (line 312)
- `app/dashboard/create/course/steps/ThumbnailForm.tsx` (lines 193, 210)

**Issue**: Course file and thumbnail uploads have TODO placeholders
**Fix**:
- Use UploadThing which is already integrated (see `app/api/uploadthing/core.ts`)
- Look at how other file uploads work in the codebase (FileUploader component)
- Connect the upload result to form state

### Priority 8: Digital Product Draft Save (IMPORTANT)

**File**: `app/dashboard/create/digital/page.tsx` (line 152)
**Issue**: `// TODO: Implement save draft mutation`
**Fix**:
- Create or use existing draft save mutation in `convex/digitalProducts.ts`
- Save form state to database with status: "draft"
- Allow resuming from draft

---

## Verification Steps

After each fix:
1. Run `npm run typecheck` - must pass
2. Run `npm run build` - must pass
3. Test the specific flow if possible

After all fixes:
1. Verify lead capture saves (check Convex dashboard)
2. Verify emails send (check Resend dashboard or logs)
3. Run full build: `npm run build`

---

## Do NOT:
- Create new files unless absolutely necessary
- Add new dependencies
- Refactor unrelated code
- Add features beyond what's needed to fix the blockers
- Skip the typecheck/build verification

## DO:
- Read existing code patterns before implementing
- Use existing utilities and patterns in the codebase
- Keep changes minimal and focused
- Mark each task complete as you finish it
- Output progress after each major fix
