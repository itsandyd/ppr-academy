# ⏰ Coaching Session Time-Gated Access

## Problem Solved

Previously, when a student booked a coaching session, they would get immediate access to the Discord channel. This caused several issues:

1. ❌ Student books session 2 weeks in advance → gets channel access immediately
2. ❌ Session 1 in Channel 5 ends → Student still has access
3. ❌ Session 2 in Channel 5 starts days later → Old student could accidentally join
4. ❌ Discord server cluttered with old channels/roles

## Solution: Automated Time-Gated Access

We now use a **cron job** that runs every 15 minutes to automatically manage session access:

### Timeline

```
Student Books Session
        ↓
    (wait time)
        ↓
🟢 2 Hours Before Session
   ├── Create unique Discord channel
   ├── Create unique Discord role
   ├── Assign role to student
   └── Assign role to coach
        ↓
    📞 Session Happens
        ↓
🔴 1 Hour After Session
   ├── Delete Discord channel
   ├── Delete Discord role
   └── Revoke all access
```

## How It Works

### 1. Booking Time
When a student books a coaching session:
- ✅ Session saved to database with status `SCHEDULED`
- ✅ Payment processed
- ✅ Confirmation email sent
- ❌ **NO Discord access yet** (this is key!)

### 2. Setup Time (2 hours before)
Cron job detects session starting soon:
```typescript
// Check: Is session in 2-3 hour window?
const twoHoursFromNow = now + 2 * 60 * 60 * 1000;
const threeHoursFromNow = now + 3 * 60 * 60 * 1000;
```

If yes, automatically:
1. **Create unique role**: `Session abc12345`
2. **Create private channel**: `🎤 coaching-abc12345`
3. **Set permissions**: Only this role can view/join
4. **Assign to student**: Student gets the role
5. **Assign to coach**: Coach gets the role
6. **Mark as setup**: `discordSetupComplete = true`

### 3. Cleanup Time (1 hour after)
Cron job detects session ended:
```typescript
// Check: Did session end >1 hour ago?
const oneHourAgo = now - 1 * 60 * 60 * 1000;
```

If yes, automatically:
1. **Delete channel**: Remove from Discord
2. **Delete role**: Remove from Discord
3. **Mark as cleaned**: `discordCleanedUp = true`

## Technical Implementation

### Files Created

#### `convex/coachingSessionManager.ts`
Main cron job logic:
- `manageCoachingSessions` - Main action that runs every 15 minutes
- `getSessionsNeedingSetup` - Find sessions starting in 2-3 hours
- `getSessionsNeedingCleanup` - Find sessions ended >1 hour ago
- `setupSessionAccess` - Create channel/role and grant access
- `cleanupSessionAccess` - Delete channel/role and revoke access

#### `convex/crons.ts`
Cron job registration:
```typescript
crons.interval(
  "manage coaching sessions",
  { minutes: 15 },
  internal.coachingSessionManager.manageCoachingSessions
);
```

### Schema Updates

#### `convex/schema.ts`
Added to `coachingSessions` table:
```typescript
discordChannelId: v.optional(v.string()),      // Channel ID created
discordRoleId: v.optional(v.string()),          // Role ID created
discordSetupComplete: v.optional(v.boolean()),  // Setup done?
discordCleanedUp: v.optional(v.boolean()),      // Cleanup done?
```

## Benefits

### 🔒 Security & Privacy
- Students can't access channels until close to session time
- No risk of joining wrong session (unique channel per session)
- Old participants can't access recycled channels

### 🧹 Clean Discord Server
- Channels automatically deleted after sessions
- Roles automatically cleaned up
- No manual Discord management needed

### ⚡ Scalability
- Works for 1 session or 1000 simultaneous sessions
- Each coach can have multiple concurrent sessions
- No configuration needed - fully automated

### 💪 Robust
- Cron job runs every 15 minutes (reliable)
- Handles failures gracefully (logs errors, continues)
- Can be manually triggered if needed

## Testing

### Manual Testing

1. **Test Setup (without waiting 2 hours)**:
```typescript
// In Convex dashboard, run:
await ctx.runAction(
  internal.coachingSessionManager.manageCoachingSessions,
  {}
);
```

2. **Test Cleanup**:
```typescript
// Mark session as completed, then run cron again
await ctx.runMutation(api.coachingSessions.updateSessionStatus, {
  sessionId: "...",
  status: "COMPLETED"
});
```

### What to Check

#### After Setup (2 hours before session):
- [ ] Discord channel created (name: `coaching-xxxxxxxx`)
- [ ] Discord role created (name: `Session xxxxxxxx`)
- [ ] Student has the role
- [ ] Coach has the role (if connected to Discord)
- [ ] Only these users can see the channel
- [ ] Database updated: `discordSetupComplete = true`

#### After Cleanup (1 hour after session):
- [ ] Discord channel deleted
- [ ] Discord role deleted
- [ ] Database updated: `discordCleanedUp = true`
- [ ] Session status is `COMPLETED`

## Timing Configuration

Current settings (in `coachingSessionManager.ts`):

```typescript
// Setup window: 2-3 hours before session
const twoHoursFromNow = now + 2 * 60 * 60 * 1000;
const threeHoursFromNow = now + 3 * 60 * 60 * 1000;

// Cleanup window: >1 hour after session
const oneHourAgo = now - 1 * 60 * 60 * 1000;
```

**To adjust timings**, modify these constants:
- Want 1 hour before? Change `2` to `1`
- Want 30 min cleanup buffer? Change `1` to `0.5`

## Monitoring

### Check Cron Status
1. Go to Convex Dashboard
2. Click "Crons" in sidebar
3. View "manage coaching sessions" runs
4. Check for errors

### Check Session Status
```typescript
// Query sessions in setup phase
const sessionsSetup = await ctx.db
  .query("coachingSessions")
  .filter(q => q.eq(q.field("discordSetupComplete"), true))
  .collect();

// Query sessions cleaned up
const sessionsCleaned = await ctx.db
  .query("coachingSessions")
  .filter(q => q.eq(q.field("discordCleanedUp"), true))
  .collect();
```

## Troubleshooting

### Session not getting Discord access

**Check:**
1. Is session <2 hours away? (Too early)
2. Is session >3 hours away? (Too late)
3. Is student Discord connected?
4. Is coach's Discord server setup?
5. Check cron job logs for errors

**Solution:**
- Wait for cron to run (every 15 min)
- Or manually trigger cron in dashboard

### Channels not cleaning up

**Check:**
1. Is session status `COMPLETED`?
2. Did session end >1 hour ago?
3. Check cron job logs

**Solution:**
- Update session status to `COMPLETED`
- Manually trigger cleanup if needed

### Bot token issues

**Error:** "Failed to create channel/role"

**Solution:**
1. Check bot token is valid in `discordGuilds` table
2. Verify bot has permissions:
   - Manage Roles
   - Manage Channels
   - Moderate Members

## Future Enhancements

### Possible Additions

1. **Custom Timing**
   - Allow coaches to set their own setup/cleanup windows
   - Different timing per product

2. **Session Reminders**
   - Send Discord DM 15 min before session
   - Include channel link

3. **Recording**
   - Auto-start recording when session begins
   - Save to coach's storage

4. **Analytics**
   - Track session duration
   - Monitor no-shows
   - Channel usage statistics

5. **Flexible Cleanup**
   - Option to keep channels for X days (for notes/follow-up)
   - Archive instead of delete

## Summary

✅ **Problem**: Students getting access too early/late, channel recycling issues  
✅ **Solution**: Automated time-gated access with unique channels per session  
✅ **Result**: Secure, private, scalable coaching system with zero manual work  

The cron job handles everything automatically - just book sessions and the system takes care of Discord access! 🚀

