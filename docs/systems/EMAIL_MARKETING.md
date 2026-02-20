# Email Marketing System

> **Last Updated:** 2026-02-19
> **Pass:** 2 — System Deep Dive
> **Key Files:** `convex/emailWorkflowActions.ts` (1449 lines), `convex/emailSendQueue.ts`, `convex/emailSendQueueActions.ts`, `convex/emailWorkflows.ts`, `convex/emailContacts.ts` (2219 lines), `convex/emailTemplates.ts` (2127 lines), `convex/dripCampaigns.ts`, `convex/courseCycles.ts`, `convex/emailDeliverability.ts`, `convex/emailUnsubscribe.ts`

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Architecture Diagram](#2-architecture-diagram)
- [3. Workflow Execution Engine](#3-workflow-execution-engine)
- [4. Email Send Queue](#4-email-send-queue)
- [5. Email Contacts](#5-email-contacts)
- [6. Email Templates](#6-email-templates)
- [7. Drip Campaigns](#7-drip-campaigns)
- [8. Course Cycles](#8-course-cycles)
- [9. Deliverability & Suppression](#9-deliverability--suppression)
- [10. Unsubscribe Handling](#10-unsubscribe-handling)
- [11. Lead Scoring & Segmentation](#11-lead-scoring--segmentation)
- [12. Analytics](#12-analytics)
- [13. Resend Integration](#13-resend-integration)
- [14. Cron Schedule](#14-cron-schedule)
- [15. CAN-SPAM Compliance](#15-can-spam-compliance)
- [16. Technical Debt](#16-technical-debt)

---

## 1. System Overview

The email marketing system is a production-grade, multi-tenant platform with three automation engines:

1. **Visual Workflows** — Node-based automation with 12 node types and 26 trigger types
2. **Drip Campaigns** — Sequential time-based email sequences
3. **Course Cycles** — Perpetual nurture/pitch rotation through courses

All emails route through a **fair multi-tenant send queue** that ensures no single creator monopolizes sending capacity.

**Provider:** Resend (batch API for high-throughput sending)

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   WORKFLOW TRIGGERS                       │
│ (API, webhook, tag_added, course_enrollment, manual)     │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────────────────┐
        ↓           ↓                       ↓
   Workflow    Drip Campaign          Course Cycle
   Execution   Enrollment            Config + Emails
        │           │                       │
        └───────────┼───────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│     CRON: Workflow Processor (60s)                        │
│                                                          │
│  PHASE 1 [Fast Mutation]        PHASE 2 [Per-Email]      │
│  - Delays                       - Resolve template       │
│  - Conditions                   - Personalize vars       │
│  - Actions (tags)               - Check suppression      │
│  - Goals                        - Enqueue to send queue  │
│  - Cycles                                                │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│     emailSendQueue (Fair Multi-Tenant Queue)             │
│     status: queued → sending → sent/failed               │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│     CRON: Send Queue Processor (30s)                     │
│  - Round-robin per store (200 emails/store/cycle)        │
│  - Batch to Resend API (max 100/batch)                   │
│  - 600ms between batches (~2 req/s)                      │
│  - Exponential backoff on failures                       │
└────────────────────┬─────────────────────────────────────┘
                     ↓
              Resend Batch API
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
        Sent     Delivered   Bounced
          │          │          │
          └──────────┴──────────┘
                     ↓
              Webhook Events → Analytics + Deliverability
```

---

## 3. Workflow Execution Engine

### Two-Phase Processing Model

**Phase 1 — Bulk Advance (Fast Mutation):**
Processes all non-email nodes in a single mutation to minimize OCC conflicts:
- Delay nodes: Set `scheduledFor` timestamp, advance when due
- Condition nodes: Evaluate contact properties, branch yes/no
- Action nodes: Add/remove tags
- Goal nodes: Complete workflow, chain to next
- Course cycle nodes: Select next unpurchased course

**Phase 2 — Email Nodes (Per-Email Actions):**
For each email node:
- Resolve template or custom content
- Personalize with `{{variable}}` interpolation
- Check suppression (unsubscribed, bounced, complained)
- Enqueue to `emailSendQueue`
- Advance to next node

### 12 Node Types

| Node | Purpose |
|------|---------|
| `trigger` | Entry point (pass-through) |
| `email` | Send email (template or custom) |
| `delay` | Schedule next action |
| `condition` | Branch on contact properties |
| `action` | Tag operations (add/remove) |
| `notify` | Send Slack/Discord/email to team |
| `goal` | Complete workflow, chain to next |
| `stop` | Terminate execution |
| `courseCycle` | Select next unpurchased course |
| `courseEmail` | Send nurture/pitch for course cycle |
| `purchaseCheck` | Branch on course purchase status |
| `cycleLoop` | Advance to next course or loop |

### 26 Trigger Types

`lead_signup`, `product_purchase`, `tag_added`, `segment_member`, `manual`, `time_delay`, `date_time`, `customer_action`, `webhook`, `page_visit`, `cart_abandon`, `birthday`, `anniversary`, `custom_event`, `api_call`, `form_submit`, `email_reply`, `all_users`, `all_creators`, `all_learners`, `new_signup`, `user_inactivity`, `any_purchase`, `any_course_complete`, `learner_conversion`

### Execution State Machine

```
createExecution → status: "pending"
     ↓
First node processed → status: "running"
     ↓
Nodes advance sequentially (delay, email, condition...)
     ↓
Goal/Stop node reached → status: "completed"
     ↓ (or)
Error occurs → status: "failed"
     ↓ (or)
Contact unsubscribes → status: "cancelled"
```

---

## 4. Email Send Queue

### Fair Multi-Tenant Design

```typescript
// Per-cycle fairness calculation
const EMAILS_PER_STORE = Math.min(
  200,                                    // Cap per store
  Math.floor(5000 / activeStoreCount)     // Fair share
);

// 5 stores → 200 each = 1000/cycle = 2000/minute
// 50 stores → 100 each = 5000/cycle = 10,000/minute
```

### Queue Processing

```
getActiveStoreIds() → Unique stores with queued emails
     ↓
For each store (round-robin):
  getQueuedEmailIds(storeId, limit=EMAILS_PER_STORE)
  claimBatchForStore(emailIds) → status: "sending"
     ↓
Group claimed emails into Resend batches (max 100/batch)
     ↓
Send batch → 600ms delay → Send next batch
     ↓
markEmailsSent(ids) or markEmailsFailed(ids, error, retry?)
```

### Retry Logic

```typescript
// Exponential backoff: 1s, 4s, 16s + random jitter
const baseDelay = Math.pow(4, attempts - 1) * 1000;
const jitter = Math.random() * 1000;
nextRetryAt = Date.now() + baseDelay + jitter;
// Max 3 attempts per email
```

### Queue Schema

```typescript
emailSendQueue: {
  storeId, source: "workflow" | "drip" | "broadcast" | "transactional"
  toEmail, fromName, fromEmail, subject
  htmlContent, textContent?, replyTo?, headers?
  status: "queued" | "sending" | "sent" | "failed"
  priority: number (default 5, lower = higher)
  attempts, maxAttempts: 3
  queuedAt, sentAt?, lastError?, nextRetryAt?
}
```

---

## 5. Email Contacts

**File:** `convex/emailContacts.ts` (2219 lines)

### Contact Model

```typescript
emailContacts: {
  storeId, email (lowercase, indexed)
  firstName?, lastName?
  status: "subscribed" | "unsubscribed" | "bounced" | "complained"
  source: "import" | "customer" | "course_enrollment" | ...
  tagIds: Id<"emailTags">[]
  emailsSent, emailsOpened, emailsClicked
  customFields?: any
  subscribedAt, unsubscribedAt?
}
```

### Key Operations

| Function | Purpose |
|----------|---------|
| `importContacts(contacts[])` | CSV import with dedup and validation |
| `syncCustomersToEmailContacts` | Auto-sync from customers table |
| `syncEnrolledUsersToEmailContacts` | Auto-sync course enrollments |
| `findDuplicateContacts` | Detect duplicate emails across contacts |
| `removeDuplicateContacts` | Keep oldest, batch-delete newer |
| `recalculateContactStats` | Full recalculation of contact metrics |
| `bulkAddTagToContacts` | Tag operations on multiple contacts |

### Junction Table Pattern

`emailContactTags` table enables efficient tag-based queries:
```
Contact → emailContactTags → emailTags
         (contactId, tagId)
```
Batched migration from denormalized `tagIds` array to junction table.

---

## 6. Email Templates

**File:** `convex/emailTemplates.ts` (2127 lines)

### 85+ Pre-Built Campaign Templates

Organized by funnel stage:
- **TOFU:** Sample pack lead magnets, free content offers
- **MOFU:** Course previews, case studies, social proof
- **BOFU:** Enrollment closing, limited-time offers, coaching upsells
- **Post-purchase:** Delivery confirmation, review requests, community invites
- **Re-engagement:** Inactive win-back, course dropout recovery
- **Cart abandonment:** Multi-step recovery sequence

### Template Variable System

```
{{firstName}}, {{first_name}}, {{name}}, {{email}}
{{senderName}}, {{sender_name}}, {{storeName}}
{{level}}, {{xp}}, {{coursesEnrolled}}, {{lessonsCompleted}}
{{memberSince}}, {{daysSinceJoined}}, {{totalSpent}}
{{platformUrl}}, {{newCoursesCount}}, {{latestCourseName}}
{{unsubscribeLink}}, {{unsubscribe_link}}
```

Basic conditional: `{{#if fieldName}}...{{/if}}`

**Limitation:** Regex-based replacement, not a proper template engine. No nested conditionals, no loops, no escape handling.

---

## 7. Drip Campaigns

### Structure

```typescript
dripCampaigns: { storeId, name, triggerType, isActive, totalEnrolled, totalCompleted }
dripCampaignSteps: { campaignId, stepNumber, delayMinutes, subject, htmlContent }
dripCampaignEnrollments: { campaignId, email, status, currentStep, enrolledAt }
```

### Trigger Types

`lead_signup`, `product_purchase`, `tag_added`, `manual`

### Processing (Cron every 15 min)

```
processDueDripEmails()
→ Find enrollments: status="active" AND nextScheduledTime <= now
→ For each:
   1. Get campaign + current step
   2. resolveAndEnqueueCustomEmail(step.htmlContent)
   3. Increment step number or mark completed
   4. Track sentAt timestamp
```

**Key difference from Workflows:** Linear progression only (step 1→2→3). No branching, no conditions, no tag operations. Simpler state management.

---

## 8. Course Cycles

### Perpetual Nurture/Pitch Rotation

Continuously cycles through a list of courses, sending nurture then pitch emails, looping forever (or until all purchased).

### Configuration

```typescript
courseCycleConfigs: {
  courseIds: Id<"courses">[]
  courseTimings: [{
    courseId, timingMode: "fixed" | "engagement"
    nurtureEmailCount, nurtureDelayDays
    pitchEmailCount, pitchDelayDays
    purchaseCheckDelayDays
  }]
  loopOnCompletion: boolean
  differentContentOnSecondCycle: boolean
}
```

### Execution State (stored in workflow executionData)

```typescript
{
  currentCourseIndex: 0,           // Which course in rotation
  currentCycleNumber: 1,           // Loop iteration
  currentPhase: "nurture",         // nurture or pitch
  currentEmailIndex: 0,            // Which email in sequence
  purchasedCourseIds: []           // Updated as user purchases
}
```

### Cycle Flow

```
courseCycle node → Find next unpurchased course
     ↓
courseEmail node (nurture) → Send nurture emails
     ↓
purchaseCheck node → Did user buy?
     ↓ yes: tag contact, advance to next course
     ↓ no: continue to pitch
courseEmail node (pitch) → Send pitch emails
     ↓
cycleLoop node → Next course or loop back
```

### A/B Testing

`differentContentOnSecondCycle: true` enables different email content on second pass through the course list.

---

## 9. Deliverability & Suppression

### Three-Layer Suppression

| Layer | Table | Scope |
|-------|-------|-------|
| Global user prefs | `resendPreferences` | Cross-store, user-initiated |
| Store contact status | `emailContacts` | Per-store |
| Bounce/complaint log | `resendLogs` | Historical |

### Dual-Check Pattern

Suppression is verified at **two** points to prevent race conditions:

1. **Enqueue time** (proactive): Check before adding to queue
2. **Claim time** (defensive): Re-check before sending

### Health Scoring

```typescript
let healthScore = 100;
healthScore -= bounceRate * 2;           // 2% bounce = -4 points
healthScore -= spamRate * 20;            // 0.1% spam = -2 points
healthScore = Math.max(0, Math.min(100, healthScore));
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Hard bounce rate | > 2% | > 5% |
| Spam complaint rate | > 0.1% | > 0.3% |
| Soft bounces | > 10 | — |

### Domain Reputation Tracking

```typescript
emailDomainReputation: {
  domain, storeId
  spfStatus, dkimStatus, dmarcStatus    // pass/fail
  reputationScore: 0-100
  lastCheckedAt
}
```

---

## 10. Unsubscribe Handling

### One-Click Unsubscribe URL

```
https://ppracademy.com/unsubscribe/{emailBase64}.{hmacSignature}

// Signature generation:
const signature = crypto.createHmac("sha256", UNSUBSCRIBE_SECRET)
  .update(email)
  .digest("base64url");
```

### Unsubscribe Cascade

```typescript
unsubscribeByEmail(email)
→ Update resendPreferences.isUnsubscribed = true
→ Update ALL emailContacts with this email → status: "unsubscribed"
→ Cancel active workflow executions
→ Cancel active drip campaign enrollments
```

---

## 11. Lead Scoring & Segmentation

### Lead Scoring Rules

```typescript
leadScoringRules: {
  storeId
  eventType: string              // email_opened, link_clicked, purchase, etc.
  points: number                 // Points to add/subtract
  isActive: boolean
}
```

### Segments

```typescript
creatorEmailSegments: {
  storeId, name
  conditions: [{
    field: string                // status, tag, score, date, etc.
    operator: string             // equals, contains, greater_than, etc.
    value: any
  }]
  matchType: "all" | "any"      // AND/OR logic
}
```

---

## 12. Analytics

### Event Types Tracked

```
sent → delivered → opened → clicked → (bounced | complained)
```

### Contact-Level Metrics

| Metric | Source |
|--------|--------|
| emailsSent | Incremented on send |
| emailsOpened | Incremented on open webhook |
| emailsClicked | Incremented on click webhook |
| lastOpenedAt | Timestamp |
| lastClickedAt | Timestamp |

### Deliverability Stats (Aggregated)

```typescript
emailDeliverabilityStats: {
  period: "daily" | "weekly" | "monthly"
  totalSent, delivered, hardBounces, softBounces, spamComplaints
  deliveryRate, bounceRate, spamRate, healthScore
}
```

---

## 13. Resend Integration

### Configuration

```
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@ppracademy.com
FROM_NAME="PPR Academy"
```

### Batch Sending

```typescript
const { data, error } = await resend.batch.send(emailPayloads);
// Max 100 emails per batch
// 600ms between batches
// Theoretical max: ~10,000 emails/minute
// Practical max (fair-ness): ~2,000 emails/minute
```

### Required Headers (CAN-SPAM)

```
List-Unsubscribe: <https://ppracademy.com/unsubscribe/...>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

---

## 14. Cron Schedule

| Job | Interval | Function |
|-----|----------|----------|
| Workflow execution | 60 sec | `processEmailWorkflowExecutions` |
| Send queue | 30 sec | `processEmailSendQueue` |
| Drip campaigns | 15 min | `processDueDripEmails` |
| Stuck drip recovery | 1 hour | `recoverStuckEnrollments` |

---

## 15. CAN-SPAM Compliance

| Requirement | Implementation |
|-------------|---------------|
| Opt-in | Only send to subscribed contacts |
| Unsubscribe | One-click via HMAC-signed URL |
| Physical address | In every email footer |
| List-Unsubscribe header | On all emails |
| Global suppression | Honors across all stores |
| Activity logging | Full audit trail |

---

## 16. Technical Debt

### High Priority

| Issue | Impact |
|-------|--------|
| `emailWorkflowActions.ts` is 1449 lines | Should be split into domain handlers |
| Regex-based template variables | No escaping, no loops, limited conditionals |
| Two-phase workflow: orphaned state if Phase 2 fails | Inconsistent execution state |
| Hard-coded FROM_EMAIL | Should be per-store configurable |

### Medium Priority

| Issue | Impact |
|-------|--------|
| Sequential email node processing | Could parallelize for throughput |
| No A/B testing for general workflows | Only course cycles support it |
| No dynamic segmentation | Conditions are simple yes/no |
| Duplicate contact detection is O(n) | Full scan with pagination |
| Two separate automation engines (workflows + drips) | Overlapping functionality |

### Low Priority

| Issue | Impact |
|-------|--------|
| No automated list cleaning | Manual `cleanBouncedContacts()` |
| No batched condition evaluation | Each contact evaluates separately |
| Cart abandonment tracking incomplete | Schema exists, limited integration |
| No scheduled send (user-chosen time) | Immediate only |

---

*NEEDS EXPANSION IN PASS 3: Email reply handling (emailRepliesSchema), Resend connection management per store, email domain verification flow, workflow builder UI component architecture, A/B test implementation for workflows, cart abandonment automation, email preview/rendering pipeline.*
