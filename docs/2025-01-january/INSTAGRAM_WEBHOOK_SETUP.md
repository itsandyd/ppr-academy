# Instagram Webhook Setup Guide

Complete guide to setting up Instagram DM and Comment automation in PPR Academy.

## Overview

The Instagram webhook system allows you to:
- **Trigger automations** based on keywords in DMs or comments
- **Send automated responses** (predefined messages or AI-generated)
- **Track conversations** with Smart AI continuation
- **Manage multiple automations** per account
- **Monitor all posts** or specific posts for comments

## Architecture

```
Instagram → Webhook Endpoint → Convex Action → Database
                ↓
         Keyword Matching
                ↓
         Execute Automation
                ↓
    Send DM / Reply to Comment
```

### Files

- `convex/http.ts` - Webhook endpoints (GET/POST)
- `convex/webhooks/instagram.ts` - Webhook processor
- `convex/automations.ts` - Automation queries/mutations
- `convex/socialMedia.ts` - Social account management

## Setup Steps

### 1. Meta Developer Account Setup

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select existing app
3. Add **Instagram** product to your app
4. Configure Instagram Basic Display or Instagram Graph API

### 2. Instagram Permissions

Required permissions:
- `instagram_basic`
- `instagram_manage_messages`
- `instagram_manage_comments`
- `pages_manage_metadata`
- `pages_read_engagement`
- `pages_messaging`

### 3. Webhook Configuration

#### In Meta Developer Console:

1. Navigate to **Products → Webhooks**
2. Select **Instagram** from dropdown
3. Click **Subscribe to this object**
4. Add callback URL:
   ```
   https://your-deployment.convex.cloud/webhooks/instagram
   ```
5. Add verify token (use same token in `.env`):
   ```
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_secret_token_here
   ```
6. Subscribe to fields:
   - `messages`
   - `comments`

#### Verify Webhook:

The GET endpoint in `convex/http.ts` handles verification:

```typescript
// Instagram sends: GET /webhooks/instagram?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
// Your endpoint should return: hub.challenge value
```

### 4. Environment Variables

Add to your `.env.local`:

```bash
# Instagram Webhook
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_secret_token_here

# OpenAI (for Smart AI)
OPENAI_API_KEY=sk-xxx

# Facebook/Instagram App
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

## Schema

The automation system uses these tables (already in `convex/schema.ts`):

### `automations`
```typescript
{
  userId: string,           // Clerk ID of creator
  name: string,             // "Free Sample Pack Giveaway"
  active: boolean,          // Is automation active?
  createdAt: number,
  dmsSent: number,          // Stats
  commentsSent: number,
  lastTriggered: number,
}
```

### `triggers`
```typescript
{
  automationId: Id<"automations">,
  type: "DM" | "COMMENT",   // When to trigger
}
```

### `keywords`
```typescript
{
  automationId: Id<"automations">,
  keyword: string,          // "free", "sample pack", etc.
}
```

### `listeners`
```typescript
{
  automationId: Id<"automations">,
  listener: "MESSAGE" | "SMART_AI",
  prompt: string,                    // Message or AI instructions
  commentReply: string | null,       // Public comment reply
}
```

### `posts`
```typescript
{
  automationId: Id<"automations">,
  postId: string,                    // Instagram media ID or "ALL_POSTS_AND_FUTURE"
  postUrl: string,
  caption: string,
}
```

### `chatHistory`
```typescript
{
  automationId: Id<"automations">,
  senderId: string,                  // Instagram user ID
  receiverId: string,                // Your Instagram ID
  message: string,
  role: "user" | "assistant",
  timestamp: number,
}
```

## Creating an Automation

### Option 1: Via Convex Dashboard

Use the Convex dashboard to manually create records:

1. **Create Automation:**
   ```typescript
   {
     userId: "user_xxx",
     name: "Free Sample Pack",
     active: true,
     createdAt: Date.now(),
     dmsSent: 0,
     commentsSent: 0,
   }
   ```

2. **Create Trigger:**
   ```typescript
   {
     automationId: "automation_id_here",
     type: "COMMENT",  // or "DM"
   }
   ```

3. **Add Keywords:**
   ```typescript
   {
     automationId: "automation_id_here",
     keyword: "free",
   }
   // Add more keywords as needed
   ```

4. **Create Listener:**
   ```typescript
   {
     automationId: "automation_id_here",
     listener: "MESSAGE",
     prompt: "Thanks for your interest! Download here: https://yoursite.com/free-pack",
     commentReply: "🎵 Thanks for commenting! Check your DMs for the link!"
   }
   ```

5. **Attach Posts (for comment triggers):**
   ```typescript
   {
     automationId: "automation_id_here",
     postId: "ALL_POSTS_AND_FUTURE",  // Monitor all posts
     postUrl: "",
     caption: "",
   }
   ```

### Option 2: Via API

Use the `convex/automations.ts` mutations:

```typescript
// Create automation
const automationId = await ctx.runMutation(api.automations.createAutomation, {
  userId: "user_xxx",
  name: "Free Sample Pack",
  active: true,
});

// Add trigger, keywords, listener, posts using similar mutations
```

## Automation Types

### 1. Predefined Message (MESSAGE)

Simple keyword → message response.

**Example: Free Sample Pack Giveaway**

```typescript
// Trigger: COMMENT
// Keywords: ["free", "sample", "download"]
// Listener: MESSAGE
// Prompt: "Thanks! Download here: https://example.com/free-pack"
// Comment Reply: "🎵 Check your DMs for the download link!"

// When someone comments "I want the free pack":
// 1. Keyword "free" matches
// 2. Bot replies to comment: "🎵 Check your DMs for the download link!"
// 3. Bot sends DM: "Thanks! Download here: https://example.com/free-pack"
```

### 2. Smart AI (SMART_AI)

AI-powered conversations (requires PRO plan).

**Example: Customer Support Bot**

```typescript
// Trigger: DM
// Keywords: ["help", "support", "question"]
// Listener: SMART_AI
// Prompt: "You are a helpful music production assistant. Answer questions about Ableton Live, plugins, and music production. Be friendly and concise."

// When someone DMs "help with sidechain compression":
// 1. Keyword "help" matches
// 2. OpenAI generates response based on prompt + conversation history
// 3. Bot sends DM with AI response
// 4. Conversation continues with full context
```

## Webhook Flow

### DM Webhook Payload

```json
{
  "entry": [{
    "id": "instagram_account_id",
    "messaging": [{
      "sender": { "id": "user_instagram_id" },
      "recipient": { "id": "your_instagram_id" },
      "message": {
        "text": "free sample pack"
      }
    }]
  }]
}
```

### Comment Webhook Payload

```json
{
  "entry": [{
    "id": "instagram_account_id",
    "changes": [{
      "field": "comments",
      "value": {
        "id": "comment_id",
        "from": { "id": "user_instagram_id" },
        "media": { "id": "post_media_id" },
        "text": "free sample pack"
      }
    }]
  }]
}
```

## Instagram API Endpoints Used

### Send DM
```
POST https://graph.instagram.com/v21.0/me/messages
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "recipient": { "id": "user_instagram_id" },
  "message": { "text": "Your message here" }
}
```

### Reply to Comment
```
POST https://graph.instagram.com/v21.0/{comment_id}/replies
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "message": "Your reply here"
}
```

### Send Private Message (from comment)
```
POST https://graph.instagram.com/me/messages
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "recipient": { "comment_id": "comment_id" },
  "message": { "text": "Your message here" }
}
```

## Testing

### 1. Test Webhook Verification

```bash
curl "https://your-deployment.convex.cloud/webhooks/instagram?hub.mode=subscribe&hub.verify_token=your_secret_token&hub.challenge=test123"
# Should return: test123
```

### 2. Test DM Automation

1. Create automation with DM trigger
2. Add keyword (e.g., "test")
3. Send DM to your Instagram account: "test"
4. Check Convex logs for processing
5. Verify you receive automated response

### 3. Test Comment Automation

1. Create automation with COMMENT trigger
2. Add keyword (e.g., "free")
3. Attach post or use "ALL_POSTS_AND_FUTURE"
4. Comment "free" on your Instagram post
5. Check Convex logs
6. Verify automated comment reply

## Monitoring

### Convex Dashboard

View logs in Convex dashboard:
- `convex/webhooks/instagram.ts` logs
- Keyword matches
- Automation execution
- API responses

### Automation Stats

Each automation tracks:
- `dmsSent` - Total DMs sent
- `commentsSent` - Total comment replies
- `lastTriggered` - Last execution timestamp

### Chat History

View conversation history:
```typescript
const history = await ctx.runQuery(api.automations.getChatHistory, {
  automationId: "xxx",
  instagramUserId: "user_ig_id",
});
```

## Best Practices

### 1. Keyword Strategy

- Use **specific keywords** for better targeting
- Add **multiple variations**: "free", "sample", "download"
- Avoid **common words** that trigger too often

### 2. Message Content

- Keep messages **under 2 sentences** for DMs
- Include **clear CTAs** (call-to-actions)
- Use **emojis** for engagement
- Add **links** to landing pages

### 3. Instagram Compliance

- **Don't spam** - respect user preferences
- **Reply to comments publicly** when possible
- **Avoid unsolicited DMs** - prefer comment replies
- **Monitor automation stats** to avoid being flagged

### 4. Smart AI Setup

- Write **clear system prompts**
- Keep responses **concise** (1-2 sentences)
- Test conversations **thoroughly**
- Monitor **conversation quality**

## Troubleshooting

### Webhook Not Receiving Events

1. **Check verification:**
   - Verify token matches in Meta console and `.env`
   - Test GET endpoint returns challenge

2. **Check Instagram connection:**
   - Verify Instagram account is connected in `socialAccounts`
   - Check `accessToken` is valid and not expired

3. **Check Meta console:**
   - View webhook attempts in Meta Developer Console
   - Check for error messages

### Keywords Not Matching

1. **Check keyword case:**
   - Keywords are lowercased during matching
   - Text is trimmed

2. **Check automation is active:**
   - `active: true` in automations table

3. **Check trigger type:**
   - DM trigger only works for DM webhooks
   - COMMENT trigger only works for comment webhooks

### Responses Not Sending

1. **Check access token:**
   - Verify token in `socialAccounts` table
   - Test token hasn't expired

2. **Check Instagram permissions:**
   - Verify app has correct permissions
   - Check app isn't in restricted mode

3. **Check API limits:**
   - Instagram has rate limits
   - Monitor API error responses

### Smart AI Not Working

1. **Check user plan:**
   - Smart AI requires PRO plan
   - Verify subscription in `subscriptions` table

2. **Check OpenAI API key:**
   - Verify `OPENAI_API_KEY` is set
   - Test API key is valid

3. **Check conversation history:**
   - Verify chat history is being saved
   - Check history retrieval works

## Limitations

- **Instagram API rate limits** apply
- **Message templates** may be required for some use cases
- **24-hour messaging window** for some DM flows
- **Smart AI requires PRO plan** (enforced in code)
- **Webhook retries** - Instagram may retry failed webhooks

## Next Steps

1. **Build UI** for creating/managing automations
2. **Add analytics dashboard** to view automation performance
3. **Implement A/B testing** for different messages
4. **Add more trigger types** (story mentions, reels, etc.)
5. **Create automation templates** for common use cases

## Support

- View webhook logs in Convex dashboard
- Check Instagram webhook events in Meta Developer Console
- Test automations in development before going live
- Monitor automation stats to optimize performance

