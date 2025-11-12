# Professional Social Media Post Scheduling System Design

## 🎯 System Overview

A production-ready social media scheduling system that handles Instagram and Facebook post publishing with media upload, error handling, rate limiting, and timezone-aware scheduling.

---

## 📋 Core Requirements

### Functional Requirements

1. **Post Creation & Scheduling**
   - Create posts with text content
   - Upload and attach media (images, videos)
   - Schedule posts for future publication
   - Support multiple social accounts
   - Preview posts before scheduling
   - Edit/delete scheduled posts

2. **Media Management**
   - Support images (JPEG, PNG) up to 8MB
   - Support videos (MP4, MOV) up to 100MB
   - Validate media format and dimensions
   - Use resumable uploads for large files
   - Generate thumbnails for preview

3. **Platform-Specific Features**
   - **Instagram**: Single image, carousel, reels, stories
   - **Facebook**: Text, image, video, link posts
   - Platform-specific caption limits
   - Hashtag validation
   - Mention handling

### Non-Functional Requirements

1. **Reliability**
   - 99.9% uptime for scheduled posts
   - Automatic retry with exponential backoff
   - Dead letter queue for failed posts
   - Transaction logging for auditing

2. **Performance**
   - Media upload with resumable sessions
   - Async processing for large files
   - Batch API calls where possible
   - Efficient database queries

3. **Security**
   - Secure token storage (encrypted)
   - Token refresh automation
   - HTTPS for all API calls
   - Input validation and sanitization

4. **Scalability**
   - Support 1000+ scheduled posts
   - Handle 100+ concurrent publishes
   - Horizontal scaling capability
   - Rate limit distribution

---

## 🏗️ System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (Post Composer, Media Upload, Calendar View, Preview)  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  API Layer (Next.js)                     │
│  - Media Upload Routes                                   │
│  - Post Creation/Update/Delete                           │
│  - Validation & Sanitization                             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Database Layer (Convex)                     │
│  - scheduledPosts table                                  │
│  - Media metadata storage                                │
│  - Post status tracking                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Scheduling Engine (Convex Cron)             │
│  - Poll for pending posts every 5 min                    │
│  - Distribute publishing tasks                           │
│  - Handle retries and failures                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            Publishing Service (Convex Actions)           │
│  - Platform-specific publishing logic                    │
│  - Error handling and retry logic                        │
│  - Rate limiting enforcement                             │
│  - Status updates                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│         Social Media Platform APIs                       │
│  - Instagram Graph API                                   │
│  - Facebook Graph API                                    │
│  - Twitter API                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### scheduledPosts Table

```typescript
{
  _id: Id<"scheduledPosts">,
  _creationTime: number,
  
  // Ownership
  storeId: string,
  userId: string,
  socialAccountId: Id<"socialAccounts">,
  
  // Content
  content: string, // Caption/text (2200 chars for Instagram, 63206 for Facebook)
  mediaUrls?: string[], // URLs to media (images/videos)
  mediaStorageIds?: Id<"_storage">[], // Convex storage IDs for media
  mediaMetadata?: {
    type: "image" | "video",
    width: number,
    height: number,
    duration?: number, // for videos
    size: number,
    format: string,
  }[],
  
  // Scheduling
  scheduledFor: number, // Unix timestamp
  timezone: string, // IANA timezone (e.g., "America/New_York")
  
  // Platform Details
  postType: "post" | "story" | "reel" | "carousel",
  platformOptions?: {
    // Instagram specific
    locationId?: string,
    collaborators?: string[],
    productTags?: string[],
    
    // Facebook specific
    targeting?: object,
    feedType?: "PAGE" | "GROUP",
    backdatedTime?: number,
  },
  
  // Status & Publishing
  status: "draft" | "scheduled" | "publishing" | "published" | "failed" | "cancelled",
  publishAttempts: number,
  lastAttemptAt?: number,
  publishedAt?: number,
  platformPostId?: string, // ID from social platform after publishing
  publishError?: {
    code: number,
    message: string,
    subcode?: number,
    type: string,
    retriable: boolean,
  },
  
  // Metadata
  updatedAt: number,
}
```

### Indexes

```typescript
.index("by_storeId", ["storeId"])
.index("by_userId", ["userId"])
.index("by_socialAccountId", ["socialAccountId"])
.index("by_status", ["status"])
.index("by_scheduledFor", ["scheduledFor"])
.index("by_store_status", ["storeId", "status"])
.index("by_store_scheduled", ["storeId", "scheduledFor"])
```

---

## 🔄 Publishing Flow

### 1. Post Creation Flow

```
User creates post
      ↓
Validate content (length, format)
      ↓
Upload media (if any) → Convex Storage
      ↓
Create scheduledPost record (status: "scheduled")
      ↓
Return success to user
```

### 2. Publishing Execution Flow

```
Cron job runs (every 5 min)
      ↓
Query posts where:
  - status = "scheduled"
  - scheduledFor ≤ now()
  - publishAttempts < 3
      ↓
For each post:
      ↓
Update status → "publishing"
      ↓
Call platform-specific publishing action
      ↓
Platform publishes post
      ↓
┌─────────────┬──────────────┐
│   Success   │    Failure   │
↓             ↓              ↓
Update:       Analyze error:
- status =    ┌──────────┬──────────┐
  "published" │Retriable │Permanent │
- publishedAt │          │          │
- platformPostId         ↓          ↓
              Retry      Update:
              later      - status = "failed"
                        - publishError
```

---

## 📝 API Endpoints

### POST /api/posts/create

Create and schedule a new post.

**Request:**
```typescript
{
  storeId: string,
  socialAccountId: Id<"socialAccounts">,
  content: string,
  mediaStorageIds?: Id<"_storage">[],
  scheduledFor: number,
  timezone: string,
  postType: "post" | "story" | "reel",
  platformOptions?: object
}
```

**Response:**
```typescript
{
  postId: Id<"scheduledPosts">,
  status: "scheduled",
  scheduledFor: number
}
```

### POST /api/media/upload

Upload media for a post (images/videos).

**Request:** `multipart/form-data`
```
file: File (image or video)
storeId: string
```

**Response:**
```typescript
{
  storageId: Id<"_storage">,
  url: string,
  metadata: {
    type: "image" | "video",
    width: number,
    height: number,
    size: number,
    format: string
  }
}
```

### PUT /api/posts/:postId

Update a scheduled post.

**Request:**
```typescript
{
  content?: string,
  mediaStorageIds?: Id<"_storage">[],
  scheduledFor?: number,
  status?: "scheduled" | "cancelled"
}
```

### DELETE /api/posts/:postId

Delete/cancel a scheduled post.

---

## 🎨 UI Components

### 1. Post Composer

**Features:**
- Rich text editor with emoji picker
- Character counter (platform-specific limits)
- Hashtag and mention autocomplete
- Media upload with drag-and-drop
- Multi-account selector
- Date/time picker with timezone
- Preview mode

**Layout:**
```
┌─────────────────────────────────────┐
│ Create New Post                     │
├─────────────────────────────────────┤
│ Select Account:                     │
│ [Instagram @account ▼]              │
│                                     │
│ Post Type:                          │
│ ( ) Post  (•) Reel  ( ) Story      │
│                                     │
│ Caption:                            │
│ ┌─────────────────────────────────┐│
│ │ Write your caption here...      ││
│ │                                 ││
│ │                                 ││
│ └─────────────────────────────────┘│
│ 0 / 2,200 characters               │
│                                     │
│ Media:                              │
│ ┌───────┐ ┌───────┐                │
│ │[Image]│ │[+Add ]│                │
│ └───────┘ └───────┘                │
│                                     │
│ Schedule:                           │
│ [📅 Oct 5, 2025] [🕐 2:30 PM] [PST]│
│                                     │
│ [Preview] [Save Draft] [Schedule]   │
└─────────────────────────────────────┘
```

### 2. Calendar View

**Features:**
- Month/week/day views
- Color-coded by platform
- Drag-and-drop rescheduling
- Quick post preview on hover
- Filter by account/status

### 3. Scheduled Posts List

**Features:**
- Table view with sorting/filtering
- Bulk actions (delete, reschedule)
- Status indicators
- Quick edit modal
- Retry failed posts

---

## 🚀 Instagram Publishing Logic

### Single Image Post

```typescript
async function publishInstagramImage(post) {
  // Step 1: Create container
  const container = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: 'POST',
      body: new URLSearchParams({
        image_url: post.mediaUrls[0],
        caption: post.content,
        access_token: pageAccessToken
      })
    }
  );
  
  const containerId = container.id;
  
  // Step 2: Poll until ready
  await pollContainerStatus(containerId);
  
  // Step 3: Publish
  const published = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: pageAccessToken
      })
    }
  );
  
  return published.id; // Instagram media ID
}
```

### Video/Reel Post

```typescript
async function publishInstagramVideo(post) {
  // Step 1: Create container with video_url
  const container = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: 'POST',
      body: new URLSearchParams({
        media_type: post.postType === 'reel' ? 'REELS' : 'VIDEO',
        video_url: post.mediaUrls[0],
        caption: post.content,
        access_token: pageAccessToken
      })
    }
  );
  
  // Step 2: Poll for processing (can take 30+ seconds)
  await pollContainerStatus(container.id, { maxAttempts: 20 });
  
  // Step 3: Publish
  return await publishContainer(container.id);
}
```

### Carousel Post

```typescript
async function publishInstagramCarousel(post) {
  // Step 1: Create item containers for each media
  const itemContainers = [];
  
  for (const mediaUrl of post.mediaUrls) {
    const item = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        method: 'POST',
        body: new URLSearchParams({
          is_carousel_item: 'true',
          image_url: mediaUrl, // or video_url
          access_token: pageAccessToken
        })
      }
    );
    itemContainers.push(item.id);
  }
  
  // Step 2: Create carousel container
  const carouselContainer = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: 'POST',
      body: new URLSearchParams({
        media_type: 'CAROUSEL',
        children: itemContainers.join(','),
        caption: post.content,
        access_token: pageAccessToken
      })
    }
  );
  
  // Step 3: Publish carousel
  return await publishContainer(carouselContainer.id);
}
```

---

## 🚀 Facebook Publishing Logic

### Facebook Page Post

```typescript
async function publishFacebookPost(post) {
  const endpoint = post.mediaUrls?.length > 0
    ? `/${pageId}/photos` // or /videos for video
    : `/${pageId}/feed`;   // text-only
  
  const params: any = {
    message: post.content,
    access_token: pageAccessToken,
  };
  
  if (post.mediaUrls?.length > 0) {
    if (post.mediaMetadata[0].type === 'image') {
      params.url = post.mediaUrls[0];
    } else {
      params.file_url = post.mediaUrls[0];
    }
  }
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0${endpoint}`,
    {
      method: 'POST',
      body: new URLSearchParams(params)
    }
  );
  
  return response.id; // Facebook post ID
}
```

---

## ⚠️ Error Handling

### Error Classification

```typescript
const ERROR_CODES = {
  RETRIABLE: [1, 2, 4, 17, 341], // Temporary issues
  OAUTH: [190], // Token expired
  RATE_LIMIT: [4, 17, 32, 80001], // Rate limiting
  PERMISSIONS: [10, 200-299], // Permission denied
  INVALID_PARAMS: [100], // Bad request
  DUPLICATE: [506], // Duplicate post
};

function classifyError(error) {
  if (ERROR_CODES.RETRIABLE.includes(error.code)) {
    return { retriable: true, delay: exponentialBackoff() };
  }
  
  if (ERROR_CODES.OAUTH.includes(error.code)) {
    return { retriable: false, action: 'REAUTH_REQUIRED' };
  }
  
  if (ERROR_CODES.RATE_LIMIT.includes(error.code)) {
    return { retriable: true, delay: getRateLimitDelay(error) };
  }
  
  return { retriable: false, action: 'PERMANENT_FAILURE' };
}
```

### Retry Logic

```typescript
async function publishWithRetry(post, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await publishToPlatform(post);
      return { success: true, result };
    } catch (error) {
      const classification = classifyError(error);
      
      if (!classification.retriable || attempt === maxAttempts) {
        return { success: false, error, permanent: !classification.retriable };
      }
      
      // Wait before retry
      await sleep(classification.delay || attempt * 2000);
    }
  }
}
```

---

## 🎯 Rate Limiting

### Instagram Rate Limits

- **Content Publishing**: 25 posts per 24 hours
- **Container Creation**: 400 containers per 24 hours
- **API Calls**: Standard Graph API limits

### Facebook Rate Limits

- **Page Posts**: Varies by page size and engagement
- **Graph API**: 200 calls per user per hour (default)
- **Marketing API**: Higher limits for approved apps

### Rate Limit Tracking

```typescript
interface RateLimitTracker {
  accountId: Id<"socialAccounts">,
  platform: string,
  
  // Counters
  postsToday: number,
  apiCallsThisHour: number,
  
  // Timestamps
  lastPostAt: number,
  lastApiCallAt: number,
  resetAt: number,
  
  // Status
  isThrottled: boolean,
  nextAvailableAt?: number,
}

async function checkRateLimit(accountId: string) {
  const tracker = await getRateLimitTracker(accountId);
  
  if (tracker.isThrottled && Date.now() < tracker.nextAvailableAt) {
    throw new Error(`Rate limit exceeded. Try again at ${new Date(tracker.nextAvailableAt)}`);
  }
  
  if (tracker.postsToday >= 25) {
    throw new Error('Daily post limit (25) reached for this Instagram account');
  }
  
  return true;
}
```

---

## 📅 Scheduling Implementation

### Cron Job (Convex)

```typescript
export const processScheduledPosts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Get posts ready to publish
    const posts = await ctx.runQuery(internal.socialMedia.getPostsToPublish);
    
    for (const post of posts) {
      try {
        // Check rate limits
        await checkRateLimit(post.socialAccountId);
        
        // Publish post
        await ctx.runAction(internal.socialMediaActions.publishScheduledPost, {
          postId: post._id,
        });
      } catch (error) {
        console.error(`Failed to publish post ${post._id}:`, error);
        
        // Update post with error
        await ctx.runMutation(internal.socialMedia.updatePostError, {
          postId: post._id,
          error: {
            message: error.message,
            code: error.code,
            retriable: error.retriable,
          },
        });
      }
    }
    
    return null;
  },
});
```

### Query for Posts to Publish

```typescript
export const getPostsToPublish = internalQuery({
  args: {},
  returns: v.array(v.object({/* post schema */})),
  handler: async (ctx) => {
    const now = Date.now();
    
    return await ctx.db
      .query("scheduledPosts")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .filter((q) => 
        q.and(
          q.lte(q.field("scheduledFor"), now),
          q.lt(q.field("publishAttempts"), 3)
        )
      )
      .collect();
  },
});
```

---

## 📊 Media Specifications

### Instagram

**Images:**
- Format: JPEG, PNG
- Size: ≤ 8MB
- Dimensions: 320px - 1440px width
- Aspect Ratio: 4:5 to 1.91:1
- Color: sRGB

**Videos:**
- Format: MP4, MOV (H.264, HEVC)
- Size: ≤ 100MB
- Duration: 3s - 60s (feed), 3s - 15min (reels)
- Aspect Ratio: 0.01:1 to 10:1
- Recommended: 1080 x 1920 (9:16 for reels)

**Reels:**
- Duration: 3s - 15min (recommend ≤ 90s)
- Aspect Ratio: 9:16 recommended
- Resolution: 1080 x 1920 recommended

### Facebook

**Images:**
- Format: JPEG, PNG, GIF
- Size: ≤ 10MB
- Minimum: 200 x 200 px
- Recommended: 1200 x 630 px

**Videos:**
- Format: MP4, MOV
- Size: ≤ 2GB
- Duration: 1s - 240min
- Recommended: 1280 x 720 px

---

## ✅ Implementation Checklist

### Phase 1: Core Scheduling (Week 1)
- [ ] Update database schema with scheduledPosts table
- [ ] Create post composer UI component
- [ ] Implement media upload endpoint
- [ ] Build post creation mutation
- [ ] Add basic validation

### Phase 2: Publishing Logic (Week 2)
- [ ] Implement Instagram single image publishing
- [ ] Implement Facebook post publishing
- [ ] Add container status polling
- [ ] Create error handling system
- [ ] Build retry mechanism

### Phase 3: Advanced Features (Week 3)
- [ ] Add carousel post support
- [ ] Implement video/reel publishing
- [ ] Build calendar view UI
- [ ] Add bulk operations
- [ ] Implement rate limiting

### Phase 4: Polish & Testing (Week 4)
- [ ] Add comprehensive error messages
- [ ] Build analytics dashboard
- [ ] Implement post previews
- [ ] Add scheduling analytics
- [ ] Performance optimization
- [ ] End-to-end testing

---

## 🎓 Resources

- [Instagram Content Publishing API](https://developers.facebook.com/docs/instagram-platform/content-publishing/)
- [Facebook Pages API - Posts](https://developers.facebook.com/docs/pages-api/posts/)
- [Graph API Error Handling](https://developers.facebook.com/docs/graph-api/guides/error-handling)
- [Rate Limiting](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

---

## 🚀 Next Steps

1. **Start with Phase 1** - Build the post composer UI and basic scheduling
2. **Test with Instagram single images** - Simplest case to validate flow
3. **Add error handling early** - Critical for production reliability
4. **Iterate based on feedback** - Add features as users request them

**Ready to start implementation!** 🎉
