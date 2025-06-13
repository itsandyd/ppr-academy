# 🎵 PPR Academy Coaching System Setup Guide

## 📋 System Overview

The PPR Academy coaching system provides:
- **Coach Schedule Management** - Coaches set availability through an intuitive calendar interface
- **Real-time Booking** - Students can only book available time slots
- **Discord Integration** - Automatic private channel creation and role assignment
- **Automated Session Management** - Cron jobs handle channel setup and access control

## 🔧 Environment Variables

Add these to your `.env` file:

```bash
# Discord Integration
DISCORD_CLIENT_ID=your_discord_application_client_id
DISCORD_CLIENT_SECRET=your_discord_application_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_server_id

# Cron Job Security (optional but recommended)
CRON_SECRET=your_secure_random_string_for_cron_auth

# App URL (for Discord OAuth redirect)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🤖 Discord Bot Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "PPR Academy Bot"
3. Go to "OAuth2" → "General" and copy the **Client ID** and **Client Secret**

### 2. Create Discord Bot

1. In your application, go to "Bot" section
2. Click "Add Bot" and copy the **Bot Token**
3. Enable these bot permissions:
   - `Manage Channels`
   - `Manage Roles` 
   - `View Channels`
   - `Send Messages`
   - `Connect` (for voice channels)
   - `Speak` (for voice channels)

### 3. OAuth2 Setup

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `identify`, `guilds.join`
3. Add redirect URI: `https://your-domain.com/api/auth/discord/callback`

### 4. Invite Bot to Server

1. In "OAuth2" → "URL Generator"
2. Select scopes: `bot`
3. Select permissions: `Manage Channels`, `Manage Roles`, `View Channels`, `Send Messages`, `Connect`, `Speak`
4. Use generated URL to invite bot to your Discord server

## ⚙️ Database Schema

The system uses these models (already added to your Prisma schema):

```prisma
model CoachingSession {
  id                   String                @id @default(cuid())
  coachId              String                // Coach's clerkId
  studentId            String                // Student's clerkId  
  scheduledDate        DateTime
  startTime            String                // "14:00"
  endTime              String                // "15:00"
  duration             Int                   // in minutes
  status               CoachingSessionStatus @default(SCHEDULED)
  notes                String?               @db.Text
  sessionType          String                @default("video")
  totalCost            Float
  discordChannelId     String?
  discordRoleId        String?
  discordSetupComplete Boolean               @default(false)
  reminderSent         Boolean               @default(false)
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  @@index([coachId])
  @@index([studentId])
  @@index([scheduledDate])
  @@index([status])
}

enum CoachingSessionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

## 🕐 Cron Job Setup

### Option 1: Vercel Cron Jobs (Recommended)

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-sessions",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use services like:
- **Cron-job.org** (free)
- **EasyCron** 
- **Zapier**

Configure to call: `https://your-domain.com/api/cron/process-sessions`
- **Frequency**: Every 5 minutes
- **Method**: GET
- **Headers**: `Authorization: Bearer your_cron_secret` (if using CRON_SECRET)

### Option 3: Self-hosted Cron

Add to your server's crontab:

```bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * curl -H "Authorization: Bearer your_cron_secret" https://your-domain.com/api/cron/process-sessions
```

## 🚀 System Workflow

### 1. Coach Setup
1. Coach applies through dashboard
2. Admin approves coach application
3. Coach sets availability using schedule manager
4. Coach profile becomes available for booking

### 2. Student Booking Process
1. Student browses available coaches
2. Student clicks "Book Session"
3. **Discord Check**: System verifies Discord authentication
4. **Availability Check**: Only available time slots are shown
5. Student selects date, time, duration, and adds notes
6. **Session Creation**: CoachingSession record created
7. **Confirmation**: Success message with session details

### 3. Automated Session Management

**15 minutes before session:**
- Cron job creates private Discord voice channel
- Channel permissions set to private (no access yet)
- `discordSetupComplete` set to `true`

**5 minutes before session:**
- Cron job grants channel access to coach and student
- Both participants can now see and join the channel

### 4. Discord Integration Features

**Automatic Channel Creation:**
- Private voice channels: `coaching-session-abc123`
- Only visible to session participants
- Automatic cleanup after session

**Permission Management:**
- Coach gets `CONNECT` + `SPEAK` + `VIEW_CHANNEL`
- Student gets `CONNECT` + `SPEAK` + `VIEW_CHANNEL`
- Channel is hidden from other server members

## 🎯 User Experience

### For Coaches:
1. **Dashboard Access**: Coaching tab in creator dashboard
2. **Schedule Management**: Visual calendar with time slot management
3. **Quick Setup**: Morning/afternoon/evening presets
4. **Profile Management**: Update bio, rates, specialties

### For Students:
1. **Browse Coaches**: Filter by specialty, see ratings and rates
2. **Real-time Availability**: Only see actually available slots
3. **Discord Required**: Must link Discord before booking
4. **Session Notes**: Add specific goals/requests

### For Admins:
1. **Coach Approval**: Review and approve/reject applications
2. **Debug Tools**: Monitor coach profiles and sessions
3. **System Health**: Track cron job execution

## 🔒 Security Features

- **Discord Verification**: Required before booking
- **Availability Validation**: Prevents double-booking
- **Cron Authentication**: Optional secret key for cron endpoints
- **Permission Isolation**: Each session gets isolated Discord channel

## 🐛 Debugging

### Check Cron Job Status
```bash
# Manual trigger (for testing)
curl -X POST https://your-domain.com/api/cron/process-sessions

# With authentication
curl -X POST -H "Authorization: Bearer your_cron_secret" https://your-domain.com/api/cron/process-sessions
```

### Common Issues

**Discord Auth Failing:**
- Check CLIENT_ID and CLIENT_SECRET
- Verify redirect URI matches exactly
- Ensure bot has proper permissions

**Cron Jobs Not Running:**
- Verify cron service is configured correctly
- Check server logs for errors
- Test manual endpoint trigger

**Channels Not Created:**
- Verify bot permissions in Discord server
- Check BOT_TOKEN and GUILD_ID
- Ensure bot is in the target server

## 📊 Monitoring

Track these metrics:
- Sessions created vs completed
- Discord channel creation success rate
- Cron job execution frequency
- Coach availability vs booking rate

## 🎉 Success! 

Your coaching system is now ready to:
- ✅ Let coaches manage their schedules
- ✅ Allow real-time session booking
- ✅ Automatically create Discord channels
- ✅ Grant session access at the right time
- ✅ Provide seamless coach-student experience

**Next Steps:**
1. Test the complete flow with a coach and student account
2. Monitor the cron job execution
3. Verify Discord channels are created properly
4. Add payment processing integration (future enhancement) 