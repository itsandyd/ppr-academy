# Instagram DM Automation - Quick Start Guide

## 🚀 Get Running in 30 Minutes

This guide will get you from **zero to working Instagram automations** fast.

---

## ✅ Prerequisites

- [ ] PPR Academy codebase running locally
- [ ] Convex account (free tier works)
- [ ] Instagram Business/Creator account
- [ ] Facebook Page (linked to Instagram)
- [ ] Stripe account (for Pro plan subscriptions)
- [ ] OpenAI API key (for Smart AI)

---

## 📋 Step-by-Step Setup

### **1. Install Dependencies**

```bash
# Add required packages
npm install stripe openai
# or
bun add stripe openai

# Convex should already be installed
```

### **2. Environment Variables**

Add to `.env.local`:

```bash
# Instagram API
INSTAGRAM_CLIENT_ID=your_meta_app_id
INSTAGRAM_CLIENT_SECRET=your_meta_app_secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=testing123
INSTAGRAM_TOKEN_URL=https://api.instagram.com/oauth/access_token
NEXT_PUBLIC_INSTAGRAM_OAUTH_URL=https://www.instagram.com/oauth/authorize?client_id=YOUR_APP_ID&redirect_uri=https://your-app.com/auth/instagram/callback&scope=instagram_basic,instagram_manage_messages,instagram_manage_comments,pages_manage_metadata,pages_read_engagement&response_type=code

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PLAN_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **3. Create Meta App**

1. Go to [developers.facebook.com](https://developers.facebook.com/apps)
2. Click **"Create App"** → Select **"Business"** type
3. Name: "PPR Academy Automations"
4. **Add Instagram Product** → Click "Set Up"
5. Copy **App ID** → Paste as `INSTAGRAM_CLIENT_ID`
6. Copy **App Secret** → Paste as `INSTAGRAM_CLIENT_SECRET`

### **4. Configure OAuth**

In Meta App Dashboard → Instagram → Basic Settings:

1. **OAuth Redirect URIs:** Add:
   ```
   http://localhost:3000/auth/instagram/callback
   https://your-production-url.com/auth/instagram/callback
   ```

2. **Deauthorize Callback:** (optional)
   ```
   https://your-production-url.com/auth/instagram/deauthorize
   ```

3. Click **"Save Changes"**

### **5. Set Up Webhooks**

You'll need a public URL for webhooks. Options:

**Option A: ngrok (easiest for local development)**
```bash
# Terminal 1: Run your app
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
```

**Option B: Deploy to Convex (production)**
```bash
npx convex deploy
# Use your Convex deployment URL
```

**Configure in Meta App:**

1. Go to **Instagram → Configuration**
2. Click **"Configure Webhooks"**
3. **Callback URL:** `https://your-ngrok-url.com/webhooks/instagram` (or Convex URL)
4. **Verify Token:** `testing123` (match your env var)
5. Click **"Verify and Save"**
6. Subscribe to fields:
   - ✅ `messages`
   - ✅ `comments`

### **6. Connect Instagram Account**

1. In Meta App → Instagram → Add Accounts
2. Click **"Add Instagram Account"**
3. Log in with Instagram Business account
4. Grant all permissions:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `instagram_manage_comments`
   - `pages_manage_metadata`

### **7. Test Webhook**

In Meta Developer Dashboard → Webhooks → Test Button:

1. Click **"Test"** next to `messages` or `comments`
2. Send test event
3. Check your terminal/Convex logs for:
   ```
   📨 Instagram webhook received: { ... }
   ```

### **8. Create Stripe Product**

1. Go to [dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Click **"Add product"**
3. Name: "PPR Academy Pro"
4. Price: $29.00 / month
5. Copy **Price ID** → Paste as `STRIPE_PRO_PLAN_PRICE_ID`

### **9. Set Up Stripe Webhook**

1. Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-convex-url.com/webhooks/stripe`
4. Events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing secret** → Paste as `STRIPE_WEBHOOK_SECRET`

### **10. Deploy Schema**

```bash
# Push Convex schema
npx convex dev

# In another terminal, verify tables created
# Check Convex dashboard → Data
```

### **11. Test End-to-End**

**Test Comment Automation:**

1. In your app: `/dashboard/automations`
2. Click **"New Automation"**
3. Name: "Sample Pack Test"
4. Trigger: Select **"User comments on my post"**
5. Add keyword: `TEST`
6. Action: Select **"Send a message"**
7. Message: `Hey! This is a test automation 🎵 Here's a free sample pack: https://example.com/pack`
8. Click **"Save Trigger"** and **"Save Action"**
9. Toggle **"Activate"**
10. Go to Instagram, comment `TEST` on one of your posts
11. Check your DMs → should receive automated message ✅

**Test DM Automation:**

1. Create another automation
2. Trigger: **"User sends me a DM"**
3. Keyword: `HELP`
4. Action: **"Send a message"** (or Smart AI if Pro)
5. Message: `How can I help you today? 😊`
6. Activate
7. Send yourself a DM with `HELP`
8. Check for automated response ✅

---

## 🐛 Troubleshooting

### **Issue: Webhook not receiving events**

**Check:**
- ✅ Webhook verified (green checkmark in Meta dashboard)
- ✅ Using public URL (ngrok or deployed)
- ✅ `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` matches Meta dashboard
- ✅ Subscribed to `messages` and `comments` fields

**Debug:**
```bash
# Check Convex logs
npx convex dev --tail-logs

# Look for:
📨 Instagram webhook received
```

### **Issue: "No Instagram integration found"**

**Fix:**
- Complete OAuth flow (/dashboard/integrations)
- Check `integrations` table in Convex has your user
- Verify token hasn't expired

### **Issue: DMs not sending**

**Check:**
- ✅ Recipient messaged you within 24 hours
- ✅ Recipient account is public
- ✅ You have Instagram Business account
- ✅ Access token is valid

**For comment triggers:** Use `sendPrivateMessage()` API instead of regular DM API

### **Issue: Smart AI not working**

**Fix:**
- Upgrade to Pro plan
- Check `OPENAI_API_KEY` is valid
- Verify prompt is under token limit
- Inspect chatHistory table for conversation context

---

## 🎯 Producer-Specific Automation Templates

### **Template 1: Free Preset Pack**

```
Name: "Free Preset Giveaway"
Trigger: COMMENT
Keywords: PRESETS, FREE, DOWNLOAD
Action: MESSAGE
Message: "🔥 Here's your free preset pack: https://drive.google.com/...

Want 500+ more presets? Check out the full library: https://ppr-academy.com/presets"

Comment Reply: "Check your DMs! 💜"
```

### **Template 2: Course Enrollment AI**

```
Name: "Course Enrollment Bot"
Trigger: DM
Keywords: LEARN, COURSE, TEACH
Action: SMART_AI
Prompt: "You are a music production coach for PausePlayRepeat Academy.

Your goal: Enroll users in the right course based on their skill level.

Courses:
- Beats From Scratch ($47) - Beginners
- Mixing Masterclass ($97) - Intermediate
- 1-on-1 Coaching ($199) - Advanced

Ask about their experience, DAW, and goals. Recommend the best fit. Keep responses under 2 sentences."
```

### **Template 3: Sample Pack Upsell**

```
Name: "Drum Kit Upsell"
Trigger: COMMENT
Keywords: DRUMS, SAMPLES, SOUNDS
Action: MESSAGE
Message: "💥 Free 10-pack drum kit: https://ppr.ac/free-drums

PS - My full library (500+ sounds) just dropped for $14. Reply 'LIBRARY' if you want it 👀"

Follow-up Automation:
Trigger: DM
Keywords: LIBRARY
Action: MESSAGE
Message: "Here's the full library: https://ppr.ac/drum-library

After you cop, send me your best beat and I'll give you FREE feedback 🎧"
```

---

## 📈 Analytics Setup

Track these metrics in your dashboard:

### **Automation Performance:**
```typescript
- Total triggers fired
- Messages sent successfully
- Conversion rate (keyword → checkout)
- Most popular keywords
- Best-performing automations
```

### **Revenue Attribution:**
```typescript
// Track purchases from automations
purchases: {
  source: "instagram_automation",
  automationId: "...",
  keyword: "STEMS",
  revenue: 47.00
}
```

---

## 🔒 Security Checklist

- [ ] Store access tokens encrypted (Convex handles this)
- [ ] Never expose tokens in client code
- [ ] Implement rate limiting (200 msgs/hour)
- [ ] Add "STOP" keyword to opt-out
- [ ] Comply with Instagram Platform Policy
- [ ] Set up webhook signature verification (optional but recommended)

---

## 🎬 Launch Checklist

### **Before Going Live:**

- [ ] Test all automation types (comment, DM, Smart AI)
- [ ] Verify messages go to primary inbox (not requests)
- [ ] Test with different Instagram accounts
- [ ] Set up Stripe production mode
- [ ] Deploy to production (Vercel + Convex)
- [ ] Update Meta App webhooks to production URLs
- [ ] Submit Meta App for review (if needed)

### **Launch Strategy:**

1. **Week 1:** Run PPR Academy's own automations
   - Post beat snippet → Comment "STEMS" → Auto-deliver
   - Track: 100 leads in 7 days

2. **Week 2:** Document results
   - Create case study
   - Screenshot analytics dashboard
   - Share on Twitter/YouTube

3. **Week 3:** Onboard 10 beta creators
   - White-glove setup (build their automations)
   - Free Pro plan for 30 days
   - Collect testimonials

4. **Week 4:** Public launch
   - YouTube: "How I Automated 1,000 Instagram DMs"
   - Offer: 14-day free trial
   - Price: $29/mo (Pro plan)

---

## 💰 Pricing Model

### **Free Tier:**
- ✅ Unlimited automations
- ✅ MESSAGE listener only
- ✅ Up to 3 keywords per automation
- ✅ Basic analytics
- ❌ No Smart AI

### **Pro Tier ($29/mo):**
- ✅ Everything in Free
- ✅ **Smart AI conversations**
- ✅ Unlimited keywords
- ✅ Advanced analytics
- ✅ Priority support
- ✅ Early access to new features

### **Agency Tier ($199 one-time setup):**
- ✅ White-glove automation setup
- ✅ Custom prompt engineering
- ✅ 3 months Pro free
- ✅ Strategy call

---

## 🎯 Next Steps

1. ✅ **Complete setup above** (30 mins)
2. ⚡ **Create your first automation** (5 mins)
3. 🧪 **Test with your Instagram** (10 mins)
4. 📊 **Monitor analytics** (ongoing)
5. 🚀 **Launch and iterate** (Week 1-4)

---

## 🆘 Need Help?

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Webhook verification failed" | Check `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` matches Meta dashboard |
| "OAuth redirect mismatch" | Verify redirect URI in Meta App matches your callback route |
| "Token expired" | Implement auto-refresh cron job (runs every 7 days) |
| "Messages not sending" | Check 24-hour window, user privacy settings, account type |
| "Smart AI not responding" | Verify Pro plan status, OpenAI API key, prompt length |

**Resources:**
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Meta Webhooks Guide](https://developers.facebook.com/docs/graph-api/webhooks)
- [Convex Actions Guide](https://docs.convex.dev/functions/actions)

---

## 🎁 Bonus: Advanced Features

Once you have the basics working, add:

1. **A/B Testing:** Test different messages for same keyword
2. **Analytics Dashboard:** Track keyword performance, conversion rates
3. **Conversation Funnels:** Multi-step DM sequences
4. **Lead Scoring:** Track user engagement, assign scores
5. **CRM Integration:** Sync Instagram leads to email list
6. **Multi-Account:** Support multiple Instagram accounts per user

---

**Ready to 10x your Instagram engagement?** Let's build! 🚀

