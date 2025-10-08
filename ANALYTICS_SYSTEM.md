# Analytics & Reporting System

## Overview

The PPR Academy Analytics System provides comprehensive insights for both creators and students. It tracks user behavior, course performance, revenue metrics, and generates personalized recommendations.

---

## Features

### ✅ Creator Analytics
- **Revenue Dashboard**: Track earnings, transactions, and customer metrics
- **Student Enrollment Trends**: Monitor course views and conversions
- **Course Completion Rates**: See how many students finish courses
- **Drop-off Point Detection**: Identify where students stop
- **At-Risk Student Identification**: Find students who need engagement
- **Chapter Performance**: See which content performs best
- **Certificate Issuance Tracking**: Monitor course completions

### ✅ Student Analytics
- **Personal Learning Dashboard**: Track progress across all courses
- **Learning Streaks**: Gamified daily learning tracking
- **Time Spent Analysis**: See total learning hours
- **Skill Progression**: Visualize course completion
- **Engagement Scoring**: Get feedback on learning habits
- **Performance vs Peers**: See how you compare (percentile)
- **Personalized Recommendations**: Get course suggestions

### ✅ Event Tracking
- Course views, enrollments, completions
- Chapter starts and completions
- Video watch analytics
- Purchase events
- Q&A interactions
- Certificate shares

---

## Database Schema

### 1. User Events (`userEvents`)
Tracks all user interactions across the platform.

```typescript
{
  userId: string,
  eventType: union(
    "course_viewed", "course_enrolled", "chapter_started",
    "chapter_completed", "course_completed", "video_played",
    "video_paused", "video_progress", "checkout_started",
    "purchase_completed", "refund_requested", "question_asked",
    "answer_posted", "comment_posted", "content_liked",
    "certificate_shared", "course_reviewed", "login",
    "logout", "profile_updated"
  ),
  courseId?: Id<"courses">,
  chapterId?: string,
  productId?: Id<"digitalProducts">,
  metadata?: any,
  timestamp: number,
  sessionId?: string,
  deviceType?: string,
  browserInfo?: string,
}
```

**Indexes:**
- `by_user`: Query user's activity timeline
- `by_course`: Get all events for a course
- `by_event_type`: Aggregate specific event types
- `by_user_and_event`: Filter user's specific events

### 2. Video Analytics (`videoAnalytics`)
Detailed video watching behavior.

```typescript
{
  chapterId: string,
  courseId: Id<"courses">,
  userId: string,
  watchDuration: number,        // Seconds watched
  videoDuration: number,         // Total video length
  percentWatched: number,        // 0-100
  dropOffPoint?: number,         // Timestamp where stopped
  completedWatch: boolean,       // Watched to end
  rewatches: number,             // Times rewatched
  playbackSpeed?: number,        // 0.5, 1.0, 1.25, 1.5, 2.0
  qualitySetting?: string,       // "auto", "720p", "1080p"
  timestamp: number,
  sessionId?: string,
}
```

**Use Cases:**
- Identify difficult content (high rewatches)
- Find common drop-off points
- Optimize video length
- A/B test video formats

### 3. Course Analytics (`courseAnalytics`)
Daily aggregated metrics per course.

```typescript
{
  courseId: Id<"courses">,
  creatorId: string,
  date: string,                  // YYYY-MM-DD
  
  // Views & Enrollments
  views: number,
  enrollments: number,
  conversionRate: number,        // enrollments / views
  
  // Engagement
  activeStudents: number,
  avgTimeSpent: number,          // Minutes
  completionRate: number,        // %
  
  // Progress
  chaptersStarted: number,
  chaptersCompleted: number,
  
  // Revenue
  revenue: number,
  refunds: number,
  netRevenue: number,
  
  // Quality
  avgRating?: number,
  certificatesIssued: number,
  
  createdAt: number,
  updatedAt: number,
}
```

### 4. Revenue Analytics (`revenueAnalytics`)
Daily financial metrics per creator/store.

```typescript
{
  creatorId: string,
  storeId: Id<"stores">,
  date: string,                  // YYYY-MM-DD
  
  // Revenue Breakdown
  grossRevenue: number,
  platformFee: number,
  paymentProcessingFee: number,
  netRevenue: number,
  
  // Transactions
  totalTransactions: number,
  successfulTransactions: number,
  refundedTransactions: number,
  
  // Product Breakdown
  courseRevenue: number,
  digitalProductRevenue: number,
  
  // Customers
  newCustomers: number,
  returningCustomers: number,
  avgOrderValue: number,
  
  createdAt: number,
  updatedAt: number,
}
```

### 5. Student Progress (`studentProgress`)
Individual student progress per course.

```typescript
{
  userId: string,
  courseId: Id<"courses">,
  
  // Progress
  totalChapters: number,
  completedChapters: number,
  completionPercentage: number,
  
  // Time
  totalTimeSpent: number,        // Minutes
  avgSessionDuration: number,
  lastAccessedAt: number,
  enrolledAt: number,
  
  // Pace
  daysSinceEnrollment: number,
  chaptersPerWeek: number,
  estimatedCompletionDate?: number,
  
  // Scoring
  engagementScore: number,       // 0-100
  performancePercentile?: number, // 0-100
  
  // Flags
  isAtRisk: boolean,
  needsHelp: boolean,
  
  updatedAt: number,
}
```

### 6. Chapter Analytics (`chapterAnalytics`)
Performance metrics per chapter.

```typescript
{
  chapterId: string,
  courseId: Id<"courses">,
  chapterIndex: number,
  
  // Views
  totalViews: number,
  uniqueStudents: number,
  completionRate: number,        // %
  
  // Time
  avgTimeToComplete: number,     // Minutes
  avgWatchTime: number,          // For videos
  
  // Drop-off
  dropOffRate: number,           // %
  commonDropOffPoint?: number,   // Video timestamp
  
  // Engagement
  questionsAsked: number,
  avgEngagementScore: number,
  
  // Difficulty Signals
  avgRewatches: number,          // Higher = harder
  avgTimeSpent: number,          // Much higher = harder
  
  updatedAt: number,
}
```

### 7. Learning Streaks (`learningStreaks`)
Gamified daily learning tracking.

```typescript
{
  userId: string,
  currentStreak: number,         // Days
  longestStreak: number,
  lastActivityDate: string,      // YYYY-MM-DD
  totalDaysActive: number,
  totalHoursLearned: number,
  streakMilestones: number[],    // [7, 30, 100, 365]
  updatedAt: number,
}
```

### 8. Recommendations (`recommendations`)
Personalized course recommendations.

```typescript
{
  userId: string,
  recommendations: [{
    courseId: Id<"courses">,
    score: number,               // 0-100 (confidence)
    reason: string,              // "similar_to_completed", "trending", "skill_gap"
  }],
  generatedAt: number,
  expiresAt: number,             // Regenerate after this
}
```

---

## API Functions

### Event Tracking

#### `trackEvent(args)`
Track any user event.

```typescript
await trackEvent({
  userId: user.id,
  eventType: "chapter_completed",
  courseId: courseId,
  chapterId: chapterId,
  metadata: { timeSpent: 300 },
  sessionId: "session_123",
  deviceType: "desktop",
});
```

#### `trackVideoAnalytics(args)`
Track video watching behavior.

```typescript
await trackVideoAnalytics({
  chapterId: chapterId,
  courseId: courseId,
  userId: user.id,
  watchDuration: 180,
  videoDuration: 300,
  percentWatched: 60,
  dropOffPoint: 180,
  completedWatch: false,
  rewatches: 1,
  playbackSpeed: 1.0,
});
```

#### `updateLearningStreak(userId)`
Update user's daily learning streak.

```typescript
const streak = await updateLearningStreak({ userId: user.id });
// Returns: { currentStreak, longestStreak, totalDaysActive }
```

### Queries

#### `getUserEvents(userId, limit?, eventType?)`
Get user's event history.

```typescript
const events = useQuery(api.analytics.getUserEvents, {
  userId: user.id,
  limit: 50,
  eventType: "chapter_completed"
});
```

#### `getCourseAnalytics(courseId, startDate?, endDate?)`
Get course performance metrics.

```typescript
const analytics = useQuery(api.analytics.getCourseAnalytics, {
  courseId: courseId,
  startDate: "2024-01-01",
  endDate: "2024-01-31"
});
```

#### `getRevenueAnalytics(creatorId, startDate?, endDate?)`
Get revenue metrics.

```typescript
const revenue = useQuery(api.analytics.getRevenueAnalytics, {
  creatorId: user.id,
  startDate: "2024-01-01",
  endDate: "2024-01-31"
});
```

#### `getStudentProgress(userId, courseId?)`
Get student's progress.

```typescript
// All courses
const allProgress = useQuery(api.analytics.getStudentProgress, {
  userId: user.id
});

// Specific course
const courseProgress = useQuery(api.analytics.getStudentProgress, {
  userId: user.id,
  courseId: courseId
});
```

#### `getLearningStreak(userId)`
Get user's learning streak.

```typescript
const streak = useQuery(api.analytics.getLearningStreak, {
  userId: user.id
});
```

#### `getAtRiskStudents(courseId)`
Find students who need engagement.

```typescript
const atRisk = useQuery(api.analytics.getAtRiskStudents, {
  courseId: courseId
});
```

#### `getCourseCompletionRate(courseId)`
Get course completion statistics.

```typescript
const completion = useQuery(api.analytics.getCourseCompletionRate, {
  courseId: courseId
});
// Returns: { completionRate, totalStudents, completedStudents }
```

#### `getCourseDropOffPoints(courseId)`
Find chapters with highest drop-off.

```typescript
const dropOffs = useQuery(api.analytics.getCourseDropOffPoints, {
  courseId: courseId
});
// Returns top 5 chapters sorted by drop-off rate
```

### Recommendations

#### `generateRecommendations(userId)`
Generate personalized recommendations.

```typescript
const result = await generateRecommendations({ userId: user.id });
// Returns: { success: true, count: 10 }
```

#### `getRecommendationsWithDetails(userId)`
Get recommendations with full course details.

```typescript
const recommendations = useQuery(api.recommendations.getRecommendationsWithDetails, {
  userId: user.id
});
```

---

## UI Components

### Creator Analytics Dashboard
**Location:** `/components/analytics/CreatorAnalyticsDashboard.tsx`

Comprehensive dashboard for course creators.

**Props:**
```typescript
{
  creatorId: string;
  courseId?: Id<"courses">; // Optional: analytics for specific course
}
```

**Features:**
- Revenue overview cards
- Student enrollment metrics
- Completion rate tracking
- Drop-off point visualization
- At-risk student alerts
- Engagement metrics
- Tabs: Overview, Students, Revenue, Engagement

**Usage:**
```tsx
<CreatorAnalyticsDashboard 
  creatorId={user.id}
  courseId={selectedCourse?._id}
/>
```

### Student Learning Dashboard
**Location:** `/components/analytics/StudentLearningDashboard.tsx`

Personal learning dashboard for students.

**Props:**
```typescript
{
  userId: string;
}
```

**Features:**
- Learning streak display with milestones
- Total time spent tracking
- Course completion progress
- Engagement score
- Course progress cards
- Personalized insights and tips
- Performance percentile

**Usage:**
```tsx
<StudentLearningDashboard userId={user.id} />
```

---

## Integration Guide

### 1. Track Events in Your App

**In course player:**
```typescript
// Chapter started
await trackEvent({
  userId: user.id,
  eventType: "chapter_started",
  courseId: courseData._id,
  chapterId: chapterId,
  sessionId: sessionId,
});

// Chapter completed
await trackEvent({
  userId: user.id,
  eventType: "chapter_completed",
  courseId: courseData._id,
  chapterId: chapterId,
  metadata: { timeSpent: 300 },
  sessionId: sessionId,
});

// Update streak
await updateLearningStreak({ userId: user.id });
```

**In video player:**
```typescript
// Track video progress every 30 seconds
const handleVideoProgress = async () => {
  await trackVideoAnalytics({
    chapterId: chapterId,
    courseId: courseId,
    userId: user.id,
    watchDuration: currentTime,
    videoDuration: duration,
    percentWatched: (currentTime / duration) * 100,
    completedWatch: currentTime >= duration - 5,
    rewatches: rewatchCount,
    playbackSpeed: playbackRate,
  });
};
```

### 2. Display Analytics

**In creator dashboard:**
```tsx
import { CreatorAnalyticsDashboard } from "@/components/analytics/CreatorAnalyticsDashboard";

export default function CreatorDashboard() {
  const { user } = useUser();
  
  return (
    <div>
      <h1>Course Analytics</h1>
      <CreatorAnalyticsDashboard creatorId={user.id} />
    </div>
  );
}
```

**In student library:**
```tsx
import { StudentLearningDashboard } from "@/components/analytics/StudentLearningDashboard";

export default function StudentLibrary() {
  const { user } = useUser();
  
  return (
    <div>
      <StudentLearningDashboard userId={user.id} />
      {/* ... course grid ... */}
    </div>
  );
}
```

### 3. Generate Recommendations

**On page load or interval:**
```tsx
useEffect(() => {
  // Generate recommendations if expired
  const checkRecommendations = async () => {
    const existing = await getRecommendations({ userId: user.id });
    
    if (!existing || existing.expiresAt < Date.now()) {
      await generateRecommendations({ userId: user.id });
    }
  };
  
  checkRecommendations();
}, [user.id]);
```

---

## Recommendation Engine

### How It Works

The recommendation engine scores courses based on multiple factors:

1. **Similar Category** (+40 points)
   - Courses in same category as completed courses

2. **Skill Progression** (+30 points)
   - Intermediate courses if user completed Beginner
   - Advanced courses if user completed Intermediate

3. **Skill Gap** (+20 points)
   - Courses in categories user hasn't explored

4. **Published & Has Content** (+10 points)
   - Only recommend quality courses

### Recommendation Reasons

- `similar_to_completed`: Similar to courses you've finished
- `skill_progression`: Next level in your learning path
- `skill_gap`: Explore new topics
- `trending`: Popular among other students

### Expiration

Recommendations expire after 7 days and are regenerated to stay fresh.

---

## Performance Considerations

### Event Tracking
- Events are written asynchronously
- No blocking of user actions
- Fire-and-forget pattern

### Analytics Aggregation
- Daily aggregation reduces query load
- Indexed by date for fast range queries
- Pre-calculated metrics (completion rate, avg time)

### Recommendations
- Generated once, cached for 7 days
- Regeneration triggered on expiry or manual request
- Lightweight scoring algorithm

---

## Future Enhancements

### Advanced Analytics
- [ ] Predictive churn models
- [ ] A/B testing framework
- [ ] Cohort analysis
- [ ] Custom date range filtering
- [ ] Export to CSV/PDF

### Student Features
- [ ] Learning goals and milestones
- [ ] Badges and achievements
- [ ] Social leaderboards
- [ ] Study time recommendations

### Creator Features
- [ ] Email templates for at-risk students
- [ ] Auto-generated course improvement suggestions
- [ ] Competitor analysis
- [ ] Revenue forecasting

### Recommendation Engine
- [ ] Collaborative filtering
- [ ] Content-based filtering
- [ ] Machine learning models
- [ ] Personalized email campaigns

---

## Testing

### Manual Testing

1. **Track an event:**
```typescript
await trackEvent({
  userId: "user_123",
  eventType: "course_viewed",
  courseId: courseId,
});
```

2. **Check Convex Dashboard:**
- Go to Data → `userEvents`
- Verify event was created

3. **Test learning streak:**
```typescript
const streak = await updateLearningStreak({ userId: "user_123" });
console.log(streak); // { currentStreak: 1, ... }
```

4. **Generate recommendations:**
```typescript
await generateRecommendations({ userId: "user_123" });
const recs = await getRecommendationsWithDetails({ userId: "user_123" });
console.log(recs);
```

### Automated Testing

```typescript
// Test event tracking
test("tracks user events", async () => {
  const result = await trackEvent({
    userId: "test_user",
    eventType: "course_viewed",
  });
  expect(result.success).toBe(true);
});

// Test streak calculation
test("calculates learning streaks", async () => {
  const streak = await updateLearningStreak({ userId: "test_user" });
  expect(streak.currentStreak).toBeGreaterThan(0);
});
```

---

## Summary

The Analytics System provides:

✅ **Comprehensive Event Tracking**
✅ **Creator Revenue Dashboard**
✅ **Student Learning Insights**
✅ **Course Performance Metrics**
✅ **Drop-off Point Detection**
✅ **At-Risk Student Identification**
✅ **Learning Streak Gamification**
✅ **Personalized Recommendations**

**Key Benefits:**
- Data-driven course improvements
- Increased student engagement
- Better retention rates
- Revenue optimization
- Personalized learning experiences

