# Social Media System

> **Last Updated:** 2026-02-19
> **Pass:** 2 — System Deep Dive
> **Key Files:** `convex/socialMediaPosts.ts`, `convex/socialMedia.ts`, `convex/socialMediaActions.ts`, `convex/automations.ts`, `convex/automation.ts`, `convex/socialAccountProfiles.ts`, `convex/socialDMWebhooks.ts`, `convex/generatedScripts.ts`, `convex/scriptIllustrations.ts`

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Platform Support Matrix](#2-platform-support-matrix)
- [3. OAuth Integration](#3-oauth-integration)
- [4. Post Publishing](#4-post-publishing)
- [5. Post Scheduling](#5-post-scheduling)
- [6. AI Script Generation](#6-ai-script-generation)
- [7. Virality Scoring](#7-virality-scoring)
- [8. Script Illustrations](#8-script-illustrations)
- [9. Instagram DM Automation](#9-instagram-dm-automation)
- [10. Automation Flows (ManyChat-style)](#10-automation-flows-manychat-style)
- [11. Webhook Systems](#11-webhook-systems)
- [12. CTA Templates](#12-cta-templates)
- [13. Security Concerns](#13-security-concerns)
- [14. Technical Debt](#14-technical-debt)

---

## 1. System Overview

PPR Academy has a comprehensive social media management system covering:

- **5 platforms:** Instagram, Facebook, Twitter/X, LinkedIn, TikTok
- **OAuth account management** with token refresh
- **Post creation, scheduling, and multi-platform publishing**
- **AI-powered script generation** with virality scoring
- **Instagram DM/comment automation** (ManyChat-style)
- **Webhook-based real-time event processing**
- **Automation flows** with conditional branching

---

## 2. Platform Support Matrix

| Feature | Instagram | Facebook | Twitter/X | LinkedIn | TikTok | YouTube |
|---------|-----------|----------|-----------|----------|--------|---------|
| OAuth Connection | Full | Full | Full | Full | Full | Schema only |
| Post Publishing | Full | Full | Full | Full | Stubbed | — |
| DM Sending | Full | Full | Full | Schema only | — | — |
| Comment Automation | Full | Legacy | — | — | — | — |
| Webhooks | Full | Full | Full | — | — | — |
| Token Refresh | Full | Full | Full | Full | Full | — |

---

## 3. OAuth Integration

**File:** `app/api/social/oauth/[platform]/callback/route.ts`

### Token Flow

```
1. User initiates OAuth → Redirect to platform
2. Platform returns authorization code
3. Exchange code for short-lived token (~1-2 hours)
4. Exchange short-lived for long-lived token (~60 days)
5. Extract platform user data (pages, Instagram accounts)
6. Store in socialAccounts table
7. Calculate tokenExpiresAt
```

### Scopes by Platform

**Instagram/Facebook:**
```
pages_show_list, instagram_basic, instagram_content_publish,
instagram_manage_messages, manage_pages, pages_manage_messages
```

**Twitter/X:**
```
tweet.read, tweet.write, tweet.moderate.write,
users.read, follows.read, follows.write, offline.access
```

**LinkedIn:**
```
w_member_social, r_basicprofile, r_emailaddress
```

**TikTok:**
```
user.info.basic, video.upload, video.publish
```

### Token Storage

```typescript
socialAccounts: {
  storeId, userId, platform, platformUserId
  accessToken: string             // Plain text (security concern)
  refreshToken?: string           // Plain text (security concern)
  tokenExpiresAt?: number
  grantedScopes?: string[]
  platformData?: any              // Page IDs, account metadata
}
```

---

## 4. Post Publishing

**File:** `convex/socialMediaActions.ts`

### Instagram Publishing

```typescript
// 1. Upload media container
POST https://graph.facebook.com/v18.0/{businessAccountId}/media
→ { creation_id }

// 2. Wait for processing (5s images, up to 5min videos)
// 3. Publish
POST https://graph.facebook.com/v18.0/{businessAccountId}/media_publish
→ { id: publishedPostId }

// Retry: 5 attempts for "media not ready" (error 9007)
```

### Twitter Publishing

```typescript
POST https://api.twitter.com/2/tweets
Authorization: Bearer {accessToken}
Body: { text, media?: { media_ids }, reply_settings? }
```

### Facebook Publishing

```typescript
// Photos:
POST https://graph.facebook.com/v18.0/{pageId}/photos

// Text only:
POST https://graph.facebook.com/v18.0/{pageId}/feed
```

### LinkedIn Publishing

```typescript
POST https://api.linkedin.com/v2/ugcPosts
Body: {
  author: "urn:li:person:{userId}",
  lifecycleState: "PUBLISHED",
  specificContent: { "com.linkedin.ugc.ShareContent": {...} },
  visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
}
```

### TikTok: Stubbed

Returns "not fully implemented" error. Requires chunked video upload.

---

## 5. Post Scheduling

### Scheduled Post Structure

```typescript
scheduledPosts: {
  storeId, userId, socialAccountId
  content: string
  postType: "post" | "story" | "reel" | "tweet" | "thread"
  mediaStorageIds?: Id<"_storage">[]
  scheduledFor: number           // Unix timestamp
  timezone: string
  hashtags?: string[]
  location?: string
  status: "draft" | "scheduled" | "publishing" | "published" | "failed" | "cancelled"
  retryCount: number
  errorMessage?: string
}
```

Posts are scheduled with a future `scheduledFor` timestamp and published when the cron job picks them up.

---

## 6. AI Script Generation

### Pipeline

```
Source content (course chapter/lesson)
     ↓
MasterAI analyzes and extracts key points
     ↓
Platform-specific script generation
     ↓
Hook + body + CTA
     ↓
Virality score calculation (1-10)
     ↓
Save to generatedScripts table
```

### Platform-Specific Models

| Platform | Model | Special Feature |
|----------|-------|-----------------|
| TikTok | Gemini 2.5 Flash | 100+ proven hook templates |
| Instagram | Gemini 2.5 Flash | 10-slide carousel format |
| YouTube | Gemini 2.5 Flash | Scene descriptions, timing |
| Twitter | Claude 4.5 Sonnet | Thread auto-splitting |

### Script Storage

```typescript
generatedScripts: {
  userId, platform
  hook: string                   // Opening line
  body: string                   // Main content
  cta: string                    // Call-to-action
  viralityScore: number          // 1-10 prediction
  sourceContentId?: string
  sourceType?: "chapter" | "lesson"
}
```

---

## 7. Virality Scoring

### Factors Analyzed (1-10 Scale)

- **Emotional triggers:** Surprise, curiosity, FOMO
- **Hook strength:** First 3 seconds critical
- **CTA clarity:** Clear and urgent
- **Platform fit:** Platform-specific best practices
- **Content relevance:** Trending topic alignment
- **Audience engagement:** Predicted engagement patterns

### Usage

Displayed as `ViralityBadge` component. Used to help creators select highest-potential scripts for posting.

---

## 8. Script Illustrations

**File:** `convex/scriptIllustrations.ts`

### Image Generation Pipeline

```
1. Split script into sentences
2. For each sentence:
   a. LLM generates image prompt
   b. Fal.ai (flux-schnell) generates image
   c. Create embedding for semantic search
3. Store with metadata
4. Track job progress
```

**Model:** `fal-ai/flux/schnell` (fast generation)
**Error handling:** Per-sentence (continues on failure)

---

## 9. Instagram DM Automation

**File:** `convex/automations.ts`

### Setup Flow

```typescript
1. createAutomation({ name, userId })
2. addKeyword({ automationId, keyword: "free course" })
3. saveTrigger({ automationId, types: ["COMMENT", "DM"] })
4. saveListener({
     automationId,
     listenerType: "MESSAGE" | "SMART_AI",
     reply: "Check your DMs! Link sent"
   })
5. savePosts({
     automationId,
     posts: [
       { postId: "17999...", mediaType: "IMAGE" },
       { postId: "ALL_POSTS_AND_FUTURE", mediaType: "GLOBAL" }
     ]
   })
6. updateAutomation({ automationId, active: true })
```

### Trigger Types

- `COMMENT` — Monitor post comments for keywords
- `DM` — Monitor direct messages for keywords

### Listener Types

- `MESSAGE` — Send static reply
- `SMART_AI` — Use OpenAI for contextual responses (10-message conversation history)

### Database Tables

```
automations → keywords, triggers, listeners, posts, chatHistory
```

---

## 10. Automation Flows (ManyChat-style)

**File:** `convex/automation.ts`

### Node Types

| Node | Purpose |
|------|---------|
| `trigger` | Entry point (keyword, comment, DM, mention) |
| `message` | Send DM/comment reply |
| `delay` | Wait X minutes |
| `condition` | Conditional branching |
| `resource` | Share link/file/course/product |
| `tag` | Add user tag |
| `webhook` | Call external webhook |

### Flow Definition

```typescript
automationFlows: {
  triggerType: "keyword" | "comment" | "dm" | "mention" | "hashtag" | "manual"
  triggerConditions: {
    keywords?: string[]
    platforms: string[]
    matchType: "exact" | "contains" | "starts_with" | "regex"
    socialAccountIds?: Id<"socialAccounts">[]
  }
  flowDefinition: {
    nodes: [{ id, type, position, data }]
    connections: [{ from, to, label? }]
  }
  settings: {
    stopOnError: boolean
    allowMultipleRuns: boolean
    timeoutMinutes: number
  }
}
```

### User State Tracking

```typescript
userAutomationStates: {
  automationFlowId, platform, platformUserId
  status: "active" | "completed" | "failed"
  currentNodeId: string
  isPendingResponse: boolean
  expectedResponse?: string
  tags?: string[]
  startedAt, lastActivityAt, completedAt
}
```

### Condition Resolution Types

- `user_response` — Wait for user yes/no
- `keyword` — Check last response for keyword
- `tag_based` — Check if user has specific tag
- `time_based` — Check time since last activity

---

## 11. Webhook Systems

### Platform Webhooks Handled

**Instagram:**
- `comment.created` — New comment on post
- `instagram.message` — DM received

**Twitter:**
- `favorite_create/destroy` — Like events
- `tweet_create_event` — New tweet
- `direct_message_event` — DM received

**Facebook:**
- `message.created` — DM/comment

### Validation

- Instagram: App secret hash verification
- Twitter: CRC token verification
- Rate limiting: 60 calls/minute default

### Custom Webhook Endpoints

```typescript
createWebhookEndpoint(storeId, name, workflowId, rateLimitPerMinute)
→ { endpointKey, secretKey, webhookUrl }
// Used to trigger email workflows from external systems
```

---

## 12. CTA Templates

### Structure

```typescript
ctaTemplates: {
  userId, name, template
  keyword: string              // e.g., "PROMO", "FREE"
  productId?: Id<"digitalProducts">
  courseId?: Id<"courses">
}
```

Templates are appended to social media posts. Keywords trigger product/course link insertion.

---

## 13. Security Concerns

### Critical

| Issue | Risk | Recommendation |
|-------|------|----------------|
| OAuth tokens stored in plain text | Token theft on DB breach | Encrypt at rest |
| Refresh tokens in plain text | Long-lived credential exposure | Use secure vault |
| No PKCE in OAuth flows | Authorization code interception | Implement PKCE |
| DM sending not audit-logged | Cannot trace automation activity | Add audit trail |

### Medium

| Issue | Risk | Recommendation |
|-------|------|----------------|
| No per-automation rate limiting | Platform account suspension | Add per-user limits |
| OAuth state minimal (just storeId) | CSRF risk | Add nonce + verification |
| Error messages expose internals | Information disclosure | Sanitize errors |
| Webhook validation inconsistent | Spoofed events | Standardize verification |

---

## 14. Technical Debt

### High Priority

| Issue | Impact |
|-------|--------|
| Token storage in plain text | Security vulnerability |
| TikTok publishing not implemented | Feature incomplete |
| No rate limiting on automations | Risk of platform bans |
| Token refresh marks account inactive | Forces manual reconnection |

### Medium Priority

| Issue | Impact |
|-------|--------|
| No service abstraction layer | Direct API calls in business logic |
| Limited retry for failed publishes | Posts can be lost |
| No monitoring/alerting | Automation health invisible |
| YouTube integration schema-only | Cannot connect YouTube |

### Low Priority

| Issue | Impact |
|-------|--------|
| Post templates not integrated | Feature incomplete |
| No post analytics queries | Metrics tracked but no dashboard |
| Hashtag triggers not implemented | Schema support only |
| No user sync to email contacts | Missed cross-channel data |

---

*NEEDS EXPANSION IN PASS 3: Social media dashboard UI components, content calendar implementation, multi-platform posting flow, Instagram Reels/Stories publishing, social analytics aggregation, A/B testing for posts, platform API version management, token encryption implementation.*
