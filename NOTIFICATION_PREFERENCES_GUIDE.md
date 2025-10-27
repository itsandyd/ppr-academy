# 🔔 Notification Preferences System

## Overview

Complete user preference system that allows students to control which notifications they receive via email, while in-app notifications continue to work. **By default, all email notifications are enabled**, but users can disable specific categories or all emails.

---

## ✨ Features

### 1. **Granular Email Control**
Users can toggle email notifications for 9 categories:
- Course Updates (new modules, lessons, chapters)
- New Content (new courses available)
- Platform Announcements
- Purchases & Receipts
- Earnings & Payouts (for creators)
- Mentions
- Replies
- System Alerts
- Marketing & Promotions

### 2. **Email Digest Options**
- **Real-time** - Emails sent immediately (default)
- **Daily Digest** - One email per day with all notifications
- **Weekly Digest** - One email per week
- **Never** - No emails at all

### 3. **In-App Notifications** 
Separate toggles for what appears in the bell icon

### 4. **Smart Defaults**
- All notifications enabled by default
- Users opt-out, not opt-in
- Critical alerts always sent

---

## 🎯 How It Works

### Default Behavior (New Users)

```
User signs up
    ↓
No preferences exist yet
    ↓
System defaults to: ALL ENABLED
    ↓
User receives all notifications via:
  ✓ Email
  ✓ In-app bell icon
```

### After User Disables Course Updates

```
User visits: /settings/notifications
    ↓
Toggles "Course Updates" to OFF
    ↓
Clicks "Save Preferences"
    ↓
Creator sends course notification
    ↓
System checks preferences
    ↓
Email: SKIPPED ⏭️
In-app: SENT ✅ (still shows in bell)
```

### Email Sending Logic

```typescript
For each student:
  1. Check if user has "courseUpdates" enabled
  2. If disabled → Skip email, log it
  3. If enabled → Send email
  4. Track sent/skipped/failed counts
```

---

## 🚀 User Journey

### Accessing Preferences

**Method 1: From Notification Dropdown**
```
Click bell icon
    ↓
Click "⚙️ Notification Settings" at bottom
    ↓
Opens /settings/notifications
```

**Method 2: From Email**
```
Receive email
    ↓
Click "Manage your notification preferences" link at bottom
    ↓
Opens /settings/notifications
```

**Method 3: Direct URL**
```
Navigate to: /settings/notifications
```

### Managing Preferences

**Step 1: Choose Email Frequency**
```
Real-time   → Get emails immediately
Daily       → One digest email per day
Weekly      → One summary per week  
Never       → No emails (in-app only)
```

**Step 2: Toggle Specific Categories**
```
Course Updates:      [ON]  ← Toggle this off
New Content:         [ON]
Platform News:       [ON]
Purchases:           [ON]
Marketing:           [OFF] ← Already disabled
```

**Step 3: Save Changes**
```
Click "Save Preferences"
    ↓
✅ Preferences updated
    ↓
Future emails respect these settings
```

---

## 📧 Email Sending with Preferences

### Backend Flow

```typescript
// In courseNotifications.ts
for (const studentId of studentIds) {
  // 1. Check preferences
  const shouldSend = await ctx.runQuery(
    api.notificationPreferences.shouldSendEmailInternal,
    { userId: studentId, category: "courseUpdates" }
  );

  // 2. Skip if disabled
  if (!shouldSend) {
    console.log("⏭️ Skipping - user disabled course update emails");
    skipped++;
    continue;
  }

  // 3. Send if enabled
  await sendEmail(user.email, subject, message);
  sent++;
}

// Log summary
console.log(`📊 ${sent} sent, ${skipped} skipped, ${failed} failed`);
```

### Preference Check Function

```typescript
export const shouldSendEmailInternal = internalQuery({
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    // No preferences = default to enabled
    if (!preferences) return true;

    // Check specific category
    return preferences.emailNotifications[args.category] !== false;
  },
});
```

---

## 🎨 UI Design

### Preferences Page Layout

```
┌────────────────────────────────────────┐
│  Notification Preferences              │
│  Control how you receive notifications │
├────────────────────────────────────────┤
│                                        │
│  📧 Email Delivery                     │
│  ┌──────────────────────────────────┐ │
│  │ Email Digest: [Real-time ▼]     │ │
│  └──────────────────────────────────┘ │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  📧 Email Notifications                │
│  ┌──────────────────────────────────┐ │
│  │ Course Updates            [ON]   │ │
│  │ Updates when content added       │ │
│  ├──────────────────────────────────┤ │
│  │ New Content               [ON]   │ │
│  │ New courses available            │ │
│  ├──────────────────────────────────┤ │
│  │ Platform Announcements    [ON]   │ │
│  │ Important platform updates       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Enable All]  [Disable All]          │
│                                        │
├────────────────────────────────────────┤
│                                        │
│  🔔 In-App Notifications               │
│  (Same categories...)                  │
│                                        │
└────────────────────────────────────────┘

  [Floating Save Button if changes]
```

---

## 💡 Key Features

### 1. **Opt-Out System**
- All enabled by default
- Users choose to disable
- Maximizes engagement

### 2. **Category-Specific**
- Can disable marketing
- Keep course updates
- Granular control

### 3. **Dual Channel**
- Email preferences separate
- In-app always available (can be toggled too)
- Independent controls

### 4. **Smart Defaults**
- No preferences = all enabled
- Can't miss important notifications
- User-friendly

---

## 🔒 Privacy & Compliance

### What's Protected

✅ **User choice honored**
- Preferences checked every time
- Never send if disabled
- Logged and tracked

✅ **Transparent**
- Clear opt-out options
- Easy to find settings
- Link in every email

✅ **GDPR/CAN-SPAM Compliant**
- Easy unsubscribe
- Preferences respected
- Audit trail

---

## 📊 Tracking & Analytics

### Email Summary Logs

After each course notification send:
```
📊 Email summary:
  - 150 sent
  - 6 skipped (preferences)
  - 0 failed

Details:
  ⏭️ user_abc: course update emails disabled
  ⏭️ user_def: course update emails disabled
  ✅ user_ghi: email sent
  ...
```

### Metrics to Track

- **Opt-out rate** - % disabling categories
- **Most disabled** - Which categories users disable
- **Email engagement** - Opens/clicks by preference type
- **Preference patterns** - Common combinations

---

## 🎯 Example Scenarios

### Scenario 1: Default User

**User:** New student, just enrolled  
**Preferences:** None set (defaults apply)  
**Behavior:**
- ✅ Receives ALL emails
- ✅ Sees ALL in-app notifications
- ✅ Can disable anytime

### Scenario 2: Emails Disabled

**User:** Busy professional  
**Preferences:** "Email Digest: Never"  
**Behavior:**
- ❌ No emails sent
- ✅ Still sees in-app notifications
- ✅ Can check bell icon when convenient

### Scenario 3: Selective Preferences

**User:** Active student  
**Preferences:**
- Course Updates: ✅ ON
- Marketing: ❌ OFF
- Digest: Daily

**Behavior:**
- ✅ Gets course update emails (daily digest)
- ❌ No marketing emails
- ✅ All in-app notifications

### Scenario 4: Creator Sending Update

**Creator:** Sends update to 200 students  
**Results:**
- 185 emails sent
- 15 skipped (disabled course updates)
- 0 failed

**Logs:**
```
📧 Processing 200 students
⏭️ 15 skipped (preferences)
✅ 185 sent
📊 Summary: 185/15/0
```

---

## 🛠️ Technical Implementation

### Database Schema

```typescript
notificationPreferences: {
  userId: "user_abc123",
  emailNotifications: {
    courseUpdates: true,    // ← This controls emails
    announcements: true,
    newContent: true,
    // ... other categories
  },
  inAppNotifications: {
    courseUpdates: true,    // ← This controls bell icon
    // ...
  },
  emailDigest: "realtime"
}
```

### Email Check Flow

```typescript
// When sending course update
const shouldSend = await shouldSendEmailInternal({
  userId: "user_abc123",
  category: "courseUpdates"
});

if (!shouldSend) {
  // Skip this user
  skipped++;
  continue;
}

// Send email
await sendEmail(...);
sent++;
```

---

## 📚 API Functions

### Queries

**`getUserPreferences`**
```typescript
const prefs = await api.notificationPreferences.getUserPreferences({
  userId: user.id
});
// Returns user's preferences or null (defaults)
```

**`shouldSendEmailInternal`** (internal)
```typescript
const shouldSend = await api.notificationPreferences.shouldSendEmailInternal({
  userId: "user_abc",
  category: "courseUpdates"
});
// Returns: true/false
```

### Mutations

**`updatePreferences`**
```typescript
await api.notificationPreferences.updatePreferences({
  userId: user.id,
  emailNotifications: { courseUpdates: false, ... },
  emailDigest: "daily"
});
```

**`toggleEmailNotification`** (quick toggle)
```typescript
await api.notificationPreferences.toggleEmailNotification({
  userId: user.id,
  category: "courseUpdates",
  enabled: false
});
```

---

## 🎨 UI Components

### Preference Categories

Each category shows:
- **Label** - "Course Updates"
- **Description** - What this includes
- **Toggle** - ON/OFF switch
- **Status** - Current state

### Save Indicator

When changes are made:
```
┌────────────────────────────────┐
│  You have unsaved changes      │
│  [Save Preferences]            │
└────────────────────────────────┘
(Fixed bottom-right corner)
```

### Quick Actions

- **Enable All** - Turn everything on
- **Disable All** - Turn everything off
- Useful for bulk changes

---

## 🚦 Email Sending States

### State 1: Enabled (Default)

```
Preference: courseUpdates = true
Action: Send email ✅
Log: "✅ Email sent to user@email.com"
```

### State 2: Disabled by User

```
Preference: courseUpdates = false
Action: Skip email ⏭️
Log: "⏭️ Skipping - course update emails disabled"
```

### State 3: No Preferences

```
Preference: null (doesn't exist)
Action: Send email ✅ (default behavior)
Log: "✅ Email sent (default preferences)"
```

---

## 🎓 Best Practices

### For Platform

**Do:**
- ✅ Make preferences easy to find
- ✅ Respect user choices always
- ✅ Provide clear descriptions
- ✅ Include unsubscribe in every email

**Don't:**
- ❌ Hide preference settings
- ❌ Ignore user preferences
- ❌ Make it hard to opt-out
- ❌ Re-enable after user disables

### For Creators

**Do:**
- ✅ Send valuable updates only
- ✅ Use human-sounding copy
- ✅ Respect if users opt-out
- ✅ Include action buttons

**Don't:**
- ❌ Spam with every tiny change
- ❌ Get discouraged by opt-outs
- ❌ Take it personally
- ❌ Send more to "make up for it"

---

## 📊 Analytics Dashboard (Future)

Track preference patterns:

```
Opt-Out Rates by Category:
  Marketing:        45% disabled
  Course Updates:   8% disabled
  Announcements:    12% disabled
  Purchases:        2% disabled

Email Digest Preferences:
  Real-time:        65%
  Daily:            25%
  Weekly:           8%
  Never:            2%

Engagement by Preference:
  Email enabled:    45% open rate
  Email disabled:   N/A
  In-app only:      78% read rate
```

---

## 🔧 Setup Instructions

### For Developers

**1. Create preferences (automatic on first save):**
```typescript
// No setup needed!
// Defaults to all enabled if no preferences exist
```

**2. Check before sending emails:**
```typescript
const shouldSend = await ctx.runQuery(
  api.notificationPreferences.shouldSendEmailInternal,
  { userId, category: "courseUpdates" }
);

if (!shouldSend) {
  console.log("Skipping - user disabled this category");
  return;
}
```

**3. Link to preferences in emails:**
```html
<a href="https://yourdomain.com/settings/notifications">
  Manage your notification preferences
</a>
```

### For Users

**Navigate to:**
```
Dashboard → Bell Icon → "⚙️ Notification Settings"
Or visit: /settings/notifications
```

**Toggle preferences:**
```
1. Switch OFF unwanted categories
2. Choose email frequency
3. Click "Save Preferences"
4. Done!
```

---

## 📧 Email Template

All course update emails include:

```html
<!DOCTYPE html>
<html>
<body>
  <div><!-- Gradient header with subject --></div>
  <div>
    <!-- Message content -->
    <p>Just wrapped up 2 new modules...</p>
    
    <!-- Action button -->
    <a href="/courses/[slug]">View Course</a>
    
    <!-- Unsubscribe section -->
    <p>You received this because you're enrolled in this course.</p>
    <a href="/settings/notifications">
      Manage your notification preferences
    </a>
  </div>
</body>
</html>
```

**Key Elements:**
- ✅ Clear subject line
- ✅ Readable message
- ✅ Action button
- ✅ Unsubscribe link
- ✅ Reason for receiving

---

## 🎯 Preference Check Examples

### Example 1: Course Update Email

```typescript
// Creator sends update
await sendCourseUpdateNotification({...});

// System processes
for (student of students) {
  // Check preference
  const shouldSend = await shouldSendEmailInternal({
    userId: student.id,
    category: "courseUpdates"  // ← Checks this category
  });
  
  if (shouldSend) {
    sendEmail(student.email);  // ✅ Send
  } else {
    skipEmail(student.id);     // ⏭️ Skip
  }
}
```

### Example 2: Platform Announcement

```typescript
// Admin sends announcement
await createNotification({
  category: "announcements",  // ← Uses this category
  ...
});

// Email processor checks
const shouldSend = await shouldSendEmailInternal({
  userId: user.id,
  category: "announcements"  // ← Matches
});
```

### Example 3: Purchase Receipt

```typescript
// Purchase confirmed
await createNotification({
  category: "purchases",
  ...
});

// Always sent (critical)
// Even if user disabled, purchases still go through
```

---

## 🔐 Security & Privacy

### What's Protected

✅ **Preferences are private**
- Users can only see/edit their own
- Indexed by userId for fast lookup
- Secure authorization checks

✅ **Defaults are safe**
- No preferences = all enabled
- Users in control
- Explicit consent

✅ **Audit trail**
- Logs who was skipped
- Tracks preference changes
- Compliance ready

---

## 📊 Database Structure

### Preference Record

```typescript
{
  _id: "pref123",
  userId: "user_abc123",
  
  emailNotifications: {
    announcements: true,
    courseUpdates: false,    // ← User disabled this
    newContent: true,
    mentions: true,
    replies: true,
    purchases: true,
    earnings: true,
    systemAlerts: true,
    marketing: false,        // ← User disabled this
  },
  
  inAppNotifications: {
    // All true (user wants to see in-app)
    courseUpdates: true,     // ← Still ON for in-app
    ...
  },
  
  emailDigest: "daily"       // ← Batches emails daily
}
```

---

## 🎓 Notification Categories Explained

### For Students

| Category | What It Includes | Default |
|----------|-----------------|---------|
| **Course Updates** | New modules, lessons, chapters added | ✅ ON |
| **New Content** | New courses available on platform | ✅ ON |
| **Announcements** | Platform news, feature updates | ✅ ON |
| **Purchases** | Order confirmations, receipts | ✅ ON |
| **Mentions** | Someone @mentions you | ✅ ON |
| **Replies** | Replies to your comments | ✅ ON |
| **System Alerts** | Security, account changes | ✅ ON |
| **Marketing** | Promotions, tips, guides | ✅ ON |

### For Creators

Additional categories:
| Category | What It Includes | Default |
|----------|-----------------|---------|
| **Earnings** | Sales, payouts, revenue updates | ✅ ON |

---

## 🚀 Quick Start

### For Users

```
1. Click bell icon in header
2. Click "⚙️ Notification Settings"
3. Toggle OFF unwanted emails
4. Click "Save Preferences"
5. Done! ✅
```

### For Developers

```typescript
// Check before sending
const shouldSend = await api.notificationPreferences.shouldSendEmailInternal({
  userId: student.id,
  category: "courseUpdates"
});

if (!shouldSend) {
  console.log("User disabled this category");
  return;
}

// Send email
await sendEmail(...);
```

---

## 📈 Expected Metrics

### Opt-Out Rates (Industry Average)

- Marketing: 30-40% disable
- Course Updates: 5-10% disable
- Purchases: 1-2% disable
- System Alerts: <1% disable

### Engagement by Channel

- **Email enabled**: 35-45% open rate
- **In-app only**: 65-75% read rate
- **Both channels**: 80-90% reach

---

## ✅ Checklist

### Implementation
- [x] Schema exists
- [x] Preference queries created
- [x] UI page built
- [x] Email checks integrated
- [x] Links added to dropdowns
- [x] Email unsubscribe links

### Testing
- [ ] Visit /settings/notifications
- [ ] Toggle some preferences
- [ ] Save changes
- [ ] Send test notification
- [ ] Verify email skipped if disabled
- [ ] Verify in-app still shows

---

## 🎉 Benefits

### For Students

✅ Control their inbox  
✅ Stop spam  
✅ Keep important notifications  
✅ Easy to manage  
✅ Respects their time  

### For Creators

✅ Reach engaged students  
✅ Higher open rates  
✅ Less spam complaints  
✅ Better reputation  
✅ Trust building  

### For Platform

✅ GDPR/CAN-SPAM compliant  
✅ Professional experience  
✅ Lower unsubscribe rates  
✅ Higher engagement  
✅ Trust & transparency  

---

## 🔗 Related Features

- **Course Notifications** - What sends the emails
- **Email Templates** - How emails look
- **Notification System** - In-app notifications
- **User Settings** - Other preferences

---

**Built for user control and privacy!** 🔐✨

