# Instagram DM Automation - Implementation Guide

## 🎯 What We're Building

A **Slide/ManyChat-style DM automation system** for PPR Academy that enables:
- **Comment keyword → Auto DM** (e.g., comment "STEMS" → get stem pack link)
- **DM keyword → Auto reply** (e.g., DM "PRO" → Smart AI conversation)
- **Smart AI chatbot** (Pro feature) - Full contextual conversations
- **Producer-specific workflows** (sample pack delivery, course enrollment, coaching upsells)

---

## 🏗️ Architecture Overview

### **Core Components:**

```
┌─────────────────────────────────────────────────────────────┐
│                    INSTAGRAM API                             │
│  ↓ Sends webhook when user comments or DMs                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              YOUR WEBHOOK ENDPOINT                           │
│  /webhooks/instagram (Convex HTTP endpoint)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  KEYWORD MATCHER                             │
│  Check if message contains trigger keyword                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              AUTOMATION EXECUTOR                             │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │ MESSAGE Mode │   OR   │ SMART AI Mode│                  │
│  │ (Free tier)  │        │ (Pro tier)   │                  │
│  └──────────────┘        └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           INSTAGRAM GRAPH API                                │
│  Send DM, reply to comment, track analytics                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### **Key Tables:**

1. **automations** - Container for automation flows
   - `userId`, `name`, `active`, `totalTriggers`

2. **triggers** - When to fire (COMMENT or DM)
   - `automationId`, `type`

3. **keywords** - Trigger words (case-insensitive)
   - `automationId`, `word`

4. **listeners** - What to do (MESSAGE or SMART_AI)
   - `automationId`, `listener`, `prompt`, `commentReply`

5. **posts** - Instagram posts (for comment automations)
   - `automationId`, `postId`, `media`, `mediaType`

6. **chatHistory** - AI conversation context
   - `automationId`, `senderId`, `receiverId`, `message`, `role`

7. **integrations** - Instagram OAuth tokens
   - `userId`, `token`, `expiresAt`, `instagramId`

8. **userSubscriptions** - FREE vs PRO plan
   - `userId`, `plan`, `stripeSubscriptionId`

---

## 🔑 Environment Variables

Add to `.env.local`:

```bash
# Instagram API
INSTAGRAM_CLIENT_ID=your_app_id
INSTAGRAM_CLIENT_SECRET=your_app_secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token

# OpenAI (for Smart AI)
OPENAI_API_KEY=sk-...

# Stripe (for Pro plan subscriptions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PLAN_PRICE_ID=price_...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
CONVEX_SITE_URL=your-convex-deployment-url
```

---

## 📱 Instagram API Setup

### **Step 1: Create Meta App**

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create new app → **Business** type
3. Add **Instagram** product
4. Get your:
   - App ID → `INSTAGRAM_CLIENT_ID`
   - App Secret → `INSTAGRAM_CLIENT_SECRET`

### **Step 2: Connect Instagram Business Account**

Requirements:
- Instagram account must be a **Business** or **Creator** account
- Must be linked to a **Facebook Page**
- Account privacy must be **Public**

### **Step 3: Configure Webhooks**

In Meta App Dashboard:
1. Go to Instagram → Configuration
2. Add webhook callback: `https://your-app.com/webhooks/instagram`
3. Verify token: `testing` (match your env var)
4. Subscribe to fields:
   - `messages` (for DMs)
   - `comments` (for post comments)

### **Step 4: OAuth Redirect URI**

Add to Meta App:
- `https://your-app.com/auth/instagram/callback`

### **Step 5: Get Permissions**

Required permissions (scopes):
- `instagram_basic`
- `instagram_manage_messages`
- `instagram_manage_comments`
- `pages_manage_metadata`
- `pages_read_engagement`

---

## 🎬 Producer Use Cases

### **Use Case 1: Sample Pack Delivery**
```
Trigger: User comments "STEMS" on beat video
Action: Send DM with download link
Message: "🔥 Here's the stem pack! [link] Want the full project file? Reply 'PROJECT'"
```

### **Use Case 2: Course Enrollment**
```
Trigger: User DMs "LEARN"
Action: Smart AI conversation
Prompt: "You are a helpful music production coach. Guide users through course options based on their skill level."
```

### **Use Case 3: Coaching Upsell**
```
Trigger: User comments "FEEDBACK" on mix
Action: Send DM sequence
Message: "I'd love to give you feedback! Book a 1-on-1 session: [link]"
```

### **Use Case 4: Lead Magnet → Upsell**
```
Trigger: User DMs "FREE"
Action: Smart AI
Flow:
  1. Send free preset pack
  2. AI asks: "What DAW do you use?"
  3. AI suggests relevant paid course
  4. AI provides checkout link
```

---

## 🚀 Implementation Checklist

### **Phase 1: Core Automation System** ✅

- [x] Create Convex schema (automations, triggers, keywords, listeners, posts)
- [x] Build automation CRUD (create, update, delete, list)
- [x] Implement keyword matching system
- [x] Create webhook endpoint (GET verification + POST processing)

### **Phase 2: Instagram Integration** (Next)

- [ ] Build OAuth flow UI (`/dashboard/integrations`)
- [ ] Implement token exchange (short → long-lived)
- [ ] Add token refresh cron job (check every 7 days)
- [ ] Create "Get Posts" API (fetch Instagram media)
- [ ] Test webhook with ngrok/local tunnel

### **Phase 3: Message Sending**

- [ ] Implement `sendInstagramDM()` function
- [ ] Implement `sendPrivateMessage()` (for comment triggers)
- [ ] Implement `replyToComment()` function
- [ ] Add 24-hour messaging window check
- [ ] Handle rate limits (Instagram allows ~200 messages/hour)

### **Phase 4: Smart AI** (Pro Feature)

- [ ] Integrate OpenAI GPT-4
- [ ] Build conversation history storage
- [ ] Implement context window management (last 10 messages)
- [ ] Add Smart AI paywall (check userSubscriptions.plan)
- [ ] Create AI prompt templates for producers

### **Phase 5: UI/UX**

- [ ] Automation builder page (`/dashboard/automations/new`)
- [ ] Trigger selector (Comment vs DM)
- [ ] Keyword input with live validation
- [ ] Post attachment UI (grid of Instagram posts)
- [ ] Listener config (Message vs Smart AI toggle)
- [ ] Automation list dashboard
- [ ] Analytics (triggers fired, DMs sent, conversion rate)

### **Phase 6: Subscription Paywall**

- [ ] Create Stripe product ("PPR Academy Pro - $29/mo")
- [ ] Build upgrade flow (Free → Pro)
- [ ] Implement webhook handler for subscriptions
- [ ] Add subscription status to user dashboard
- [ ] Show "Upgrade to Pro" prompt when selecting Smart AI

---

## 🎨 UI Components Needed

### **1. Automation Builder** (`/dashboard/automations/[id]`)

```tsx
<AutomationBuilder>
  {/* Trigger Section */}
  <TriggerSelector
    types={["COMMENT", "DM"]}
    selected={["COMMENT"]}
    onChange={handleTriggerChange}
  />
  
  {/* Keywords */}
  <KeywordInput
    keywords={["STEMS", "PROJECT"]}
    onAdd={handleAddKeyword}
    onRemove={handleRemoveKeyword}
  />
  
  {/* Post Attachment (only for COMMENT triggers) */}
  {hasCommentTrigger && (
    <PostSelector
      posts={instagramPosts}
      selected={selectedPosts}
      onSelect={handlePostSelect}
    />
  )}
  
  {/* Action/Listener */}
  <ListenerConfig>
    <ListenerTypeToggle
      type="MESSAGE" // or "SMART_AI"
      onChange={handleListenerChange}
    />
    
    {listenerType === "MESSAGE" ? (
      <MessageInput
        placeholder="Enter message to send..."
        value={message}
        onChange={setMessage}
      />
    ) : (
      <SmartAIPromptInput
        placeholder="You are a music producer assistant..."
        value={aiPrompt}
        onChange={setAiPrompt}
        requiresPro={true}
      />
    )}
  </ListenerConfig>
  
  {/* Activate Button */}
  <ActivateButton
    active={automation.active}
    onClick={toggleActivation}
  />
</AutomationBuilder>
```

### **2. Automation List** (`/dashboard/automations`)

```tsx
<AutomationList>
  {automations.map(auto => (
    <AutomationCard key={auto._id}>
      <CardHeader>
        <Title editable>{auto.name}</Title>
        <Badge active={auto.active} />
      </CardHeader>
      
      <CardContent>
        {/* Show trigger type */}
        <TriggerBadge type={auto.trigger?.type} />
        
        {/* Show keywords */}
        <KeywordPills keywords={auto.keywords} />
        
        {/* Show listener type */}
        {auto.listener?.listener === "SMART_AI" ? (
          <Badge variant="gradient">🤖 Smart AI</Badge>
        ) : (
          <Badge variant="secondary">💬 Message</Badge>
        )}
      </CardContent>
      
      <CardFooter>
        <Stats>
          <Stat label="Triggers" value={auto.totalTriggers || 0} />
          <Stat label="Responses" value={auto.totalResponses || 0} />
        </Stats>
        
        <Button onClick={() => router.push(`/dashboard/automations/${auto._id}`)}>
          Edit
        </Button>
      </CardFooter>
    </AutomationCard>
  ))}
</AutomationList>
```

---

## 🧪 Testing Locally

### **1. Use Ngrok for Webhooks**

```bash
# Terminal 1: Run Convex dev
npm run dev

# Terminal 2: Expose localhost
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Add to Meta Developer Dashboard webhook config
```

### **2. Test Comment Automation**

1. Create automation in PPR Academy dashboard
2. Add trigger: COMMENT
3. Add keyword: "TEST"
4. Add listener: MESSAGE → "Hey! This is a test automation 🎵"
5. Attach Instagram post
6. Activate automation
7. Go to Instagram, comment "TEST" on the post
8. Check DMs → should receive automated message

### **3. Test Smart AI**

1. Upgrade to Pro plan (use Stripe test mode)
2. Create automation with DM trigger
3. Add keyword: "HELP"
4. Select Smart AI listener
5. Add prompt: "You are a music production assistant. Help users with beat-making questions."
6. Activate automation
7. Send DM "HELP" to your Instagram
8. AI should respond based on prompt
9. Continue conversation → AI remembers context

---

## ⚠️ Instagram API Limitations

### **24-Hour Messaging Window**
- You can only send messages to users who have messaged you in the last 24 hours
- Exception: One-time notification for comment-to-DM flow
- Solution: Use "private message" API for comment triggers

### **Rate Limits**
- ~200 messages per hour per account
- Track sends and implement queue system

### **Token Expiry**
- Long-lived tokens expire after 60 days
- Implement auto-refresh cron job:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check and refresh Instagram tokens every 7 days
crons.interval(
  "refresh instagram tokens",
  { days: 7 },
  internal.integrations.instagram.refreshAllTokens
);

export default crons;
```

### **Message Approval**
- Messages go to "primary" inbox (not "message requests")
- Use private message API for first contact via comments
- User account must not have strict privacy settings

---

## 💰 Monetization Strategy

### **Free Tier:**
- Unlimited automations
- MESSAGE listener only (single message)
- Up to 3 keywords per automation
- Basic analytics

### **Pro Tier ($29/mo):**
- Unlimited automations
- **SMART_AI listener** (AI conversations)
- Unlimited keywords
- Advanced analytics (conversion tracking, GMV)
- Priority support

### **Pricing Psychology:**
```
"Start free, upgrade when you're making money"
- Free tier: Good for lead magnets, simple delivery
- Pro tier: Unlocks AI closer, multi-step sequences
```

---

## 🎵 Producer-Specific Workflows

### **Workflow 1: Stem Pack Funnel**

```typescript
// Automation: "Stem Pack Delivery"
Trigger: COMMENT on beat snippet video
Keyword: "STEMS"
Action: MESSAGE
Message: "🔥 Here's the stems for this beat: [Dropbox link]

Want the full Ableton project? Reply 'PROJECT' for the full breakdown!"

// Follow-up automation:
Trigger: DM
Keyword: "PROJECT"  
Action: SMART_AI
Prompt: "You're a producer selling project files. The user wants the full Ableton project ($19). Ask which DAW they use, confirm purchase intent, send payment link."
```

### **Workflow 2: Course Enrollment**

```typescript
Trigger: DM
Keyword: "LEARN"
Action: SMART_AI
Prompt: "You're a music production coach promoting PPR Academy courses.

Ask about their skill level:
- Beginner: Recommend 'Beats From Scratch' course
- Intermediate: Recommend 'Mixing Masterclass'
- Advanced: Recommend '1-on-1 Coaching'

Be friendly, enthusiastic, and concise. Always provide checkout links."
```

### **Workflow 3: Sample Pack Upsell**

```typescript
Trigger: COMMENT on Instagram Reel
Keyword: "DRUMS"
Action: MESSAGE
Message: "💥 Free drum kit: [link]

PS - I just dropped a full drum library (500+ sounds) for $14. Want it? Reply 'LIBRARY'"

// Upsell automation:
Trigger: DM
Keyword: "LIBRARY"
Action: MESSAGE
Message: "Sick! Here's the full library: [Gumroad link]

After you cop it, DM me your best beat and I'll give you free feedback 🎧"
```

---

## 🔐 Security Best Practices

### **1. Token Storage**
- Store Instagram tokens encrypted in Convex
- Never expose tokens in client-side code
- Rotate tokens every 60 days automatically

### **2. Webhook Verification**
- Always verify `hub.verify_token` on GET requests
- For POST, validate Instagram signature (optional but recommended)

### **3. Rate Limit Protection**
```typescript
// Track messages sent per hour
const messageCounts = new Map<string, number>();

function checkRateLimit(userId: string): boolean {
  const count = messageCounts.get(userId) || 0;
  if (count >= 200) {
    console.warn("⚠️ Rate limit reached for user:", userId);
    return false;
  }
  messageCounts.set(userId, count + 1);
  return true;
}
```

### **4. User Privacy**
- Only store Instagram IDs (not usernames) in chat history
- Allow users to opt-out via "STOP" keyword
- Comply with Instagram's Platform Policy

---

## 🚀 Deployment Guide

### **1. Deploy to Convex**

```bash
npx convex deploy

# Note your deployment URL:
# https://your-deployment.convex.cloud
```

### **2. Deploy Next.js to Vercel**

```bash
vercel --prod

# Add environment variables in Vercel dashboard
```

### **3. Update Meta App Settings**

- OAuth Redirect: `https://your-app.com/auth/instagram/callback`
- Webhook URL: `https://your-deployment.convex.cloud/webhooks/instagram`
- Verify token: `testing` (or change to secure value)

### **4. Test Webhook**

Use Meta's webhook tester or send test events.

---

## 📈 Analytics to Track

### **Automation Performance:**
- Total triggers fired
- DMs sent (successful)
- Conversion rate (DM → checkout)
- Average response time
- Smart AI conversation length

### **Revenue Metrics:**
- GMV from automation-driven sales
- Pro plan MRR
- CAC via automation funnels
- LTV of automation-acquired customers

---

## 🎯 GTM Strategy for PPR Academy

### **Phase 1: Proof-of-Concept (Week 1-2)**

1. **Build flagship automation:**
   - Post beat snippet on Instagram
   - Comment "STEMS" → Auto-DM with free stem pack
   - Collect 100 leads
   - Track: comment → DM open rate → download rate

2. **Document results:**
   - "I automated 100 DMs in 24 hours"
   - Share dashboard screenshot
   - Create case study

### **Phase 2: Creator Beta (Week 3-4)**

3. **Onboard 10 producers:**
   - White-glove setup (build their automation)
   - Free Pro plan for 30 days
   - Ask for testimonials

4. **Create content:**
   - "How [Producer Name] Made $500 with Instagram DMs"
   - Screen recording of automation builder
   - Before/after: Manual DMs vs Automation

### **Phase 3: Launch (Week 5-8)**

5. **Launch campaign:**
   - YouTube: "I Built a ManyChat for Producers"
   - Offer: 14-day free trial of Pro plan
   - Tripwire: $7 preset pack + 1 free automation setup

6. **Distribution:**
   - Mid-tier producer collabs (10k-100k followers)
   - Run Instagram ads to lead magnet
   - Email existing PPR Academy list

---

## 🧩 Integration with Existing PPR Academy

### **How it Fits:**

```
PPR Academy Stack:
├── Courses (existing) ✅
├── Digital Products (existing) ✅
├── Coaching (existing) ✅
├── Email Automation (existing) ✅
└── DM Automation (NEW) ⚡️
    ├── Trigger: Instagram comment/DM
    ├── Action: Auto-reply or Smart AI
    └── Outcome: Lead capture → Upsell → Checkout
```

### **Cross-Feature Synergy:**

1. **DM → Course Enrollment:**
   - Instagram comment "LEARN" → AI chat → Course checkout
   - Track in `purchases` table with `source: "instagram_automation"`

2. **DM → Email List:**
   - Capture Instagram user
   - Add to `customers` table
   - Enroll in email drip campaign

3. **DM → Coaching Booking:**
   - Keyword "COACHING" → Smart AI → Calendar link
   - Integrate with `coachingSessions` table

---

## 🐛 Troubleshooting

### **Problem: Webhook not receiving events**

**Solution:**
- Check webhook is verified (green checkmark in Meta dashboard)
- Verify `hub.verify_token` matches env var
- Use ngrok or Convex deploy URL (not localhost)
- Check Instagram account is Business/Creator type

### **Problem: DMs not sending**

**Solution:**
- Check access token is valid (not expired)
- Verify user has messaged you within 24 hours (or use private message API)
- Check recipient account is public
- Inspect Instagram API error response

### **Problem: Smart AI not working**

**Solution:**
- Verify user has PRO plan in `userSubscriptions`
- Check OpenAI API key is valid
- Inspect conversation history query
- Ensure prompt is under token limit

---

## 📚 Next Steps

1. ✅ **Schema created**
2. ✅ **Webhook endpoint created**
3. ⏳ **Build automation UI** (next)
4. ⏳ **Implement Instagram OAuth flow**
5. ⏳ **Add Smart AI chatbot**
6. ⏳ **Create Pro plan subscription**
7. ⏳ **Launch with PPR as flagship case study**

---

## 🎁 Bonus: Advanced Features

### **Feature 1: Conversation Funnels**
Build multi-step sequences:
```
User: "STEMS"
Bot: "Here's the pack! What genre do you produce?"
User: "Trap"
Bot: "Perfect! Check out my trap drum kit: [link]"
```

### **Feature 2: Analytics Dashboard**
- Keyword performance (which keywords convert best)
- Message engagement (DM open rate, response rate)
- Revenue attribution (sales from automation)

### **Feature 3: A/B Testing**
- Test different messages for same keyword
- Track which converts better
- Auto-optimize based on results

---

## 💡 Key Insights from Slide Analysis

1. **Simplicity wins:** Slide UI is step-by-step, no complex editors
2. **Free tier strategy:** Unlimited automations, but limit to single message
3. **AI as premium:** Smart AI is the upgrade hook (Pro plan)
4. **Producer validation:** Use PPR Academy as proof/case study
5. **Network effects:** More creators = more samples in marketplace

---

**Ready to dominate the producer DM automation space?** 🚀

This is your ManyChat moment. Build it, launch it, scale it.

