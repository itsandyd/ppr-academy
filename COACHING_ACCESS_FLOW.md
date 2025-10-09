# 🔄 Coaching Session Access Flow

## Visual Timeline

```
DAY 1: Student Books Session (Oct 9, 9:00 AM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Payment processed
✅ Session saved to DB (status: SCHEDULED)
✅ Confirmation email sent
❌ NO Discord access yet

⏱️  Waiting period... (can be days/weeks)


DAY 5: 2 Hours Before Session (Oct 14, 11:00 AM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 CRON JOB RUNS (automatically)

🟢 SETUP PHASE TRIGGERED:
   1. Create Role: "Session abc12345"
   2. Create Channel: "🎤 coaching-abc12345"
   3. Set Permissions: Only this role can access
   4. Assign Role → Student
   5. Assign Role → Coach
   6. Mark: discordSetupComplete = true

✅ Student can now see channel in Discord!
✅ Coach can now see channel in Discord!


DAY 5: Session Time (Oct 14, 1:00 PM - 2:00 PM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 Coaching session happens
🎤 Both parties use the private voice channel


DAY 5: 1 Hour After Session (Oct 14, 3:00 PM)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 CRON JOB RUNS (automatically)

🔴 CLEANUP PHASE TRIGGERED:
   1. Delete Channel: "🎤 coaching-abc12345"
   2. Delete Role: "Session abc12345"
   3. Mark: discordCleanedUp = true

✅ Channel removed from Discord
✅ Roles automatically revoked
✅ Server stays clean!
```

## Multiple Concurrent Sessions

```
Same Day, Same Time (Oct 14, 1:00 PM):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SESSION 1: Coach Sarah + Student John
├── Role: "Session abc12345"
├── Channel: "🎤 coaching-abc12345"
└── Access: Only Sarah + John

SESSION 2: Coach Mike + Student Emma
├── Role: "Session def67890"
├── Channel: "🎤 coaching-def67890"
└── Access: Only Mike + Emma

SESSION 3: Coach Sarah + Student Alex
├── Role: "Session xyz54321"
├── Channel: "🎤 coaching-xyz54321"
└── Access: Only Sarah + Alex

✅ Complete isolation - no overlap possible!
✅ Same coach can have multiple sessions
✅ Each student sees only their channel
```

## Cron Job Schedule

```
Every 15 Minutes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

12:00 PM ─┐
12:15 PM  │ 🤖 Cron checks:
12:30 PM  │    • Any sessions starting in 2-3 hours? → Setup
12:45 PM  │    • Any sessions ended >1 hour ago? → Cleanup
1:00 PM   │
1:15 PM   │ (Runs continuously, 24/7)
1:30 PM   │
1:45 PM   │
2:00 PM  ─┘

Fast Response Time:
├── Setup: 2-3 hours before (120-180 min notice)
├── Check Interval: Every 15 minutes
└── Cleanup: 1+ hours after (60+ min buffer)
```

## State Diagram

```
                    ┌─────────────┐
                    │   BOOKED    │
                    └──────┬──────┘
                           │
                    (time passes)
                           │
            ┌──────────────▼──────────────┐
            │  2 Hours Before Session     │
            │  Cron: Check for setup      │
            └──────────────┬──────────────┘
                           │
                    ✅ Create Resources
                           │
                    ┌──────▼──────┐
                    │ ACCESS      │
                    │ GRANTED     │
                    └──────┬──────┘
                           │
                    (session happens)
                           │
            ┌──────────────▼──────────────┐
            │  1 Hour After Session       │
            │  Cron: Check for cleanup    │
            └──────────────┬──────────────┘
                           │
                    🗑️  Delete Resources
                           │
                    ┌──────▼──────┐
                    │  CLEANED    │
                    │  UP         │
                    └─────────────┘
```

## Database States

```typescript
// AT BOOKING TIME
{
  _id: "session_123",
  status: "SCHEDULED",
  scheduledDate: 1697288400000, // Oct 14, 1:00 PM
  discordSetupComplete: false,    // Not yet!
  discordCleanedUp: false,        // Not yet!
  discordChannelId: undefined,
  discordRoleId: undefined
}

// AFTER SETUP (2 hours before)
{
  _id: "session_123",
  status: "SCHEDULED",
  scheduledDate: 1697288400000,
  discordSetupComplete: true,     // ✅ Done!
  discordCleanedUp: false,
  discordChannelId: "1234567890", // ✅ Created!
  discordRoleId: "0987654321"     // ✅ Created!
}

// AFTER CLEANUP (1 hour after)
{
  _id: "session_123",
  status: "COMPLETED",
  scheduledDate: 1697288400000,
  discordSetupComplete: true,
  discordCleanedUp: true,         // ✅ Done!
  discordChannelId: "1234567890", // (deleted from Discord)
  discordRoleId: "0987654321"     // (deleted from Discord)
}
```

## Error Handling Flow

```
Cron Job Runs
     │
     ├─▶ Get sessions needing setup
     │        │
     │        ├─▶ Session 1: ✅ Success
     │        │
     │        ├─▶ Session 2: ❌ Error (bot token invalid)
     │        │        └─▶ Log error, continue to next
     │        │
     │        └─▶ Session 3: ✅ Success
     │
     └─▶ Get sessions needing cleanup
              │
              ├─▶ Session 4: ✅ Success
              │
              └─▶ Session 5: ✅ Success

✅ One failure doesn't stop the whole job!
✅ Each session is processed independently
✅ Errors logged for troubleshooting
```

## Time Windows Explained

### Setup Window: 2-3 Hours Before

**Why 2 hours?**
- Gives students time to test audio/video
- Allows for any last-minute Discord connection issues
- Not too early (student sees it when relevant)

**Why 3 hour buffer?**
- Cron runs every 15 min, need overlap window
- Ensures we don't miss the window
- Session won't be setup twice (flag prevents it)

### Cleanup Window: 1+ Hour After

**Why 1 hour?**
- Allows for overtime discussions
- Coach can share final resources/links
- Students can ask follow-up questions

**Why not immediate?**
- Session might run over time
- Better user experience (not rushed out)
- Can use channel for brief follow-up

## Customization Options

Want different timings? Edit `coachingSessionManager.ts`:

```typescript
// SETUP: Change from 2 hours to 1 hour before
const oneHourFromNow = now + 1 * 60 * 60 * 1000;
const twoHoursFromNow = now + 2 * 60 * 60 * 1000;

// CLEANUP: Change from 1 hour to 30 min after
const thirtyMinutesAgo = now - 0.5 * 60 * 60 * 1000;

// CRON FREQUENCY: Change from 15 min to 5 min
// In convex/crons.ts:
crons.interval(
  "manage coaching sessions",
  { minutes: 5 },  // Run more frequently
  internal.coachingSessionManager.manageCoachingSessions
);
```

## Summary

**Key Points:**
1. ⏰ Access is **time-gated** - not immediate
2. 🔒 Each session gets **unique** channel/role
3. 🤖 Fully **automated** - no manual work
4. 🧹 **Self-cleaning** - Discord stays organized
5. 📈 **Scalable** - handles any number of sessions

**Result:** Secure, private, automated coaching system! 🚀

