# Architecture Decisions

## 2026-02-14: Removed legacy Stripe webhook route (`stripe-library`)

**Route removed:** `app/api/webhooks/stripe-library/route.ts` (107 lines)

**Why:** The legacy route only handled `checkout.session.completed` for course purchases. The primary webhook at `app/api/webhooks/stripe/route.ts` already handles the same event and product type (lines 291-338), calling the same `api.library.createCourseEnrollment` mutation. Having both routes registered in Stripe would cause duplicate enrollment and purchase records on every course checkout.

**What changed:**
- Deleted `app/api/webhooks/stripe-library/route.ts` and its directory
- Updated `package.json` dev scripts to point Stripe CLI listener at `/api/webhooks/stripe` instead of `/api/webhooks/stripe-library`
- Updated references in AUDIT.md, CODEBASE_OVERVIEW.md, FEATURE_GAP_ANALYSIS.md, LAUNCH_READINESS_AUDIT.md, POLISH_ROADMAP.md, and internal docs

**Env vars to clean up:**
- No separate `STRIPE_LIBRARY_WEBHOOK_SECRET` was used (the legacy route shared `STRIPE_WEBHOOK_SECRET`)
- If a separate webhook endpoint was registered in the Stripe dashboard for the `/api/webhooks/stripe-library` path, it should be removed from the Stripe dashboard

**Risk:** None. The primary webhook fully covers all functionality the legacy route provided.

## 2026-02-14: Removed all @ts-nocheck directives (9 files)

**Problem:** 9 files had `// @ts-nocheck` disabling TypeScript checking entirely. All were added to work around Convex's "Type instantiation is excessively deep" error (TS2589), not because of actual type errors in the code.

**Root cause:** The Convex API type (`api` from `@/convex/_generated/api`) triggers deep type recursion when the API surface is large (90+ modules). This is a known Convex limitation.

**Fix approach:** Targeted type assertions instead of blanket `@ts-nocheck`:
- `lib/convex-api.ts`: Changed from `@ts-nocheck` re-export to `import ... as any` pattern. Files importing from `@/lib/convex-api` now get `any`-typed API objects, avoiding deep instantiation.
- API routes (`beats/download`, `beats/contract`, `lead-magnets/generate-pdf`): Already had `as any` casts on individual Convex calls. Removing `@ts-nocheck` exposed no new errors.
- Convex backend files (`cheatSheetMutations.ts`, `cheatSheetGenerator.ts`): No errors after removing `@ts-nocheck` — the deep instantiation only affects the full `api` type, not individual `mutation`/`query`/`action` wrappers.
- Client pages (`app/page.tsx`, admin pages): Import from `@/lib/convex-api` (now typed as `any`) or use `@/convex/_generated/api` directly without hitting the recursion limit.

**Real type error found and fixed:**
- `app/admin/lead-magnets/cheat-sheets/page.tsx`: `OutlineSection.type` was `string` but Convex mutation expected a union of literal types. Fixed by adding `SectionType` union type and casting `Select` component's `onValueChange` value.
- Same file: `Object.entries` return type `[string, unknown][]` didn't match destructured `[string, any[]]`. Fixed by explicitly typing the `chaptersByModule` variable.

**Files fixed (all @ts-nocheck removed):**
| File | Risk | Outcome |
|------|------|---------|
| `lib/convex-api.ts` | HIGH (shared lib) | Re-export with `as any` cast |
| `app/page.tsx` | HIGH (landing page) | Clean removal, no errors |
| `app/api/beats/download/route.ts` | HIGH (payment) | Clean removal, no errors |
| `app/api/beats/contract/route.ts` | HIGH (payment) | Clean removal, no errors |
| `app/api/lead-magnets/generate-pdf/route.ts` | MEDIUM | Clean removal, no errors |
| `convex/cheatSheetMutations.ts` | MEDIUM | Clean removal, no errors |
| `convex/masterAI/cheatSheetGenerator.ts` | MEDIUM | Clean removal, no errors |
| `app/admin/embeddings/page.tsx` | LOW (admin) | Clean removal, no errors |
| `app/admin/lead-magnets/cheat-sheets/page.tsx` | LOW (admin) | Fixed 2 real type errors |

**Type assertions used as temporary workarounds:**
- `lib/convex-api.ts`: `_api as any` / `_internal as any` — necessary to avoid deep instantiation
- `app/admin/lead-magnets/cheat-sheets/page.tsx`: `v as SectionType` — safe cast from Select component, values come from a known constant array

**Verification:** `npm run build` succeeds, `npm run test` passes (31/31 tests).

## 2026-02-14: Zero-Auth Convex Mutations - Authorization Added (23 functions)

**Problem:** 23 Convex mutations/queries had zero authentication. Anyone with the Convex deployment URL could call these functions directly to delete campaigns, modify creator plans, leak email addresses, or create fake purchase records.

**Auth helpers used:** `requireAuth(ctx)` and `requireStoreOwner(ctx, storeId)` from `convex/lib/auth.ts`.

### emailCampaigns.ts (8 functions fixed)

| Function | Auth Added | Ownership Check |
|----------|-----------|----------------|
| `updateCampaign` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `addRecipients` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `duplicateAllRecipients` | `requireAuth` | `requireStoreOwner` via target campaign's storeId |
| `removeRecipients` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `getCampaignRecipients` | `requireAuth` | `requireStoreOwner` via campaign's storeId (was leaking emails) |
| `updateCampaignStatus` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `deleteCampaign` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `getCampaign` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `updateResendCampaignContent` | `requireAuth` | Admin role check (operates on admin-level `resendCampaigns` table) |

**Note:** Internal email sending (`emails.ts`) uses `internal.emailQueries.updateCampaignStatus` (an `internalMutation`), not the public version. No breaking change.

### marketingCampaigns.ts (8 functions fixed)

| Function | Auth Added | Ownership Check |
|----------|-----------|----------------|
| `getCampaign` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `updateCampaign` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `updatePlatformContent` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `schedulePlatform` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `updatePlatformStatus` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `deleteCampaign` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `duplicateCampaign` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `updateAnalytics` | `requireAuth` | `requireStoreOwner` via campaign's storeId |
| `listAdminCampaigns` | `requireAuth` | Admin role check (was returning admin data without auth) |

### creatorPlans.ts (4 functions fixed)

These already had admin checks using `args.clerkId`, but the clerkId came from client-supplied arguments. An attacker could pass any clerkId. Fixed to use `ctx.auth.getUserIdentity().subject` via `requireAuth()`.

| Function | Change |
|----------|--------|
| `setEarlyAccessExpiration` | Now uses `identity.subject` instead of `args.clerkId` for admin check |
| `sunsetAllEarlyAccess` | Now uses `identity.subject` instead of `args.clerkId` for admin check |
| `adminSetStorePlan` | Now uses `identity.subject` instead of `args.clerkId` for admin check |
| `extendEarlyAccess` | Now uses `identity.subject` instead of `args.clerkId` for admin check |

### beatLeases.ts (2 functions fixed)

| Function | Change |
|----------|--------|
| `createBeatLicensePurchase` | Converted from `mutation` to `internalMutation` (only called from Stripe webhook) |
| `markContractGenerated` | Added `requireAuth` + user ownership check (`license.userId === identity.subject`) |

**Stripe webhook update:** `app/api/webhooks/stripe/route.ts` updated to call `internalBeatLease.beatLeases.createBeatLicensePurchase` instead of `apiBeatLease.beatLeases.createBeatLicensePurchase`.

### digitalProducts.ts (1 function fixed)

| Function | Change |
|----------|--------|
| `backfillProductSlugs` | Added `requireAuth` + admin role check (migration/maintenance function) |

**Verification:** `npx convex codegen` succeeds. No type errors introduced in modified files. Pre-existing type errors in `emailContacts.ts` and `fanCountAggregation.ts` (unrelated) remain.
