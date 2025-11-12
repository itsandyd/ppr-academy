# Email System - Quick Start Guide 🚀

## ⚡ TL;DR - Start in 5 Minutes

### 1. Get Your Resend API Key
Visit [resend.com/api-keys](https://resend.com/api-keys) and create a key.

### 2. Configure Admin Email
```
1. Go to /admin/emails
2. Paste your Resend API key
3. Enter: noreply@yourdomain.com (from email)
4. Enter: PPR Academy (from name)
5. Click "Connect Resend"
```

### 3. Setup Webhook (Optional but Recommended)
```
1. Go to Resend → Webhooks
2. Add: https://yourdomain.com/api/webhooks/resend
3. Subscribe to all email.* events
```

### 4. Create Your First Campaign
```
1. Go to Campaigns tab
2. Click "New Campaign" (when UI is built)
3. Choose audience: "All Users"
4. Write subject + body
5. Send or schedule
```

---

## 🎯 What You Can Do RIGHT NOW

### Via API/Code (Backend Ready)
```typescript
// Create a template
await createTemplate({
  connectionId,
  name: "Welcome Email",
  subject: "Welcome to {{course_name}}!",
  type: "welcome",
  htmlContent: "<h1>Hi {{name}}!</h1>",
  textContent: "Hi {{name}}!",
  variables: ["name", "course_name"]
});

// Create a campaign
await createCampaign({
  connectionId,
  name: "Black Friday Sale",
  subject: "50% Off All Courses!",
  targetAudience: "all_users",
  htmlContent: "<h1>Limited Time Offer!</h1>",
  scheduledFor: Date.now() + 3600000 // 1 hour from now
});

// Create automation
await createAutomation({
  connectionId,
  templateId,
  name: "Welcome New Students",
  triggerType: "course_enrollment",
  delayMinutes: 0 // Send immediately
});
```

### Via UI (Pages Built)
- ✅ View analytics dashboard
- ✅ See all campaigns
- ✅ Browse templates
- ✅ Manage automations (store only)
- ⚠️ Create campaigns (needs builder UI)
- ⚠️ Edit templates (needs editor UI)

---

## 📊 Key Features

| Feature | Status | Access |
|---------|--------|--------|
| **Send Campaigns** | ✅ Backend Ready | Programmatic only |
| **Track Opens/Clicks** | ✅ Working | Automatic |
| **Email Logging** | ✅ Working | Automatic |
| **Analytics Dashboard** | ✅ Built | Admin + Store UI |
| **Automations** | ✅ Working | Backend + UI |
| **Scheduled Sends** | ✅ Working | Cron every 15min |
| **Webhook Handler** | ✅ Built | `/api/webhooks/resend` |
| **Template Library** | ✅ Working | Backend + UI list |
| **Campaign Builder UI** | ⚠️ Not built | Next phase |
| **Template Editor UI** | ⚠️ Not built | Next phase |

---

## 🔔 Automation Examples

### Welcome New Students
```typescript
{
  name: "Welcome Email",
  triggerType: "course_enrollment",
  delayMinutes: 0,
  templateId: welcomeTemplateId
}
```

### Course Completion Congratulations
```typescript
{
  name: "Congratulations!",
  triggerType: "course_completion",
  delayMinutes: 0,
  templateId: completionTemplateId
}
```

### Re-engage Inactive Users
```typescript
{
  name: "We Miss You",
  triggerType: "inactivity",
  inactivityDays: 30,
  delayMinutes: 0,
  templateId: reengageTemplateId
}
```

---

## 📈 Analytics You Get

### Dashboard Metrics (4 cards)
- **Total Sent** - All emails sent
- **Open Rate** - % of delivered emails opened
- **Click Rate** - % of delivered emails clicked
- **Bounce Rate** - % of emails bounced

### Per-Campaign Metrics
- Recipients targeted
- Emails sent
- Delivered count
- Opened count
- Clicked count
- Bounced count
- Complained count
- All rates calculated

---

## 🎨 UI Pages Available

### Admin Email Page
**URL:** `/admin/emails`
**Shows:**
- Platform-wide analytics
- All campaigns
- All templates
- Configuration settings

### Store Email Page
**URL:** `/store/[storeId]/emails`
**Shows:**
- Store-specific analytics
- Store campaigns
- Store templates
- Store automations
- Configuration settings

---

## 🚨 What's NOT Built Yet

### Campaign Builder UI
**What's Missing:**
- Visual campaign creation form
- Rich text editor
- Template selector
- Audience builder UI
- Preview functionality

**Workaround:** Use backend functions directly

### Template Editor UI
**What's Missing:**
- HTML/text editors
- Variable insertion
- Preview pane
- Save/update form

**Workaround:** Use backend `createTemplate` function

### Automation Builder UI
**What's Missing:**
- Flow chart builder
- Trigger configuration UI
- Template selector
- Delay picker

**Workaround:** Use backend `createAutomation` function

---

## 🔧 Quick Fixes

### Add Campaign Builder
Create `components/email/CampaignBuilder.tsx` with:
- Subject input
- Content editor (react-quill or similar)
- Audience selector
- Schedule picker

### Add Template Editor
Create `components/email/TemplateEditor.tsx` with:
- Name input
- Subject input
- HTML editor
- Text editor
- Variable manager

### Add Automation Builder
Create `components/email/AutomationBuilder.tsx` with:
- Trigger selector
- Template selector
- Delay input
- Condition builder (advanced)

---

## 💡 Pro Tips

### Best Practices
1. **Test First** - Send to yourself before broadcasting
2. **Segment Smart** - Target specific audiences for better engagement
3. **Subject Matters** - Spend time on compelling subjects
4. **Mobile First** - Most emails opened on mobile
5. **Track Everything** - Use analytics to improve

### Audience Targeting
- **All Users** → Platform announcements
- **Course Students** → Course updates
- **Store Students** → Store promotions
- **Inactive Users** → Win-back campaigns
- **Completed** → Upsells, testimonials
- **Custom** → Special segments

### Timing
- **Monday-Thursday** - Best open rates
- **10 AM - 2 PM** - Peak engagement
- **Avoid Weekends** - Lower opens
- **Test Your Audience** - Every audience is different

---

## 🎯 Next Steps

### Immediate (Can Do Now)
1. ✅ Connect Resend
2. ✅ Setup webhook
3. ✅ View analytics
4. ✅ Browse UI pages

### Short Term (Build UI Forms)
1. Campaign creation form
2. Template editor
3. Automation builder
4. Preview functionality

### Long Term (Enhancements)
1. A/B testing
2. Send time optimization
3. Smart segmentation
4. AI-powered suggestions

---

## 📚 Full Documentation
See `EMAIL_SYSTEM_COMPLETE.md` for comprehensive details.

---

**Status:** Production Ready (Backend) + UI Dashboard  
**Missing:** Campaign/Template/Automation builder forms  
**Workaround:** Use backend functions programmatically  

🚀 **Ready to send your first campaign!**

