# PPR Academy Critical Fixes - Ralph Loop

## Mission
Fix the 8 critical launch blockers identified in LAUNCH_READINESS_AUDIT.md. Work through each phase sequentially, verifying each fix before moving on.

## Phase 1: Payment & Revenue (Highest Priority)

### 1.1 Stripe Connect Account ID
- File: `app/courses/[slug]/checkout/components/StripePaymentForm.tsx:56`
- Fix: Pass `stripeAccountId` from store data to the payment form
- Verify: Check that the connected account ID is included in Stripe payment intent creation

### 1.2 Post-Purchase Webhook Emails
- Files: `app/api/webhooks/stripe/route.ts` (legacy `stripe-library` route removed), `app/api/courses/payment-success/route.ts:56`
- Fix: Implement Resend email sending for purchase confirmations
- Verify: Trace the code path to confirm email function is called after successful payment

## Phase 2: Lead & Data Capture

### 2.1 Lead Capture Saving
- File: `app/[slug]/page.tsx:319-325`
- Fix: Replace simulated API call with actual Convex mutation to save leads
- Check: Verify `convex/contacts.ts` has appropriate mutation, create if missing
- Verify: Trace that form submission calls the mutation with email and storeId

### 2.2 Payment Verification Endpoint
- File: `app/courses/[slug]/success/page.tsx:30`
- Fix: Verify `/api/verify-payment` exists and returns proper data structure
- If missing: Create the endpoint in `app/api/verify-payment/route.ts`
- Verify: Check response matches what success page expects

## Phase 3: Creator Experience

### 3.1 Digital Product Draft Save
- File: `app/dashboard/create/digital/page.tsx:152`
- Fix: Implement `saveDraft` mutation in Convex and call it from the form
- Verify: Test that draft data persists when navigating away

### 3.2 Dashboard Real Data
- File: `app/(dashboard)/home/page-enhanced.tsx:13, 60`
- Fix: Replace mock data with actual Convex queries
- Verify: Ensure queries exist and return expected shape

### 3.3 Chapter Audio (can stub if complex)
- File: `app/dashboard/create/course/components/ChapterDialog.tsx:470`
- Fix: Either integrate real audio generation OR show proper "coming soon" state
- Do NOT leave placeholder URL that pretends to work

## Phase 4: Production Cleanup

### 4.1 Remove Debug Statements
- Files: See audit for list
- Fix: Remove console.log statements OR wrap with `process.env.NODE_ENV === 'development'`
- Verify: Run `grep -r "console.log" app/ components/` and confirm cleanup

### 4.2 Remove Debug UI
- File: `app/[slug]/page.tsx:1571-1573`
- Fix: Remove "Debug: No URL found" message, show proper error state
- Verify: Check the user-facing behavior is clean

## Completion Criteria

All phases complete when:
1. Each file listed has been modified with the fix applied
2. No TypeScript errors: `npm run typecheck` passes
3. Build succeeds: `npm run build` passes
4. No remaining TODO comments in the specific lines referenced above

## Output Format

After each phase, report:
```
PHASE X COMPLETE
- Fixed: [list files modified]
- Verified: [verification method and result]
```

When ALL phases complete:
<promise>LAUNCH_BLOCKERS_FIXED</promise>
