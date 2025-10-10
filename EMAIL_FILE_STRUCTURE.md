# Email System File Structure

## ✅ Fixed: Convex Node.js Runtime Error

### The Problem
Convex files with `"use node";` can **only** contain actions (not queries or mutations). 
The original `emails.ts` had `"use node";` at the top but contained many mutations and queries, causing deployment to fail.

### The Solution
Split the email system into two files:

---

## 📁 File Structure

### 1. **`convex/emails.ts`** (Node.js Runtime - Actions Only)
**Has:** `"use node";` at the top  
**Contains:** Actions that need Resend API (Node.js library)

#### Functions:
- `processCampaign` - Send campaign emails via Resend
- `processAutomationTriggers` - Check and fire automation rules
- `processScheduledCampaigns` - Process campaigns due to send
- `cleanupOldLogs` - Delete old email logs

**Total:** 4 actions (~270 lines)

---

### 2. **`convex/emailQueries.ts`** (V8 Runtime - Queries & Mutations)
**No** `"use node";`  
**Contains:** All queries and mutations for email data

#### Categories:

**Templates** (2 functions)
- `createTemplate` - Create email template
- `getTemplates` - List templates

**Campaigns** (4 functions)
- `createCampaign` - Create campaign
- `getCampaigns` - List campaigns
- `getCampaignStats` - Get campaign metrics
- `getCampaignById` - Get single campaign (internal)

**Connections** (4 functions)
- `connectAdminResend` - Connect admin Resend account
- `connectStoreResend` - Connect store Resend account
- `getAdminConnection` - Get admin connection
- `getStoreConnection` - Get store connection

**Automation** (4 functions)
- `createAutomation` - Create automation rule
- `getAutomations` - List automations
- `toggleAutomation` - Enable/disable automation
- `getActiveAutomations` - Get active automations (internal)

**Analytics** (3 functions)
- `getEmailAnalytics` - Get connection analytics
- `getEmailLogs` - Get email history
- (More analytics queries...)

**Webhooks** (2 functions)
- `handleWebhookEvent` - Process Resend webhooks
- `incrementCampaignMetric` - Update campaign metrics (internal)

**Internal Helpers** (6 functions)
- `getCampaignRecipients` - Calculate recipients
- `updateCampaignStatus` - Update status
- `updateCampaignMetrics` - Update metrics
- `logEmail` - Log email send
- `getScheduledCampaigns` - Get campaigns to send
- `getOldLogs` - Get logs to delete
- `deleteLog` - Delete a single log

**Total:** ~30 functions (~1,100 lines)

---

## 🔗 How They Work Together

### Actions Call Queries/Mutations:
```typescript
// In emails.ts (action):
export const processCampaign = internalAction({
  handler: async (ctx, args) => {
    // Call query from emailQueries.ts
    const campaign = await ctx.runQuery(internal.emailQueries.getCampaignById, {...});
    
    // Call mutation from emailQueries.ts
    await ctx.runMutation(internal.emailQueries.updateCampaignStatus, {...});
    
    // Use Resend (Node.js)
    const result = await resend.emails.send({...});
  }
});
```

---

## 📦 Import Changes

### UI Pages
```typescript
// Before:
import { api } from "@/convex/_generated/api";
const connection = useQuery(api.emails.getAdminConnection);

// After:
import { api } from "@/convex/_generated/api";
const connection = useQuery(api.emailQueries.getAdminConnection);
```

### Webhooks
```typescript
// Before:
await fetchMutation(api.emails.handleWebhookEvent, {...});

// After:
await fetchMutation(api.emailQueries.handleWebhookEvent, {...});
```

### Crons (No Change)
```typescript
// Still correct:
internal.emails.processScheduledCampaigns  // These are actions
internal.emails.processAutomationTriggers
internal.emails.cleanupOldLogs
```

---

## ✅ Updated Files

### Created:
- `convex/emailQueries.ts` - All queries & mutations
- `EMAIL_FILE_STRUCTURE.md` - This file

### Modified:
- `convex/emails.ts` - Now only actions
- `app/admin/emails/page.tsx` - Updated imports
- `app/(dashboard)/store/[storeId]/emails/page.tsx` - Updated imports
- `app/api/webhooks/resend/route.ts` - Updated imports

### Backed Up:
- `convex/emails.ts.backup` - Original file (for reference)

---

## 🎯 Why This Structure?

### Separation of Concerns
- **Actions** (emails.ts) - Handle external API calls (Resend)
- **Queries/Mutations** (emailQueries.ts) - Handle database operations

### Follows Convex Best Practices
- Node.js runtime only for actions that need it
- V8 runtime (faster) for database operations
- Clear separation makes code easier to maintain

### Performance
- V8 queries/mutations are faster than Node.js
- Only use Node.js when absolutely necessary (Resend API)

---

## 🚀 Deployment

**Status:** ✅ Ready to deploy

All TypeScript errors resolved. The system now correctly:
- Uses Node.js runtime only for actions
- Uses V8 runtime for all queries and mutations
- Maintains all functionality from original implementation

**Deploy command:**
```bash
npx convex deploy
```

---

## 📚 Quick Reference

### Need to create a campaign?
→ Use `api.emailQueries.createCampaign`

### Need to send a campaign?
→ Calls `internal.emails.processCampaign` automatically

### Need to check analytics?
→ Use `api.emailQueries.getEmailAnalytics`

### Need to handle webhook?
→ Use `api.emailQueries.handleWebhookEvent`

---

**All 7 components still work exactly the same!** 🎉

The split is purely internal - from the outside, everything functions identically.

