# Courses System

> **Last Updated:** 2026-02-19
> **Pass:** 3 — Updated with cheat sheet pack system, reference PDF enhancements, PDF template library
> **Key Files:** `convex/courses.ts`, `convex/courseProgress.ts`, `convex/courseAccess.ts`, `convex/courseDrip.ts`, `convex/courseReviews.ts`, `convex/certificates.ts`, `convex/courseNotifications.ts`, `convex/cheatSheetPacks.ts`, `convex/cheatSheetMutations.ts`, `convex/referenceGuides.ts`, `lib/pdf-templates/`, `lib/cheat-sheet-limits.ts`

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Data Hierarchy](#2-data-hierarchy)
- [3. Course Lifecycle](#3-course-lifecycle)
- [4. Database Schema](#4-database-schema)
- [5. Backend Functions](#5-backend-functions)
- [6. Access Control System](#6-access-control-system)
- [7. Progress Tracking](#7-progress-tracking)
- [8. Drip Content System](#8-drip-content-system)
- [9. Certificate System](#9-certificate-system)
- [10. Reviews & Ratings](#10-reviews--ratings)
- [11. Course Notifications](#11-course-notifications)
- [12. Cheat Sheets & Reference PDFs](#12-cheat-sheets--reference-pdfs)
- [13. Course Creation Flow](#13-course-creation-flow)
- [14. Course Consumption (Student View)](#14-course-consumption-student-view)
- [15. Search & Discovery](#15-search--discovery)
- [16. Pricing Models](#16-pricing-models)
- [17. Follow Gate System](#17-follow-gate-system)
- [18. Technical Debt](#18-technical-debt)
- [19. Security Patterns](#19-security-patterns)

---

## 1. System Overview

The Courses system is the primary learning platform, supporting a complete lifecycle from creation to certification. It handles multi-format content delivery (video via Mux, audio via ElevenLabs, rich text), progress tracking, drip scheduling, and a layered access control system supporting 8 access types.

**Core architecture:**
- 3-level content hierarchy: Course → Modules → Lessons → Chapters
- Real-time progress tracking with milestone notifications
- Automatic certificate issuance at 100% completion
- Teachable-style drip content with 3 scheduling modes
- Layered access: creator > PPR Pro > purchase > bundle > membership > follow gate

---

## 2. Data Hierarchy

```
Course
├── Metadata (title, description, price, category, tags, skillLevel)
├── Follow Gate Config (platform requirements, social links)
├── Stripe Sync (stripeProductId, stripePriceId)
├── Reference PDF (referencePdfStorageId, referencePdfUrl)
│
├── Module 1 (position-ordered, drip config per module)
│   ├── Lesson 1 (position-ordered)
│   │   ├── Chapter 1 (content, Mux video, generated audio)
│   │   ├── Chapter 2
│   │   └── Chapter 3
│   └── Lesson 2
│       └── ...
├── Module 2
│   └── ...
└── Module N
```

Each level has `position` for ordering. Cascading delete is supported (deleting a course removes all descendants).

---

## 3. Course Lifecycle

```
CREATE → EDIT → PUBLISH → ENROLL → LEARN → COMPLETE → CERTIFY
  │        │       │         │        │        │          │
  │    Add modules  Toggle   Purchase Mark     100%    Auto-issue
  │    Add lessons  isPubl.  or gate  chapters complete certificate
  │    Add chapters          complete progress
  │    Upload video
  │    Config drip
  │    Sync Stripe
```

### Key State Transitions

| State | Field | Trigger |
|-------|-------|---------|
| Draft | `isPublished: false` | Default on creation |
| Published | `isPublished: true` | `togglePublished` mutation |
| Enrolled | Purchase record exists | Checkout completion or follow gate |
| In Progress | `userProgress` records | `markChapterComplete` |
| Completed | 100% chapters done | Automatic calculation |
| Certified | `certificates` record | Auto-issued at 100% |
| Soft Deleted | `deletedAt` set | `deleteCourse` mutation |

---

## 4. Database Schema

### `courses` — Main Course Table

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Creator's Clerk ID |
| instructorId | string? | Delegated instructor |
| storeId | string? | Associated store |
| title | string | Course title |
| description | string? | Course description |
| imageUrl | string? | Cover image |
| price | number? | Price in dollars |
| isPublished | boolean? | Publication status |
| slug | string? | URL slug (unique) |
| category | string? | Top-level: daw, business, genre |
| subcategory | string? | Specific: Ableton Live, Email Marketing |
| tags | string[]? | 2-5 search tags |
| skillLevel | string? | Beginner/Intermediate/Advanced |
| checkoutHeadline | string? | Marketing copy for checkout |
| checkoutDescription | string? | Extended checkout copy |
| followGateEnabled | boolean? | Social gate active |
| followGateRequirements | object? | Platform requirements |
| followGateSteps | array? | Ordered follow sequence |
| followGateSocialLinks | object? | Creator social URLs |
| stripeProductId | string? | Synced Stripe product |
| stripePriceId | string? | Synced Stripe price |
| referencePdfStorageId | string? | AI-generated reference PDF |
| referencePdfUrl | string? | Reference PDF URL |
| isPinned | boolean? | Pinned in storefront |
| deletedAt | number? | Soft delete timestamp |

**Indexes:** `by_instructorId`, `by_slug`, `by_userId`, `by_storeId`, `by_published`, `by_category`, `by_category_subcategory`

### `courseModules` — Drip-Configurable Modules

| Field | Type | Description |
|-------|------|-------------|
| title | string | Module title |
| position | number | Sort order |
| courseId | string | Parent course |
| dripEnabled | boolean? | Drip scheduling active |
| dripType | enum? | "days_after_enrollment" \| "specific_date" \| "after_previous" |
| dripDaysAfterEnrollment | number? | Days delay |
| dripSpecificDate | number? | Specific unlock date |
| dripNotifyStudents | boolean? | Email on unlock |

### `courseChapters` — Content with Media

| Field | Type | Description |
|-------|------|-------------|
| title | string | Chapter title |
| description | string? | Rich text content |
| courseId | string | Parent course |
| lessonId | string? | Parent lesson |
| position | number | Sort order |
| isPublished | boolean? | Publication status |
| isFree | boolean? | Free preview chapter |
| muxAssetId | string? | Mux video asset |
| muxPlaybackId | string? | Mux playback ID |
| muxAssetStatus | enum? | "waiting" \| "preparing" \| "ready" \| "errored" |
| videoDuration | number? | Duration in seconds |
| generatedAudioUrl | string? | AI-generated audio |
| audioGenerationStatus | enum? | "pending" \| "generating" \| "completed" \| "failed" |

### `enrollments`

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Student Clerk ID |
| courseId | string | Course document ID |
| progress | number? | Progress percentage |

### `userProgress` — Granular Chapter Progress

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Student Clerk ID |
| courseId | id("courses")? | Course reference |
| chapterId | string | Chapter being tracked |
| isCompleted | boolean? | Completion flag |
| completedAt | number? | Completion timestamp |
| timeSpent | number? | Seconds spent |

**Indexes:** `by_user_chapter`, `by_user_course`, `by_user_completed`, `by_course_completed`, `by_user_course_completed`

### `courseDripAccess` — Drip Unlock Tracking

| Field | Type | Description |
|-------|------|-------------|
| userId, courseId, moduleId | string | Composite key |
| isUnlocked | boolean | Current unlock status |
| scheduledUnlockAt | number? | When module unlocks |
| manuallyUnlocked | boolean? | Instructor override |
| unlockNotificationSent | boolean? | Notification tracking |
| enrolledAt | number | Enrollment timestamp |

### `certificates` — Completion Certificates

| Field | Type | Description |
|-------|------|-------------|
| userId, courseId | string | Student + course |
| certificateId | string | Format: CERT-{timestamp36}-{random} |
| verificationCode | string | Format: ABC-123-XYZ (excludes I,O,1,0) |
| completionPercentage | number | Should be 100% |
| timeSpent | number? | Total learning time |
| isValid | boolean | Revocable |
| pdfStorageId | string? | Client-generated PDF |
| verificationCount | number | Times verified |

---

## 5. Backend Functions

### convex/courses.ts — Core CRUD

**Queries:**

| Function | Purpose |
|----------|---------|
| `getCourseBySlug(slug)` | Public course page |
| `getCourseForEdit(courseId, userId)` | Full hierarchy for editor |
| `getCoursesByStore(storeId)` | Creator dashboard (auth required) |
| `getPublishedCoursesByStore(storeId)` | Storefront display |
| `getAllPublishedCourses()` | Marketplace with enrollment counts |
| `getCourseWithInstructor(courseId)` | Course + instructor bio/rating/student count |
| `getCourseChaptersEnriched(courseId)` | Chapters with module/lesson hierarchy |

**Mutations:**

| Function | Purpose |
|----------|---------|
| `createCourseWithData(userId, storeId, data)` | Full wizard creation with modules |
| `updateCourseWithModules(courseId, courseData, modules)` | Bulk update course + hierarchy |
| `createOrUpdateChapter(courseId, lessonId, chapterData)` | Auto-save chapter (used in dialog) |
| `togglePublished(courseId, userId)` | Publish/unpublish with first-publish tracking |
| `deleteCourse(courseId, userId)` | Cascade delete all descendants |

**Actions:**

| Function | Purpose |
|----------|---------|
| `syncCourseToStripe(courseId)` | Create/sync Stripe product + price |

### convex/courseProgress.ts — Progress & Certificates

```typescript
// Main progress tracking — triggers certificates and nudges
markChapterComplete(courseId, chapterId, moduleId?, lessonId?, timeSpent?)
→ Returns: { progressId, courseComplete, completionPercentage, certificateIssued }

// Conversion nudges triggered at:
// - 25% completion: share progress
// - 50% completion: share progress
// - 75% completion: share progress
// - 100% completion: certificate + creator nudge (if not creator)
```

### convex/courseAccess.ts — Access Control

```typescript
// Primary access check — returns specific access type
canAccessChapter(userId?, courseId, chapterId)
→ Returns: { hasAccess, accessType, reason?, requiresFollowGate? }

// Access types checked in order:
// 1. Free chapters (isFree === true)
// 2. Creator/instructor
// 3. PPR Pro subscriber
// 4. Direct purchase
// 5. Bundle purchase
// 6. Creator membership
// 7. Follow gate completion
```

---

## 6. Access Control System

### Access Type Hierarchy

| Priority | Type | Check Method |
|----------|------|-------------|
| 1 | `free_preview` | `chapter.isFree === true` |
| 2 | `creator` | `course.userId === identity.subject` |
| 3 | `admin` | User has admin flag |
| 4 | `ppr_pro` | Active pprProSubscriptions record |
| 5 | `purchased` | Completed purchase in purchases table |
| 6 | `bundle` | Bundle containing course is purchased |
| 7 | `membership` | Active creator subscription with course access |
| 8 | `follow_gate` | Zero-amount purchase from follow gate |
| — | `no_access` | None of the above |

### Bundle Access Check

```typescript
// Finds all active bundles containing courseId
// Checks if user has purchased any matching bundle
async checkBundleAccess(ctx, userId, courseId) {
  const bundles = await ctx.db.query("bundles")
    .filter(q => q.eq(q.field("isActive"), true))
    .collect();
  const bundlesWithCourse = bundles.filter(b => b.courseIds?.includes(courseId));
  // Check purchases for each bundle...
}
```

### Membership Access Check

```typescript
// Checks userCreatorSubscriptions + contentAccess rules
async checkMembershipCourseAccess(ctx, userId, course) {
  const subscription = await ctx.db.query("userCreatorSubscriptions")
    .withIndex("by_user_creator", q => q.eq("userId", userId).eq("creatorId", course.userId))
    .filter(q => q.eq(q.field("status"), "active"))
    .first();
  // Then verify tier allows this course via contentAccess table
}
```

---

## 7. Progress Tracking

### How Progress is Calculated

```typescript
// Only counts published chapters
const totalChapters = allChapters.filter(c => c.isPublished).length;
const completedChapters = completedRecords.length;
const completionPercentage = Math.round((completedChapters / totalChapters) * 100);
```

### Implicit Enrollment

The system does NOT use explicit enrollment records for all cases. Instead:
- **Paid courses:** Purchase record acts as enrollment
- **Free (follow gate):** Zero-amount purchase record
- **Bundles:** Bundle purchase grants access
- **Subscriptions:** Subscription record grants access
- **Progress tracking:** First `markChapterComplete` creates implicit enrollment

### Time Tracking

- `timeSpent` accumulated per chapter via `updateChapterTimeSpent`
- Total time computed by summing all userProgress records for course
- Stored in certificate on completion

---

## 8. Drip Content System

### Three Scheduling Modes

| Mode | Behavior |
|------|----------|
| `days_after_enrollment` | Module unlocks X days after student enrolls |
| `specific_date` | Module unlocks on exact date/time |
| `after_previous` | Module unlocks when previous module completed |

### Processing Pipeline

```
Student enrolls
     ↓
initializeDripAccess(userId, courseId)
     ↓ Calculates scheduledUnlockAt for each drip module
     ↓ First module always unlocked immediately

Cron: processPendingDripUnlocks (every 15 min)
     ↓ Finds records: isUnlocked=false AND scheduledUnlockAt <= now
     ↓ Sets isUnlocked=true, unlockedAt=now
     ↓ Sends notification if dripNotifyStudents=true
```

### Instructor Overrides

```typescript
manuallyUnlockModule(userId, moduleId, reason?)  // Unlock one module
grantFullAccess(userId, courseId, reason?)         // Unlock all modules
restoreDripSchedule(userId, courseId)              // Remove overrides, recalculate
```

---

## 9. Certificate System

### Automatic Issuance

Triggered by `markChapterComplete` when `completionPercentage === 100`:

```typescript
checkAndIssueCertificate(userId, courseId, totalChapters, completedChapters, totalTimeSpent)
→ Creates certificate with:
   - certificateId: CERT-{timestamp_base36}-{random}
   - verificationCode: ABC-DEF-GHI (uses ABCDEFGHJKLMNPQRSTUVWXYZ23456789)
   - Sends in-app notification
   - Triggers email workflow
```

### Verification

```typescript
verifyCertificate(certificateId, verifierIp?, verifierUserAgent?)
→ Logs attempt in certificateVerifications table
→ Increments verificationCount
→ Returns: { isValid, certificate: { userName, courseTitle, completionDate } }
```

### PDF Generation

- Generated client-side (browser canvas/HTML)
- Uploaded to Convex storage
- URL stored via `updateCertificatePdf(certificateId, pdfStorageId)`

---

## 10. Reviews & Ratings

### Review System (`convex/courseReviews.ts`)

```typescript
createReview(courseId, userId, rating, title?, reviewText)
// Validates: 1-5 rating, enrollment required, no duplicates
// Sets isVerifiedPurchase=true if enrolled

getCourseReviews(courseId, limit?, sortBy?)
→ Returns: { reviews, totalCount, averageRating, ratingDistribution: { five, four, three, two, one } }

addInstructorResponse(reviewId, instructorId, response)
// Only course creator can respond
```

### Moderation

- Reviews auto-published (no queue)
- 3+ reports auto-hides review (`isPublished = false`)
- Self-voting prevented on `markReviewHelpful`

---

## 11. Course Notifications

### AI-Powered Update Notifications (`convex/courseNotifications.ts`)

```typescript
generateNotificationCopy(courseId, userId, changes)
// Uses GPT-4o to generate natural update notification
// Avoids marketing jargon, excessive emojis, fake urgency
// Returns: { title, message, emailSubject, emailPreview }

sendCourseUpdateEmails(courseId, studentIds, emailSubject, emailBody, courseSlug)
// Respects notificationPreferences.courseUpdates
// Uses Resend API with PPR Academy branded HTML template
```

---

## 12. Cheat Sheets & Reference PDFs

### PDF Template Library (`lib/pdf-templates/`)

Both cheat sheets and reference PDFs use a shared PDF generation system built on `@react-pdf/renderer`:

```
lib/pdf-templates/
├── ReferenceGuidePDF.tsx    # React-PDF document component
├── components.tsx           # Shared PDF components (sections, items, TOC)
├── styles.ts               # PausePlayRepeat brand system + StyleSheet
└── render.tsx              # renderReferenceGuidePDF() — data in, PDF buffer out
```

**Brand colors:** Primary `#6366F1` (indigo), accent `#EC4899` (pink), text `#1A1A2E`

### Reference Guide PDF

- AI-generated summary of entire course (one multi-page PDF)
- **Model:** Claude 3.5 Haiku via OpenRouter (configurable, was previously OpenAI gpt-4o-mini)
- **API route:** `POST /api/courses/generate-reference-pdf` (maxDuration: 300s)
- **Pipeline:** Fetch modules/chapters → LLM generates structured JSON per module → `@react-pdf/renderer` renders single PDF → upload to Convex storage → persist via `convex/referenceGuides.updateReferencePdfInfo`
- Stored in course record: `referencePdfUrl`, `referencePdfStorageId`, `referencePdfGeneratedAt`
- Section types: `key_takeaways`, `quick_reference`, `step_by_step`, `tips`, `comparison`, `glossary`, `custom`
- Requirements: 3-6 sections/module, 3-8 items/section, preserve exact technical values

### Cheat Sheet Packs

Full course-wide cheat sheet generation system — produces one focused 1-2 page PDF per module.

#### Generation Pipeline

```
POST /api/courses/generate-cheat-sheet-pack
     ↓
Create pack: cheatSheetPacks.createPack(courseId, totalModules)
     ↓
For each module:
  1. Fetch module chapters content
  2. LLM generates structured JSON (Claude 3.5 Haiku)
  3. enforceCheatSheetLimits() trims to constraints
  4. Save cheat sheet: cheatSheetMutations.saveCheatSheet()
  5. Render PDF: renderReferenceGuidePDF()
  6. Upload PDF to Convex storage
  7. Update cheatSheetMutations.updatePdfInfo()
  8. Link to pack: cheatSheetPacks.addSheetToPack()
     ↓
cheatSheetPacks.completePackGeneration()
→ Status: "complete" | "partial" (some modules failed)
```

#### Hard Constraints (`lib/cheat-sheet-limits.ts`)

| Constraint | Limit |
|-----------|-------|
| Sections per module | Max 4 |
| Items per section | Max 6 |
| SubItems per item | Max 3 |
| Item text length | Max 100 chars |
| SubItem text length | Max 80 chars |
| Total items across all sections | Target 20-25, hard cap 30 |

Priority-based trimming when over limits: `quick_reference` (4) > `step_by_step` (3) > `comparison` (2) > `tips` (1) > `key_takeaways` (0) > `glossary` (-1)

#### Publishing Flow

```
POST /api/courses/publish-cheat-sheet-pack
     ↓
cheatSheetPacks.publishPackAsProduct(packId, storeId, pricing, ...)
     ↓
Creates digitalProducts entry (productCategory: "cheat-sheet")
     ↓
Links product back to pack + updates each sheet status → "published"
```

**Pricing modes:** Free (price=0), Paid (custom price), Lead magnet (follow gate enabled)

#### Student View

- `CourseCheatSheets` component on course lesson page
- Queries `cheatSheetPacks.getPacksForEnrolledCourse`
- Shows list of per-module PDFs with individual download buttons + "Download All"

#### Convex Functions

**`convex/cheatSheetPacks.ts`:**

| Function | Purpose |
|----------|---------|
| `createPack` | Initialize pack with status "generating" |
| `addSheetToPack` | Link completed sheet to pack, increment counter |
| `markPackFailed` | Record a failed module name |
| `completePackGeneration` | Set final status (complete/partial) |
| `publishPackAsProduct` | Create digitalProduct + link to pack |
| `deletePack` | Delete pack and all child sheets |
| `getPacksForEnrolledCourse` | Student-facing: get pack with sheet PDFs |

**`convex/cheatSheetMutations.ts`:**

| Function | Purpose |
|----------|---------|
| `listCheatSheets` | List all sheets by userId |
| `getCheatSheet` | Get single sheet by ID |
| `getCheatSheetsByCourse` | List sheets for a course |
| `saveCheatSheet` | Create or update sheet with outline |
| `updateOutline` | Update just the outline structure |
| `updatePdfInfo` | Store PDF storage ID + URL, set status "generated" |
| `publishAsLeadMagnet` | Single sheet → digitalProduct (follow gate) |

**`convex/referenceGuides.ts`:**

| Function | Purpose |
|----------|---------|
| `updateReferencePdfInfo` | Persist reference PDF storage ID, URL, and generation timestamp to course record |

---

## 13. Course Creation Flow

### Step-Based Wizard (`app/dashboard/create/course/page.tsx`)

| Step | Component | Conditional |
|------|-----------|-------------|
| Course Info | Title, description, content structure | Always |
| Pricing Model | Free with gate OR Paid | Always |
| Checkout Config | Payment method setup | If paid |
| Download Gate | Follow requirements | If free with gate |
| Advanced Options | Notifications, features, drip | Always |

**Context management** via React context persists form data across steps. Steps dynamically adjust based on pricing model selection.

---

## 14. Course Consumption (Student View)

### Chapter Player (`app/courses/[slug]/lessons/[lessonId]/chapters/[chapterId]/page.tsx`)

**Features:**
- Mux video player with streaming
- Rich text chapter content display
- Timestamped notes (jump to video position)
- Q&A chat (CourseQAChat component)
- Previous/next chapter navigation
- Course outline sidebar
- Progress indicator + live viewer count
- Mark complete button → triggers progress tracking

**Access control:** Verified per-request via `courseAccess.canAccessChapter`

---

## 15. Search & Discovery

### Marketplace Filtering

- **Category:** Top-level (daw, business, genre) → subcategory
- **Skill level:** Beginner/Intermediate/Advanced
- **Price:** Free/Paid
- **Rating:** From courseReviews
- **Ordering:** Pinned courses first (`isPinned`, `pinnedAt`), then by rating/enrollment

### Key Indexes Used

- `by_category`, `by_category_subcategory` — hierarchical filtering
- `by_published` — only show published
- `by_slug` — URL lookup

---

## 16. Pricing Models

| Model | Configuration | Access Method |
|-------|--------------|---------------|
| Free | `price: 0`, `followGateEnabled: false` | Open access |
| Free with Gate | `price: 0`, `followGateEnabled: true` | Follow gate completion |
| Paid | `price: > 0` | Direct Stripe purchase |
| Bundled | Course in `bundles` product | Bundle purchase |
| Membership | Creator subscription tier | Active membership |
| PPR Pro | Platform subscription | Active PPR Pro |

---

## 17. Follow Gate System

### Configuration

```typescript
followGateRequirements: {
  requireEmail?: boolean,
  requireInstagram?: boolean,
  requireTiktok?: boolean,
  requireYoutube?: boolean,
  requireSpotify?: boolean,
  minFollowsRequired?: number
}

followGateSteps: [{
  platform: "email" | "instagram" | "tiktok" | "youtube" | "spotify" | ...,
  url?: string,
  mandatory: boolean,
  order: number
}]
```

### Completion Flow

```
completeFollowGate(userId, courseId, email, completedRequirements)
→ Validates all mandatory requirements met
→ Creates zero-amount purchase record (status: "completed")
→ Purchase record grants access via courseAccess check
```

**Note:** Uses purchases table with `amount: 0` rather than a dedicated table. Comment in code: "POST-LAUNCH: Consider dedicated courseFollowGateSubmissions table"

---

## 18. Technical Debt

### Critical

| Issue | Location | Impact |
|-------|----------|--------|
| Circular type inference workaround | `courses.ts:7-9` | `require("./_generated/api")` instead of import |
| `v.any()` return types | Multiple queries | Bypasses type safety |
| Chapter ID matching complexity | Chapter player `page.tsx:67-91` | Multiple fallback attempts indicate ID scheme inconsistencies |

### Medium

| Issue | Location | Impact |
|-------|----------|--------|
| Follow gate uses purchases table | `courseAccess.ts` | Should have dedicated table |
| Quiz system unused | Schema defined, no integration | Dead code |
| Drip unlock notifications placeholder | `courseDrip.ts` | "POST-LAUNCH" comment, emails not sending |
| Certificate PDF client-side only | `certificates.ts` | Ties generation to browser |

### Low

| Issue | Description |
|-------|-------------|
| `cleanupDuplicateChapters` utility | Suggests duplicates occurred during development |
| Module completion for "after_previous" drip | Simplified implementation, needs real chapter completion check |
| No course recommendations integration | System exists but not wired to discovery |

---

## 19. Security Patterns

### Authentication & Authorization

```typescript
// All mutations require auth
const identity = await requireAuth(ctx);

// Owner verification on all writes
if (course.userId !== identity.subject) {
  throw new Error("Unauthorized: you don't own this course");
}

// Store owner verification
await requireStoreOwner(ctx, storeId);
```

### Data Isolation

- Progress data scoped by `userId` index
- Reviews unique per `userId + courseId`
- Certificates unique per `userId + courseId` (by_user_and_course index)
- Drip access scoped to `userId + courseId + moduleId`

---

*Updated in Pass 3: Full cheat sheet pack system documented (generation pipeline, constraints, publishing flow, student view). Reference PDF system updated (Claude 3.5 Haiku model, @react-pdf/renderer, dedicated referenceGuides module, PausePlayRepeat branding). PDF template library documented.*

*NEEDS EXPANSION IN PASS 4: Quiz system implementation plan, course recommendations algorithm, course analytics dashboard queries, video processing pipeline details, WYSIWYG editor (TipTap) configuration, mobile responsiveness assessment.*
