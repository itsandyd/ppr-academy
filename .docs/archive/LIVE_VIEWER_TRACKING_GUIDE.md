# Real-time Live Viewer Tracking - Implementation Guide

## ✅ What Was Implemented

### Backend (Convex)

1. **`convex/liveViewers.ts`** - Core tracking system
   - `recordPresence` - Mutation to record/update viewer heartbeat
   - `getLiveViewerCount` - Query to get current viewer count
   - `getActiveViewers` - Query to get list of viewers with details
   - `removePresence` - Mutation to remove a viewer
   - `cleanupExpiredViewers` - Internal mutation for cleanup

2. **`convex/schema.ts`** - Database table
   - Added `liveViewers` table with indexes:
     - `by_course` - Query all viewers for a course
     - `by_course_user` - Check if specific user is viewing
     - `by_expiresAt` - Find expired viewers for cleanup

3. **`convex/crons.ts`** - Automated cleanup
   - Cron job runs every 5 minutes to remove expired viewers
   - Viewers expire 60 seconds after last heartbeat

### Frontend

4. **`app/library/courses/[slug]/components/LiveViewerBadge.tsx`**
   - Real-time badge showing viewer count
   - Animated "eye" icon with pulse effect
   - Tooltip showing viewer names and avatars
   - Automatic heartbeat every 30 seconds
   - Cleanup on component unmount

5. **Integrated into Course Player**
   - Added to `app/library/courses/[slug]/page.tsx`
   - Shows live viewer count in header
   - Updates in real-time as viewers join/leave

## 🎯 Features

- ✅ Real-time viewer tracking
- ✅ Automatic presence heartbeat (30s intervals)
- ✅ Viewer expiration (60s without heartbeat)
- ✅ Animated badge with pulse effect
- ✅ Viewer names and avatars in tooltip
- ✅ Chapter-level tracking
- ✅ Automatic cleanup of expired viewers
- ✅ Optimistic presence updates

## 📊 How It Works

1. **User enters course page**
   - `LiveViewerBadge` component mounts
   - Sends initial `recordPresence` heartbeat
   - Starts 30-second interval for heartbeats

2. **Continuous tracking**
   - Every 30 seconds, client sends heartbeat
   - Server updates `lastSeen` and `expiresAt` timestamps
   - Viewers are considered "active" if heartbeat < 60s ago

3. **Viewer count updates**
   - `getLiveViewerCount` query runs reactively
   - Returns total count and per-chapter breakdown
   - Badge updates in real-time via Convex subscriptions

4. **User leaves course page**
   - Component unmount triggers `removePresence`
   - Viewer record deleted immediately
   - If browser crashes, cron cleans up after 60s

5. **Automated cleanup**
   - Cron runs every 5 minutes
   - Deletes all records where `expiresAt < now()`
   - Keeps database clean and performant

## 🚀 Usage

```tsx
import { LiveViewerBadge } from "./components/LiveViewerBadge";

// Basic usage - course level
<LiveViewerBadge courseId={courseData._id} />

// With chapter tracking
<LiveViewerBadge 
  courseId={courseData._id} 
  chapterId={selectedChapter} 
/>

// With viewer avatars
<LiveViewerBadge 
  courseId={courseData._id} 
  showAvatars={true} 
/>
```

## 🎨 Customization

The badge uses Tailwind classes and can be customized:
- **Colors**: `bg-emerald-500/10 text-emerald-600`
- **Animation**: Framer Motion pulse effect
- **Size**: Compact badge with icon + count
- **Tooltip**: Shows up to 5 viewers with names/avatars

## 📈 Performance Considerations

- **Heartbeat frequency**: 30s (adjustable if needed)
- **Expiration time**: 60s (balances accuracy vs DB load)
- **Cleanup frequency**: 5 minutes (prevents DB bloat)
- **Query limits**: Max 20 viewers in `getActiveViewers`
- **Indexes**: Optimized for fast lookups by course/user

## 🔮 Future Enhancements

Potential additions:
- **Heatmap**: Show which chapters have most viewers
- **Notifications**: Alert creator when viewers join
- **Analytics**: Track peak viewing times
- **Collaborative features**: Enable chat between viewers
- **Privacy mode**: Allow anonymous viewing
- **Course-wide stats**: Total concurrent viewers across all courses

## 🧪 Testing

To test the feature:
1. Open a course in two browser windows
2. Watch the viewer count increase
3. Close one window, count should decrease
4. Wait 60s after closing without cleanup - viewer expires
5. Check tooltip to see viewer names/avatars

## 🐛 Troubleshooting

**Viewer count not updating:**
- Check browser console for Convex connection errors
- Verify Convex deployment is running
- Ensure user is authenticated (Clerk)

**Stale viewers not removing:**
- Check cron job is running (`convex deploy`)
- Verify `cleanupExpiredViewers` function exists
- Check `expiresAt` timestamps in database

**Performance issues:**
- Consider increasing heartbeat interval
- Add pagination to `getActiveViewers`
- Implement caching for viewer counts

