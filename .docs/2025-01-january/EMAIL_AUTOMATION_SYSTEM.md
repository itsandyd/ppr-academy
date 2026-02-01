# PPR Academy Evergreen Email Automation System

## Overview

A complete, interconnected email automation system that handles the entire user lifecycle from signup to becoming a successful creator. All sequences flow into each other based on user actions.

---

## System Architecture

```
                                    NEW USER SIGNUP
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │     1. WELCOME SEQUENCE             │
                        │     (3 emails over 5 days)          │
                        └─────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
        ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
        │  Makes Purchase   │  │  Enrolls Course   │  │  Creates Store    │
        └───────────────────┘  └───────────────────┘  └───────────────────┘
                    │                     │                     │
                    ▼                     ▼                     ▼
        ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
        │ 2. BUYER SEQUENCE │  │ 3. LEARNER        │  │ 5. CREATOR        │
        │ (Thank you +      │  │    SEQUENCE       │  │    ONBOARDING     │
        │  recommendations) │  │ (Progress emails) │  │ (5 emails)        │
        └───────────────────┘  └───────────────────┘  └───────────────────┘
                    │                     │                     │
                    │                     ▼                     ▼
                    │          ┌───────────────────┐  ┌───────────────────┐
                    │          │ Completes Course  │  │ 6. CREATOR        │
                    │          └───────────────────┘  │    GROWTH         │
                    │                     │           │ (Ongoing tips)    │
                    │                     ▼           └───────────────────┘
                    │          ┌───────────────────┐
                    │          │ 4. LEARNER →      │
                    └─────────▶│    CREATOR        │
                               │ (5 emails)        │
                               │ [Already created] │
                               └───────────────────┘
                                          │
                                          ▼
                               ┌───────────────────┐
                               │  Creates Store    │
                               └───────────────────┘
                                          │
                                          ▼
                               ┌───────────────────┐
                               │ 5. CREATOR        │
                               │    ONBOARDING     │
                               └───────────────────┘


        ════════════════════════════════════════════════════════
                         BACKGROUND SEQUENCES
        ════════════════════════════════════════════════════════

        ┌───────────────────────────────────────────────────────┐
        │  7. RE-ENGAGEMENT SEQUENCE                            │
        │  Trigger: No login for 14+ days                       │
        │  (3 emails over 7 days)                               │
        └───────────────────────────────────────────────────────┘
                                    │
                                    ▼ (if still inactive 30+ days)
        ┌───────────────────────────────────────────────────────┐
        │  8. WIN-BACK SEQUENCE                                 │
        │  Trigger: No activity for 60+ days                    │
        │  (3 emails - last attempt)                            │
        └───────────────────────────────────────────────────────┘
```

---

## Sequence Summary

| # | Sequence | Trigger | Emails | Goal |
|---|----------|---------|--------|------|
| 1 | Welcome | New signup | 3 | Orient, engage, first action |
| 2 | Buyer | First purchase | 2 | Thank, recommend, review ask |
| 3 | Learner | Course enrollment | Ongoing | Progress, completion, celebrate |
| 4 | Learner→Creator | Course complete + no store | 5 | Convert to creator |
| 5 | Creator Onboarding | Store created | 5 | First product, first sale |
| 6 | Creator Growth | First sale made | Ongoing | Scale, features, success |
| 7 | Re-engagement | 14 days inactive | 3 | Bring back |
| 8 | Win-back | 60 days inactive | 3 | Last attempt |

---

## Exit Conditions (Global)

A user exits ANY sequence if:
- They unsubscribe
- They enter a higher-priority sequence
- They complete the sequence goal

**Priority Order (highest to lowest):**
1. Creator Growth (they're successful - nurture them)
2. Creator Onboarding (they took action - help them succeed)
3. Learner→Creator (they're qualified - convert them)
4. Learner (they're engaged - keep them learning)
5. Buyer (they spent money - keep them buying)
6. Welcome (they're new - orient them)
7. Re-engagement (they're slipping - save them)
8. Win-back (last resort)

---

## Available Personalization Variables

These variables are available in the email system:

| Variable | Description | Available For |
|----------|-------------|---------------|
| `{{firstName}}` | User's first name | All users |
| `{{name}}` | User's full name | All users |
| `{{email}}` | User's email | All users |
| `{{storeName}}` | Creator's store name | Creators only |
| `{{storeSlug}}` | Store URL slug | Creators only |

**Variables that need to be added:**
- `{{lastLoginDays}}` - Days since last login
- `{{coursesCompleted}}` - Number of courses completed
- `{{productsCreated}}` - Number of products uploaded
- `{{totalEarnings}}` - Creator earnings to date

---

## Detailed Sequences

See individual files:
- [1_WELCOME_SEQUENCE.md](./1_WELCOME_SEQUENCE.md)
- [2_BUYER_SEQUENCE.md](./2_BUYER_SEQUENCE.md)
- [3_LEARNER_SEQUENCE.md](./3_LEARNER_SEQUENCE.md)
- [4_LEARNER_TO_CREATOR_SEQUENCE.md](./LEARNER_TO_CREATOR_EMAIL_SEQUENCE.md) (already exists)
- [5_CREATOR_ONBOARDING_SEQUENCE.md](./5_CREATOR_ONBOARDING_SEQUENCE.md)
- [6_CREATOR_GROWTH_SEQUENCE.md](./6_CREATOR_GROWTH_SEQUENCE.md)
- [7_REENGAGEMENT_SEQUENCE.md](./7_REENGAGEMENT_SEQUENCE.md)
- [8_WINBACK_SEQUENCE.md](./8_WINBACK_SEQUENCE.md)

---

## Implementation Checklist

### Phase 1: Core Sequences
- [ ] Welcome Sequence
- [ ] Buyer Sequence
- [x] Learner→Creator Sequence (done)
- [ ] Creator Onboarding Sequence

### Phase 2: Engagement Sequences
- [ ] Learner Sequence (milestone-based)
- [ ] Creator Growth Sequence

### Phase 3: Recovery Sequences
- [ ] Re-engagement Sequence
- [ ] Win-back Sequence

### Phase 4: Integration
- [ ] Set up triggers in email platform (Resend/Loops)
- [ ] Connect to Convex events
- [ ] Test all sequence transitions
- [ ] Set up analytics tracking

---

## Technical Implementation Notes

### Convex Events to Trigger Emails

```typescript
// Events that should trigger email sequences:

// Welcome Sequence
"users.create" → Start Welcome Sequence

// Buyer Sequence
"purchases.create" → Start Buyer Sequence (if first purchase)

// Learner Sequence
"courseEnrollments.create" → Start Learner Sequence
"courseProgress.lessonComplete" → Send progress email
"courseProgress.moduleComplete" → Send milestone email
"courseProgress.courseComplete" → Send completion email + trigger Learner→Creator

// Creator Onboarding
"stores.create" → Start Creator Onboarding

// Creator Growth
"purchases.create" (as seller) → First sale triggers Creator Growth

// Re-engagement
Cron job: Check for users with lastLogin > 14 days

// Win-back
Cron job: Check for users with lastLogin > 60 days
```

### Email Platform Setup (Resend/Loops)

Each sequence needs:
1. **Audience segment** - Who qualifies
2. **Entry trigger** - What starts the sequence
3. **Exit triggers** - What stops the sequence
4. **Email schedule** - Timing between emails
5. **Transition triggers** - What moves them to next sequence
