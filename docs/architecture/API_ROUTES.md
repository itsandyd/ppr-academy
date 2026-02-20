# API Routes Reference

> **Last Updated:** 2026-02-19
> **Pass:** 2 — Updated with cheat sheet pack & reference PDF routes

---

## Table of Contents

- [1. Admin](#1-admin)
- [2. AI](#2-ai)
- [3. Analytics](#3-analytics)
- [4. Audio](#4-audio)
- [5. Auth](#5-auth)
- [6. Beats](#6-beats)
- [7. Bundles](#7-bundles)
- [8. Coaching](#8-coaching)
- [9. Courses](#9-courses)
- [10. Credits](#10-credits)
- [11. Creator Plans](#11-creator-plans)
- [12. Cron Jobs](#12-cron-jobs)
- [13. Follow Gates](#13-follow-gates)
- [14. Content Generation](#14-content-generation)
- [15. Lead Magnets](#15-lead-magnets)
- [16. Memberships](#16-memberships)
- [17. Mixing Services](#17-mixing-services)
- [18. Mux (Video)](#18-mux-video)
- [19. Payouts](#19-payouts)
- [20. PPR Pro](#20-ppr-pro)
- [21. Pre-saves](#21-pre-saves)
- [22. Products](#22-products)
- [23. Social Media](#23-social-media)
- [24. Stripe Connect](#24-stripe-connect)
- [25. Submissions](#25-submissions)
- [26. Subscriptions](#26-subscriptions)
- [27. Tips](#27-tips)
- [28. User Sync](#28-user-sync)
- [29. Unsubscribe](#29-unsubscribe)
- [30. Webhooks](#30-webhooks)
- [31. Miscellaneous](#31-miscellaneous)

**Total API Routes: 85** (+1: publish-cheat-sheet-pack)

---

## 1. Admin

### POST `/api/admin/generate-course`
- **Auth:** `requireAdmin()`
- **Purpose:** AI-powered course generation from admin panel
- **Request body:** Course generation parameters (topic, structure)
- **Called by:** `/admin/course-builder` page

### POST `/api/admin/migrate`
- **Auth:** `requireAdmin()`
- **Purpose:** Run marketplace data migrations
- **Called by:** `/admin/migrate-stores`, `/admin/migrate-customers`

## 2. AI

### POST `/api/ai/chat`
- **Auth:** `auth()` (Clerk)
- **Purpose:** AI chat streaming endpoint (Master AI assistant)
- **Request body:** `{ messages, conversationId }`
- **Response:** Server-sent events (streaming)
- **Called by:** `/ai` chat interface

### POST `/api/ai/course-builder`
- **Auth:** `auth()` (Clerk)
- **Purpose:** AI course builder streaming endpoint
- **Request body:** `{ prompt, outline }`
- **Response:** Server-sent events (streaming)
- **Called by:** Course builder components

## 3. Analytics

### POST `/api/analytics/track`
- **Auth:** `auth()` (Clerk)
- **Rate limit:** Generous (100 req/min)
- **Purpose:** Track user events (page views, interactions)
- **Request body:** `{ event, properties }`
- **Called by:** Analytics tracking hooks throughout the app

## 4. Audio

### GET `/api/audio/[filename]`
- **Auth:** None (public)
- **Purpose:** Serve audio files by filename
- **Called by:** Audio players, sample browsers

## 5. Auth

### GET `/api/auth/discord/callback`
- **Auth:** None (OAuth callback)
- **Purpose:** Handle Discord OAuth callback after user authorization
- **Called by:** Discord OAuth flow redirect

## 6. Beats

### GET `/api/beats/contract`
- **Auth:** `requireAuth()`
- **Purpose:** Generate and serve beat license contract PDF
- **Query params:** `{ purchaseId, licenseId }`
- **Response:** PDF file stream
- **Called by:** Beat purchase confirmation, download pages

### POST `/api/beats/create-checkout-session`
- **Auth:** `requireAuth()`
- **Purpose:** Create Stripe Checkout session for beat lease purchase
- **Request body:** `{ beatId, tierType, price }`
- **Response:** `{ sessionId, url }`
- **Called by:** Beat license picker on marketplace

### GET `/api/beats/download`
- **Auth:** `requireAuth()`
- **Purpose:** Download purchased beat files (tier-specific: MP3, WAV, stems, trackouts)
- **Query params:** `{ purchaseId, fileType }`
- **Called by:** Downloads page, purchase confirmation

## 7. Bundles

### POST `/api/bundles/create-checkout-session`
- **Auth:** `requireAuth()`
- **Purpose:** Create Stripe Checkout session for bundle purchase
- **Request body:** `{ bundleId }`
- **Response:** `{ sessionId, url }`
- **Called by:** Bundle detail pages

## 8. Coaching

### POST `/api/coaching/create-checkout-session`
- **Auth:** `requireAuth()`
- **Purpose:** Create Stripe Checkout session for coaching session booking
- **Request body:** `{ productId, sessionDate, duration }`
- **Response:** `{ sessionId, url }`
- **Called by:** Coaching product pages

## 9. Courses

### GET `/api/courses/by-slug/[slug]`
- **Auth:** None (public)
- **Purpose:** Get course details by URL slug
- **Response:** Course object with instructor info
- **Called by:** Course detail pages, SEO

### GET `/api/courses/by-user/[userId]`
- **Auth:** None (public)
- **Purpose:** Get all courses by a specific user/instructor
- **Response:** Array of course objects
- **Called by:** Creator store pages

### POST `/api/courses/create-checkout-session`
- **Auth:** `requireAuth()`
- **Purpose:** Create Stripe Checkout session for course purchase
- **Request body:** `{ courseId, price }`
- **Response:** `{ sessionId, url }`
- **Called by:** Course checkout page

### POST `/api/courses/generate-cheat-sheet-pack`
- **Auth:** `requireAuth()`
- **maxDuration:** 300s
- **Rate limit:** Standard
- **Purpose:** Generate AI cheat sheet pack from course content (one sheet per module)
- **Model:** Claude 3.5 Haiku (via OpenRouter), configurable
- **Request body:** `{ courseId, modelId? }`
- **Response:** `{ success, packId }` (with per-module PDF generation)
- **Pipeline:** Fetches course modules/chapters → LLM generates structured JSON per module → `enforceCheatSheetLimits()` trims to constraints → `@react-pdf/renderer` renders PDF → uploads to Convex storage
- **Constraints:** Max 4 sections, max 6 items/section, max 3 subItems/item, item text < 100 chars
- **Called by:** `CheatSheetPackDialog` component on course dashboard

### POST `/api/courses/generate-reference-pdf`
- **Auth:** `requireAuth()`
- **maxDuration:** 300s
- **Rate limit:** Standard
- **Purpose:** Generate AI reference guide PDF from course modules (full course summary)
- **Model:** Claude 3.5 Haiku (via OpenRouter), configurable
- **Request body:** `{ courseId, modelId? }`
- **Response:** `{ success, pdfUrl, storageId }`
- **Pipeline:** Fetches course modules/chapters → LLM generates structured JSON per module → `@react-pdf/renderer` renders single multi-page PDF → uploads to Convex storage → persists via `referenceGuides.updateReferencePdfInfo`
- **Called by:** Course management dashboard

### POST `/api/courses/publish-cheat-sheet-pack`
- **Auth:** `requireAuth()`
- **Rate limit:** Standard
- **Purpose:** Publish a generated cheat sheet pack as a sellable/free digital product
- **Request body:** `{ packId, pricing?, price?, followGateEnabled?, title?, description?, thumbnailUrl?, includeSheetIds? }`
- **Response:** `{ success, productId }`
- **Pricing modes:** `free` (price=0), `paid` (custom price), `lead-magnet` (follow gate enabled)
- **Called by:** `CheatSheetPackDialog` publish flow

### POST `/api/courses/payment-success`
- **Auth:** `requireAuth()`
- **Purpose:** Handle post-payment course enrollment
- **Request body:** `{ sessionId, courseId }`
- **Called by:** Success page after Stripe checkout

### POST `/api/courses/publish-cheat-sheet-pack`
- **Auth:** `requireAuth()`
- **Purpose:** Publish a generated cheat sheet pack
- **Request body:** `{ packId }`
- **Called by:** Cheat sheet management

### POST `/api/courses/purchase`
- **Auth:** `requireAuth()`
- **Purpose:** Direct course purchase (non-Stripe flow)
- **Request body:** `{ courseId }`
- **Called by:** Free course enrollment

### POST `/api/courses/send-enrollment-email`
- **Auth:** `requireAuth()`
- **Purpose:** Send enrollment confirmation email to student
- **Request body:** `{ courseId, userId }`
- **Called by:** Post-enrollment flow

### POST `/api/courses/sync-to-stripe`
- **Auth:** `requireAuth()`
- **Purpose:** Sync course as Stripe product/price
- **Request body:** `{ courseId }`
- **Called by:** Course publishing flow

### POST `/api/courses/verify-session`
- **Auth:** `requireAuth()`
- **Purpose:** Verify Stripe checkout session completion
- **Request body:** `{ sessionId }`
- **Called by:** Success pages

## 10. Credits

### POST `/api/credits/create-checkout-session`
- **Auth:** `requireAuth()`
- **Purpose:** Create Stripe Checkout session for credit package purchase
- **Request body:** `{ packageId, quantity }`
- **Response:** `{ sessionId, url }`
- **Called by:** Credits purchase page

## 11. Creator Plans

### POST `/api/creator-plans/billing-portal`
- **Auth:** `auth()` (Clerk)
- **Purpose:** Generate Stripe Billing Portal URL for creator plan management
- **Response:** `{ url }`
- **Called by:** Creator settings page

### POST `/api/creator-plans/create-checkout`
- **Auth:** `auth()` (Clerk)
- **Purpose:** Create Stripe Checkout for creator plan subscription
- **Request body:** `{ planId, interval }`
- **Response:** `{ sessionId, url }`
- **Called by:** Pricing page

## 12. Cron Jobs

### GET `/api/cron/process-sessions`
- **Auth:** Bearer token (`CRON_SECRET`)
- **Purpose:** Process and clean up expired sessions
- **Called by:** External cron service (Vercel Cron)

## 13. Follow Gates

### GET `/api/follow-gate/instagram`
- **Auth:** None (public)
- **Purpose:** Initiate Instagram OAuth for follow verification
- **Query params:** `{ productId, redirectUrl }`
- **Called by:** Follow gate modal

### GET `/api/follow-gate/instagram/callback`
- **Auth:** None (OAuth callback)
- **Purpose:** Handle Instagram OAuth callback, verify follow status

### GET `/api/follow-gate/spotify/callback`
- **Auth:** None (OAuth callback)
- **Purpose:** Handle Spotify OAuth callback, verify follow status

### GET `/api/follow-gate/tiktok/callback`
- **Auth:** None (OAuth callback)
- **Purpose:** Handle TikTok OAuth callback, verify follow status

### GET `/api/follow-gate/youtube/callback`
- **Auth:** None (OAuth callback)
- **Purpose:** Handle YouTube OAuth callback, verify subscription status

### POST `/api/follow-gate/send-download-email`
- **Auth:** None (public, rate limited)
- **Rate limit:** Strict
- **Purpose:** Send download link email after follow gate completion
- **Request body:** `{ email, name, productId }`
- **Called by:** Follow gate completion flow

*Note: `/api/follow-gate/spotify`, `/api/follow-gate/tiktok`, `/api/follow-gate/youtube` initiation routes also exist.*

## 14. Content Generation

### POST `/api/generate-audio`
- **Auth:** `auth()` (Clerk)
- **Purpose:** Generate audio via ElevenLabs TTS
- **Request body:** `{ text, voiceId }`
- **Response:** Audio file URL
- **Called by:** Chapter audio generation

### Routes that need examination (NEEDS EXPANSION IN PASS 2):
- `POST /api/generate-bio`
- `POST /api/generate-content`
- `POST /api/generate-thumbnail`
- `POST /api/generate-video`
- `GET /api/elevenlabs/voices`
- `GET /api/illustrations/[courseId]`

## 15. Lead Magnets

### POST `/api/lead-magnets/generate-pdf`
- **Auth:** `requireAuth()`
- **Purpose:** Generate PDF lead magnet from template
- **Request body:** `{ template, content }`
- **Response:** `{ pdfUrl }`
- **Called by:** Lead magnet creation flow

## 16. Memberships

### POST `/api/memberships/create-checkout-session`
- **Auth:** `requireAuth()`
- **Purpose:** Create Stripe Checkout for membership subscription
- **Request body:** `{ tierId, interval }`
- **Response:** `{ sessionId, url }`
- **Called by:** Membership pages

### POST `/api/memberships/verify-session`
- **Auth:** `requireAuth()`
- **Purpose:** Verify membership checkout session
- **Request body:** `{ sessionId }`

## 17. Mixing Services

### POST `/api/mixing-service/create-checkout-session`
- **Auth:** Required
- **Purpose:** Create Stripe Checkout for mixing/mastering service order
- **Request body:** `{ productId, options }`
- **Response:** `{ sessionId, url }`

## 18. Mux (Video)

### POST `/api/mux/upload`
- **Auth:** `requireAuth()`
- **Purpose:** Create Mux direct upload URL for video content
- **Response:** `{ uploadUrl, uploadId }`
- **Called by:** Chapter video upload components

### POST `/api/mux/webhook`
- **Auth:** Mux signature verification
- **Purpose:** Handle Mux video processing events (asset ready, error, etc.)
- **Called by:** Mux platform (webhook)

## 19. Payouts

### POST `/api/payouts/request`
- **Auth:** Required
- **Purpose:** Request creator payout via Stripe Connect
- **NEEDS EXPANSION IN PASS 2**

## 20. PPR Pro

### POST `/api/ppr-pro/billing-portal`
- **Auth:** `auth()` (Clerk)
- **Purpose:** Generate Stripe Billing Portal for PPR Pro management
- **Response:** `{ url }`
- **Called by:** Settings page, PPR Pro management

### POST `/api/ppr-pro/create-checkout-session`
- **Auth:** Required
- **Purpose:** Create Stripe Checkout for PPR Pro subscription
- **Request body:** `{ planId, interval }`
- **Response:** `{ sessionId, url }`
- **Called by:** Pricing page, upsell components

## 21. Pre-saves

### Routes for music release pre-save campaigns:

- `POST /api/presave/apple-music/add` — Add to Apple Music library
- `POST /api/presave/apple-music/token` — Get Apple Music token
- `GET /api/presave/spotify/authorize` — Initiate Spotify OAuth for pre-save
- `GET /api/presave/spotify/callback` — Handle Spotify pre-save callback

**NEEDS EXPANSION IN PASS 2**

## 22. Products

### POST `/api/products/create-checkout-session`
- **Auth:** Required
- **Purpose:** Create Stripe Checkout for generic digital product purchase
- **Request body:** `{ productId }`
- **Response:** `{ sessionId, url }`
- **Called by:** Product detail pages

## 23. Social Media

### GET `/api/social/oauth/[platform]`
- **Auth:** `auth()` (Clerk)
- **Purpose:** Initiate OAuth flow for social platform connection
- **Platforms:** TikTok, Twitter/X, Instagram, LinkedIn, YouTube
- **Called by:** Social media settings

### GET `/api/social/oauth/[platform]/callback`
- **Auth:** `auth()` (Clerk)
- **Purpose:** Handle OAuth callback from social platforms
- **Called by:** OAuth redirect

### Routes that need examination:
- `POST /api/social/oauth/[platform]/save-selected`
- `GET /api/social/oauth/[platform]/select-account`

### POST `/api/social/webhooks/[platform]`
- **Auth:** Platform-specific signature verification (TikTok, Twitter, LinkedIn, Instagram)
- **Purpose:** Receive events from social platforms (post performance, mentions, etc.)
- **Called by:** Social platforms (webhook)

## 24. Stripe Connect

### POST `/api/stripe/connect/create-account`
- **Auth:** `requireAuth()`
- **Purpose:** Create Stripe Connected Account for creator payouts
- **Response:** `{ accountId }`
- **Called by:** Payout setup flow

### GET `/api/stripe/connect/account-status`
- **Auth:** Required
- **Purpose:** Check Stripe Connect account verification status
- **Called by:** Payout settings page

### GET `/api/stripe/connect/onboarding-link`
- **Auth:** Required
- **Purpose:** Generate Stripe Connect onboarding link
- **Response:** `{ url }`
- **Called by:** Stripe onboarding flow

## 25. Submissions

### POST `/api/submissions/create-checkout-session`
- **Auth:** Required
- **Purpose:** Create Stripe Checkout for playlist submission payment
- **Request body:** `{ playlistId, trackId }`
- **Response:** `{ sessionId, url }`

## 26. Subscriptions

### POST `/api/subscriptions/create-checkout`
- **Auth:** Required
- **Purpose:** Create Stripe Checkout for creator-specific subscription tier
- **Request body:** `{ tierId, interval }`
- **Response:** `{ sessionId, url }`

## 27. Tips

### POST `/api/tips/create-checkout-session`
- **Auth:** Required
- **Purpose:** Create Stripe Checkout for tip/donation
- **Request body:** `{ creatorId, amount }`
- **Response:** `{ sessionId, url }`

## 28. User Sync

### GET `/api/sync-user`
- **Auth:** `auth()` (Clerk)
- **Purpose:** Sync authenticated Clerk user to Convex users table
- **Called by:** Post-login flow

## 29. Unsubscribe

### POST `/api/unsubscribe`
- **Auth:** None (public)
- **Purpose:** Process email unsubscribe requests
- **Request body:** `{ token }` or `{ email }`
- **Called by:** Unsubscribe links in emails, `/unsubscribe/[token]` page

## 30. Webhooks

### POST `/api/webhooks/clerk`
- **Auth:** Svix signature verification
- **Purpose:** Sync Clerk user events to Convex (user.created, user.updated, user.deleted)
- **Called by:** Clerk platform

### POST `/api/webhooks/resend`
- **Auth:** HMAC crypto verification
- **Purpose:** Process email delivery events (delivered, bounced, complained, opened, clicked)
- **Called by:** Resend platform

### POST `/api/webhooks/resend/inbox`
- **Auth:** Required
- **Purpose:** Handle incoming email replies
- **NEEDS EXPANSION IN PASS 2**

### POST `/api/webhooks/stripe`
- **Auth:** Stripe signature verification
- **Purpose:** Handle Stripe payment events (checkout.session.completed, charge.succeeded, subscription lifecycle, etc.)
- **Called by:** Stripe platform

### POST `/api/instagram-webhook`
- **Auth:** Instagram signature verification
- **Purpose:** Handle Instagram DM and comment events for automation
- **Called by:** Instagram Graph API

## 31. Miscellaneous

### GET `/api/chapters/[chapterId]`
- **NEEDS EXPANSION IN PASS 2**

### POST `/api/chapters/[chapterId]/generate-audio`
- **Purpose:** Generate audio for a specific chapter
- **NEEDS EXPANSION IN PASS 2**

### GET `/api/course-drafts/[storeId]`
- **Purpose:** Get course drafts for a store
- **NEEDS EXPANSION IN PASS 2**

### POST `/api/course-drafts/[storeId]/publish`
- **Purpose:** Publish a course draft
- **NEEDS EXPANSION IN PASS 2**

### GET `/api/github/commits`
- **Purpose:** Fetch GitHub commits for changelog
- **NEEDS EXPANSION IN PASS 2**

### GET `/api/lead-magnet-analysis/[id]`
- **Purpose:** Get AI analysis of lead magnet effectiveness
- **NEEDS EXPANSION IN PASS 2**

### POST `/api/test-audio-generation`
- **Purpose:** Test audio generation endpoint (debug)
- **NEEDS EXPANSION IN PASS 2**

### POST `/api/uploadthing`
- **Purpose:** UploadThing file upload handler
- **NEEDS EXPANSION IN PASS 2**

### POST `/api/verify-payment`
- **Purpose:** Verify generic payment completion
- **NEEDS EXPANSION IN PASS 2**

---

## Convex HTTP Endpoints

In addition to Next.js API routes, Convex exposes HTTP endpoints:

### GET/POST `/webhooks/instagram`
- **Purpose:** Instagram webhook verification (GET) and event processing (POST)
- **Defined in:** `convex/http.ts`

### POST `/drains/analytics`
- **Purpose:** Vercel Web Analytics event ingestion
- **Defined in:** `convex/http.ts`

### POST `/admin/update-campaign-content`
- **Purpose:** Admin campaign content updates
- **Defined in:** `convex/http.ts`

---

## Rate Limiting Tiers

| Tier | Limit | Applied To |
|------|-------|-----------|
| **Strict** | 5 req/min | Admin operations, payment sessions |
| **Standard** | 30 req/min | Data mutations, CPU-intensive operations |
| **Generous** | 100 req/min | Analytics tracking, read operations |

---

*NEEDS EXPANSION IN PASS 2: Complete request/response types for all routes, error response formats, which routes are called by which components (complete mapping), rate limit configuration per route, route middleware chain details.*
