# Evergreen Content Engine - Technical Research

> Research date: 2026-02-24
> Purpose: Document exactly what's built, what's partial, and what's planned for the "90 days of content on autopilot" positioning.

---

## TL;DR - What You Can Honestly Promote

| Claim | Status | Honest? |
|-------|--------|---------|
| "AI generates social content from your courses" | FULLY BUILT | Yes |
| "Generate scripts for TikTok, YouTube, and Instagram" | FULLY BUILT | Yes |
| "AI creates images, voiceovers, and captions" | FULLY BUILT | Yes |
| "Batch-generate 90 days of content at once" | FULLY BUILT | Yes |
| "Virality scoring tells you what'll perform" | FULLY BUILT | Yes |
| "Content calendar to plan your posts" | FULLY BUILT | Yes |
| "Schedule posts across platforms" | UI BUILT, auto-publish NOT wired | Careful |
| "Posts automatically publish at scheduled time" | NOT BUILT (publish action is a stub) | No |
| "Email sequences run on autopilot for every subscriber" | FULLY BUILT | Yes |
| "Course cycle loops nurture emails forever" | FULLY BUILT | Yes |
| "AI writes your nurture and pitch emails" | FULLY BUILT | Yes |
| "Connect Instagram, Twitter, Facebook, LinkedIn, TikTok" | OAuth WORKS for all 5 | Yes |
| "Post directly to Instagram" | BUILT (Instagram only) | Yes, Instagram only |
| "Post directly to Twitter/Facebook/LinkedIn/TikTok" | NOT BUILT | No |
| "Instagram DM automation with AI" | FULLY BUILT | Yes |
| "Content recycles and loops forever" | EMAIL SIDE: Yes. SOCIAL SIDE: No auto-recycle | Partial |

---

## 1. AI Content Generation System

### Status: FULLY BUILT & PRODUCTION-READY

### How It Works

The system transforms course content into platform-optimized social media assets through a multi-stage AI pipeline:

```
Course Chapter Content
    |
    v
[Stage 1] Select source content (chapter text, min 100 chars)
    |
    v
[Stage 2] Generate 3 platform scripts in parallel
    |--- TikTok Script (150-250 words, hook-driven, spartan)
    |--- YouTube Script (500-1000 words, conversational, 3-point structure)
    |--- Instagram Script (150-300 words, bullet points + hook)
    |
    v
[Stage 3] Combine into single unified script (60-90 sec, TTS-optimized)
    |
    v
[Stage 4] Score virality (1-10 scale, 3 dimensions)
    |
    v
[Stage 5] Match to creator's social account profiles
    |
    v
[Stage 6] Generate images (one per script line, Excalidraw style)
    |
    v
[Stage 7] Generate voiceover audio (ElevenLabs TTS)
    |
    v
[Stage 8] Generate platform captions + hashtags
```

### AI Models Used

| Purpose | Model | Provider |
|---------|-------|----------|
| Script generation, scoring, captions | Gemini 2.5 Flash (default) | Google via OpenRouter |
| Image generation | Flux (nano-banana-pro) | Fal.ai |
| Voiceover/TTS | eleven_multilingual_v2 | ElevenLabs |
| Image descriptions + embeddings | GPT-4o-mini + text-embedding-3-small | OpenAI |
| Smart AI DM replies | GPT-4o-mini | OpenAI |
| Course cycle email generation | GPT-4o | OpenAI |

### Inputs

- Course title, chapter title, chapter content (text/HTML)
- Optional CTA text, keyword, and product link
- Image aspect ratio preference (9:16, 16:9, 1:1)
- Creator's social account profiles (for matching)

### Outputs Per Chapter

- 3 platform-specific scripts (TikTok, YouTube, Instagram)
- 1 combined script (60-90 seconds, TTS-optimized)
- Multiple images (one per script line, Excalidraw hand-drawn aesthetic)
- 1 MP3 voiceover audio file
- 2 platform captions (Instagram with 15-20 hashtags, TikTok with 3-5 hashtags)
- Virality score (1-10) with breakdown across engagement, educational value, trend alignment
- Account match recommendation with confidence score

### Batch Processing (The "90 Days" Feature)

The script agent can process an entire course at once:
- Processes 5 chapters in parallel per batch
- ~2-second delay between batches
- Generates scripts, scores virality, matches to accounts for every chapter
- Resumable jobs (can pause and continue)
- Progress tracking with per-chapter failure handling

**This is how creators generate 90 days of content** - batch-process all their course chapters, each producing multiple platform scripts.

### 100 Proven TikTok Hook Templates

Built into the system (not a separate feature - they're used automatically during generation):

Examples:
- "If I had to start all over again..."
- "Mistakes I made when (TARGET AUDIENCE)"
- "These X tips feel illegal to know"
- "People pay me $XX to learn this. Today, I'm giving it to you for free."
- "Everything you knew about (SUBJECT) is WRONG!"
- 95+ more proven viral structures

### TTS Optimization Rules

Scripts are automatically optimized for AI voiceover:
- Mandatory contractions (you're, don't, isn't)
- Numbers under 100 written as words
- Abbreviations spelled out
- No parentheses or mathematical notation
- Musical notes made conversational
- Acronyms spelled out on first mention

### Key Files

- `convex/masterAI/socialMediaGenerator.ts` (1,581 lines) - Core generation engine
- `convex/masterAI/socialScriptAgent.ts` (682 lines) - Batch processing agent
- `convex/masterAI/socialScriptAgentMutations.ts` - Job CRUD
- `convex/masterAI/llmClient.ts` - Model routing (OpenAI direct vs OpenRouter)

---

## 2. Social Media Scheduling System

### Status: UI AND DATA LAYER FULLY BUILT. Auto-publish NOT wired.

### What Exists

**Two parallel scheduling systems:**

#### A. Scheduled Posts (`scheduledPosts` table)
- Full CRUD for creating, editing, deleting scheduled posts
- Stores: content, media, scheduled time, timezone, platform options
- Statuses: draft -> scheduled -> publishing -> published -> failed -> cancelled
- Retry logic infrastructure (retryCount, lastRetryAt fields)
- Platform-specific options (Instagram location, Twitter reply settings, Facebook targeting, LinkedIn visibility)

#### B. Script Calendar (`scriptCalendarEntries` table)
- Content planning layer on top of generated scripts
- Week-view calendar UI with day-by-day navigation
- Statuses: planned -> in_progress -> ready -> published -> skipped
- Bulk scheduling with patterns: daily, weekdays, or custom days
- Per-account scheduling across multiple social profiles

### Scheduling UI Components

- **Post Scheduler** (`social-scheduler.tsx`, 749 lines) - Account management, scheduled/published tabs
- **Post Composer** (`post-composer.tsx`) - Form with account selector, content editor, media upload, date/time picker, timezone
- **Calendar Week View** (`CalendarWeekView.tsx`) - Visual weekly calendar showing scripts per day
- **Script Library** (`/app/dashboard/social/library/`) - Browse all generated scripts, filter by virality

### What's NOT Working

**The `publishScheduledPost` action is a stub:**

```typescript
// convex/socialMediaActions.ts line 156
export const publishScheduledPost = internalAction({
  handler: async (ctx, args) => {
    // Stub for now - posting functionality not needed for automation
    return null;
  },
});
```

- No cron job exists to trigger publishing at scheduled times
- Instagram publishing code exists (`publishToInstagram`) but is NOT connected to the scheduler
- Posts are stored with times but won't auto-publish

### Multi-Platform Support

| Platform | Connect | Schedule UI | Auto-Publish |
|----------|---------|-------------|--------------|
| Instagram | Yes | Yes | No (code exists but not wired) |
| Twitter/X | Yes | Yes | No |
| Facebook | Yes | Yes | No |
| LinkedIn | Yes | Coming soon UI | No |
| TikTok | Yes | Coming soon UI | No |

### What Creators Can Do Today

1. Generate content (fully working)
2. Add to content calendar (fully working)
3. See scheduled view with times (fully working)
4. Manually copy/export content to post natively (workaround)
5. Track what's been posted vs pending (fully working)

### What Creators Cannot Do Today

1. Click "publish" and have it post to Instagram/Twitter/etc automatically
2. Set a time and have the post go live without manual action
3. Cross-post to multiple platforms simultaneously

### Key Files

- `components/social-media/social-scheduler.tsx` - Main scheduler UI
- `components/social-media/post-composer.tsx` - Post creation form
- `components/social-media/calendar/CalendarWeekView.tsx` - Calendar view
- `convex/socialMedia.ts` - Mutations (createScheduledPost, updateScheduledPost, etc.)
- `convex/scriptCalendar.ts` - Calendar entry mutations (scheduleScript, bulkScheduleScripts, etc.)
- `convex/socialMediaActions.ts` - Publishing actions (STUBBED)

---

## 3. Content Cycling / Evergreen System

### Status: EMAIL SIDE FULLY BUILT. Social side has NO auto-recycle.

### The Course Cycle System (Email - FULLY BUILT)

This is the true "set it and forget it" evergreen engine. It's an email-based system, not social media.

**How it works:**

```
Creator configures:
  Course 1 -> Course 2 -> Course 3 (ordered list)
  + loopOnCompletion: true
  + differentContentOnSecondCycle: true

New subscriber enters workflow:
  |
  v
[Course Cycle Node] Find first unpurchased course
  |
  v
[Course Email Node] Send nurture emails (AI-generated from course content)
  |--- Nurture Email 1 (Day 0)
  |--- Wait 2 days
  |--- Nurture Email 2 (Day 2)
  |--- Wait 2 days
  |--- Nurture Email 3 (Day 4)
  |
  v
[Course Email Node] Send pitch emails
  |--- Pitch Email 1 (Day 6)
  |--- Wait 1 day
  |--- Pitch Email 2 (Day 7)
  |
  v
[Purchase Check Node] Did they buy?
  |--- YES -> Tag user, move to next course
  |--- NO  -> Continue cycle
  |
  v
[Cycle Loop Node] Advance to next unpurchased course
  |--- If courses remain -> Loop back to Course Cycle Node
  |--- If all done + loopOnCompletion -> Restart with different content
  |--- If all done + !loopOnCompletion -> End workflow
```

### Configuration Options

```
Per course:
  - timingMode: "fixed" or "engagement"
  - nurtureEmailCount: 3 (default)
  - nurtureDelayDays: 2 (default)
  - pitchEmailCount: 2 (default)
  - pitchDelayDays: 1 (default)
  - purchaseCheckDelayDays: 3 (default)

Global:
  - loopOnCompletion: true/false
  - differentContentOnSecondCycle: true/false (AI generates alternate emails)
```

### Automation Infrastructure

- **Cron job runs every 60 seconds** processing workflow executions
- Processes up to 200 execution records per cycle (~12,000 steps/hour throughput)
- Two-phase processing: bulk mutation for simple nodes, then action processing for email nodes
- Execution state tracks: current course index, cycle number, phase, email index, purchased courses

### AI Email Generation for Cycles

- Uses OpenAI GPT-4o to generate nurture and pitch emails
- Different prompts for cycle 1 vs cycle 2 (fresh content on repeat)
- Emails personalized with course module/lesson content
- File: `convex/courseCycleAI.ts`

### Social Media Recycling

**NOT BUILT.** There is no mechanism to:
- Automatically re-queue social posts after they've been published
- Loop social content back to the beginning after reaching the end
- Rotate posts on a schedule

The `contentFlywheel.ts` file exists but is **disabled** with a comment:
```
TEMPORARILY DISABLED: This file references tables (lessons, products, lessonProgress)
that don't exist in the current schema.
```

### Key Files

- `convex/courseCycles.ts` - Core cycle config and email management
- `convex/courseCycleAI.ts` - AI email generation for cycles
- `convex/emailWorkflowActions.ts` (lines 268-558) - Cycle execution logic
- `convex/crons.ts` - Cron job definitions
- `convex/aiPlatform/contentFlywheel.ts` - DISABLED placeholder

---

## 4. Email Sequence System

### Status: FULLY BUILT & PRODUCTION-READY

### Architecture: Dual-Track System

#### A. Email Workflows (Visual Builder)
- ReactFlow-based visual workflow editor
- Node types: trigger, email, delay, condition, action, stop, goal, notify, webhook, split, courseCycle, courseEmail, purchaseCheck, cycleLoop
- Processes via cron every 60 seconds

#### B. Drip Campaigns (Simple Sequential)
- Step-based: step 1 -> delay -> step 2 -> delay -> step 3
- Processes via cron every 15 minutes
- Simpler setup for basic sequences

### Trigger Types

| Trigger | Description | Status |
|---------|-------------|--------|
| `lead_signup` | New subscriber | Fully working |
| `product_purchase` | After purchase | Fully working |
| `tag_added` | When tag applied | Fully working |
| `custom_event` | Custom webhook | Fully working |
| `page_visit` | Landing page view | Fully working |
| `manual` | Manual enrollment | Fully working |

### Can a creator set up a sequence for every new subscriber?

**YES.** Create a workflow with `lead_signup` trigger, design the sequence, turn it on. Every new subscriber automatically enrolls and starts receiving emails.

### Email Provider: Resend

```
Workflow/Drip -> enqueueEmail() -> emailSendQueue -> processEmailSendQueue() -> Resend API
```

- Batch processor runs every 30 seconds
- Suppression checks (CAN-SPAM compliance)
- Unsubscribe links with HMAC signatures
- Variable resolution: {{firstName}}, {{email}}, {{creatorName}}, {{unsubscribeLink}}, etc.

### Pre-Built Workflow Templates (5+)

1. **Producer Welcome Series** - 5-day, 3-email onboarding
2. **Purchase Thank You Sequence** - 7-day post-purchase nurture
3. **Course Student Onboarding** - 14-day, 4-email course motivation
4. **Sample Pack Launch** - 5-day, 3-email launch sequence
5. **Win Back Inactive Subscribers** - 7-day re-engagement with conditional branching

### Pre-Built Email Campaign Templates (40+)

Organized by funnel stage (TOFU/MOFU/BOFU) and product type:

- **Sample Packs:** Free giveaway, collection showcase, launch urgency
- **Courses:** Free masterclass, content preview, enrollment closing
- **Coaching:** Free track review, case study, limited spots
- **Engagement:** Weekly tips newsletter, inactive re-engagement, student dropout recovery
- **Upsell/Cross-sell:** Sample pack to course, course to coaching
- **Sales:** Cart abandonment, bundle deals, flash sales, 3-step cart recovery
- **Releases:** Pre-save capture, confirmation, launch day, 48h follow-up
- **Community:** Private community invite, UGC showcase

Each template includes subject line, preview text, placeholder variables, estimated open rates, and use case descriptions.

### Cron Schedule

| Job | Interval | Purpose |
|-----|----------|---------|
| Process workflow executions | 60 seconds | Main workflow engine |
| Process drip emails | 15 minutes | Drip campaign sends |
| Process email send queue | 30 seconds | Batch send via Resend |
| Recover stuck enrollments | 1 hour | Fix stuck drip contacts |
| Process content unlocks | 15 minutes | Drip course content |

### Key Files

- `convex/emailWorkflows.ts` - Core workflow logic (850 lines)
- `convex/emailWorkflowActions.ts` - Execution engine (1,450 lines)
- `convex/dripCampaigns.ts` - Drip campaign CRUD
- `convex/emailSendQueue.ts` / `emailSendQueueActions.ts` - Send queue
- `convex/emailTemplates.ts` - 40+ campaign templates
- `app/dashboard/emails/workflows/templates/workflow-templates.ts` - 5+ workflow templates
- `app/dashboard/emails/workflows/components/WorkflowCanvas.tsx` - Visual builder

---

## 5. Content Templates & AI Prompts

### Status: FULLY BUILT

### Social Media Templates

**100 TikTok Hook Templates** - Built into the generation engine, automatically applied during script creation. Covers: personal stories, numbered tips, controversy, FOMO, curiosity gaps, contrarian takes, before/after transformations.

**Platform-Specific Prompt Templates:**
- TikTok: Spartan, 150-250 words, no hashtags/emojis, hook-first
- YouTube: Conversational, 500-1000 words, 3-part problem/benefit/consequence structure
- Instagram: Bullet points + hook, 150-300 words, carousel-optimized

**4 Generated Script Formats Per Chapter:**
1. TikTok script
2. YouTube script
3. Instagram script
4. Combined/unified script (TTS-optimized)

### Virality Scoring Rubric

Built-in scoring with calibrated weights:
- Engagement Potential (40%): Generic hooks -2, controversial +2, FOMO +1
- Educational Value (35%): Generic advice -3, specific numbers/steps +2, counter-intuitive +2
- Trend Alignment (25%): Punchy format +2, blog-style -2

Calibration: 9-10 = top 5%, 7-8 = top 20%, 5-6 = middle 50%, 3-4 = bottom 25%

### Content Format Support

| Platform | Post | Reel | Story | Tweet | Thread |
|----------|------|------|-------|-------|--------|
| Instagram | 1:1, 4:5 | 9:16 | 9:16 | - | - |
| TikTok | - | 9:16 | - | - | - |
| YouTube | - | 16:9 | - | - | - |
| Twitter/X | - | - | - | Text | Text |

### Image Style

All generated images use an Excalidraw hand-drawn aesthetic:
- Flat colors: indigo, purple, cyan, pink, orange
- White background
- Music production imagery: DAW interfaces, waveforms, mixing consoles, speakers, headphones
- Explicitly avoids: musical notation, treble clefs, piano keys (renders poorly)

### Note/Planning Templates (6)

Available for content planning:
1. Course Planning Template
2. Research Notes Template
3. Meeting Notes Template
4. Learning Journal Template
5. Project Planning Template
6. Content Ideas Template (includes content calendar section)

---

## 6. Social Platform Integrations

### Status: OAuth FULLY WORKING for 5 platforms. Capabilities vary.

### OAuth Connections

| Platform | OAuth Flow | Token Management | Status |
|----------|-----------|-----------------|--------|
| Instagram | Facebook OAuth -> Long-lived token (60+ days) -> Page Access Token (never expires) | Full refresh flow | Production |
| Facebook | Standard OAuth 2.0 | Long-lived token exchange | Production |
| Twitter/X | OAuth 2.0 with PKCE | Standard refresh | Production |
| LinkedIn | Standard OAuth 2.0 | Standard refresh | Production |
| TikTok | TikTok OAuth (client_key/client_secret) | Standard refresh | Production |

Multi-account support: Users with multiple Instagram Business Accounts can select which to connect.

### Platform Capabilities

#### Instagram (Most Feature-Rich)
- Connect business account
- Publish posts (images + video)
- Publish reels (with video processing, up to 5 min wait)
- Publish stories
- Publish carousels (multi-image)
- DM automation (keyword-triggered)
- Comment monitoring via webhooks
- Smart AI replies (GPT-4o-mini, PRO feature)
- Comment auto-reply

#### Twitter/X
- Connect account
- Send DMs (working)
- Post tweets (NOT implemented)

#### Facebook
- Connect page
- Send Messenger DMs (working)
- Post to page (infrastructure present, not functional)

#### TikTok
- Connect account
- Receive video status webhooks (publish complete, upload failed)
- Full posting requires Creator Marketplace API approval (separate process)

#### YouTube
- Follow-gate OAuth verification (check if user subscribes)
- No content publishing

#### Spotify & Apple Music
- Pre-save campaign flows (fully working)
- OAuth for subscription/save verification

### Instagram DM Automation (Detail)

Fully implemented AI-powered system:

1. **Webhook receives** Instagram comments or DMs
2. **Keyword matching** against configured automation triggers
3. **Two response modes:**
   - MESSAGE: Send predefined text response
   - SMART_AI: GPT-4o-mini generates contextual reply using last 10 messages + social post context via vector embeddings
4. **Delivery:** Sends via `graph.facebook.com/v21.0/{instagramId}/messages`
5. **Safety:** Self-comment filtering, rate limiting, PRO plan gating

### Webhook Infrastructure

| Platform | Webhook Status | Events Handled |
|----------|---------------|----------------|
| Instagram | Full | Comments, DMs, messaging |
| Facebook | Full | Comments, messaging |
| Twitter | Partial | DMs only |
| LinkedIn | Stubbed | "POST-LAUNCH" note in code |
| TikTok | Partial | Video status updates only |

All webhooks use HMAC-SHA256 signature verification.

### Analytics/Tracking

**Schema exists** for post analytics (likes, comments, shares, views, clicks, engagement rate, reach, impressions) but **no automatic population** from platform APIs. Metrics would need manual entry or future API integration.

### Key Files

- `app/api/social/oauth/[platform]/callback/route.ts` (639 lines) - OAuth flows
- `convex/webhooks/instagram.ts` (757 lines) - Instagram webhook processing
- `convex/socialDM.ts` (481 lines) - DM sending
- `convex/socialMediaActions.ts` - Publishing actions
- `app/api/instagram-webhook/route.ts` - Instagram webhook receiver
- `app/api/social/webhooks/[platform]/route.ts` - Multi-platform webhooks

---

## Summary: The Honest Pitch

### What's real and promotable:

**"Turn your courses into 90 days of social content with AI"** - TRUE. The batch generation system processes every chapter of a course and produces TikTok scripts, YouTube scripts, Instagram scripts, images, voiceovers, and captions. A course with 30 chapters = 30 sets of multi-platform content. Three courses = 90 pieces of content, each with platform-optimized variants.

**"AI scores your content for virality before you post"** - TRUE. Every generated script gets a calibrated 1-10 virality score with breakdown.

**"Email sequences run forever on autopilot"** - TRUE. The course cycle system is fully automated with cron jobs, AI-generated emails, purchase detection, and infinite looping with fresh content on each cycle.

**"Visual workflow builder for email automation"** - TRUE. ReactFlow-based, supports triggers, delays, conditions, branching, A/B splits, tags.

**"40+ email templates ready to use"** - TRUE. Organized by funnel stage and product type.

**"Connect all your social accounts"** - TRUE. OAuth works for Instagram, Twitter, Facebook, LinkedIn, TikTok.

**"Instagram DM automation with AI"** - TRUE. Keyword-triggered, Smart AI replies with conversation memory.

### What needs careful framing:

**"Schedule and auto-publish"** - The scheduling UI and data layer are built, but auto-publishing is NOT connected. Creators can plan and organize content on a calendar, but posting still requires manual action or export. Frame as "plan and organize your content calendar" not "auto-publish."

**"Post across all platforms"** - Only Instagram has actual posting capability. Others have OAuth but no publishing. Frame as "connect your accounts" and "plan content for each platform" rather than "publish everywhere."

**"Content recycles forever"** - Only true for email (course cycles). Social content does NOT auto-recycle. Frame the email side as the evergreen engine and the social side as the content creation engine.

**"Analytics and tracking"** - Schema exists but no automatic tracking from platform APIs. Don't promise analytics dashboards yet.
