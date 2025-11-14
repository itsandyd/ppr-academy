# Section Content Breakdown

## What's Actually in Each Section?

---

## 📚 **LIBRARY** (`/library`)

**Purpose:** Student learning hub - courses you've purchased/enrolled in

### Content:

1. **Enrolled Courses**
   - List of courses you've bought/enrolled in
   - Progress tracking (how much you've completed)
   - Continue learning buttons
   - Course cards with thumbnails

2. **Learning Stats**
   - Courses enrolled count
   - Courses completed count
   - Total hours learned
   - Current learning streak

3. **Certificates**
   - Certificates earned from completed courses
   - Certificate cards with course names

4. **Recent Activity**
   - Last courses accessed
   - Recent completions
   - Learning milestones

5. **Recommendations**
   - Suggested courses based on your progress
   - Personalized learning paths

**Who sees this:** Students (anyone who enrolled in courses)

---

## 🎨 **STUDIO** (`/home` - CreatorDashboardContent)

**Purpose:** Creator business overview - high-level business metrics

### Content:

1. **Business Metrics**
   - Total revenue
   - Total downloads
   - Number of students/customers
   - Average rating

2. **Your Products Overview**
   - List of courses you created
   - List of digital products you created
   - Published vs draft counts
   - Quick stats per product

3. **Quick Actions**
   - "Create Product" button
   - "Create Course" button
   - "Upload Sample Pack" button
   - Links to detailed management

4. **Store Setup** (if no store yet)
   - Store setup wizard
   - Getting started guidance

5. **Discord Integration**
   - Discord connection status
   - Discord stats widget

6. **Achievements**
   - Creator achievement badges
   - Milestones unlocked

**Who sees this:** Creators (users who have a store or are setting one up)

---

## 🏪 **STORE** (`/store/[storeId]/products`)

**Purpose:** Detailed product management - create, edit, manage your products

### Content:

1. **Product Management**
   - Full list of ALL your products (courses + digital products + samples)
   - Create new product wizard
   - Edit existing products
   - Delete products
   - Publish/unpublish products

2. **Product Types**
   - Courses
   - Digital Products (sample packs, presets, etc.)
   - Ableton Racks
   - Samples

3. **Product Creation Flow**
   - Step-by-step product creation
   - Upload thumbnails
   - Set pricing
   - Configure settings
   - Review and publish

4. **Product Lists**
   - Published products
   - Draft products
   - Search and filter
   - Product statistics

5. **Store Settings** (via navigation)
   - Store profile
   - Customers management
   - Analytics
   - Email campaigns
   - Social media
   - Payouts

**Who sees this:** Creators with an active store

---

## 🔄 **Key Differences**

| Feature | Library | Studio | Store |
|---------|---------|--------|-------|
| **Focus** | Learning | Business Overview | Product Management |
| **Content** | Courses you bought | Your business metrics | Products you created |
| **Actions** | Continue learning | View analytics | Create/edit products |
| **User Type** | Students | Creators | Creators |
| **Complexity** | Simple | Medium | Complex |

---

## 💡 **Real-World Analogy**

Think of it like this:

- **Library** = Your Netflix "Continue Watching" page
  - Shows content you've purchased
  - Tracks your progress
  - Recommends what to watch next

- **Studio** = Your YouTube Analytics dashboard
  - High-level stats (views, revenue, subscribers)
  - Quick overview of your channel
  - Links to detailed management

- **Store** = Your YouTube Studio (detailed management)
  - Upload/edit videos
  - Manage all your content
  - Detailed settings and configuration

---

## 🎯 **Current Overlap/Confusion**

### Problem:
- **Studio** (`/home`) shows products you created
- **Store** (`/store/[storeId]/products`) also shows products you created
- Both have similar content but different purposes

### Solution:
- **Studio** = Quick overview, metrics, dashboard
- **Store** = Detailed management, creation, editing

---

## 📋 **What Should Be Where?**

### Library (`/library`)
✅ Courses you enrolled in
✅ Your learning progress
✅ Certificates
✅ Learning stats
❌ Courses you created (that's Studio/Store)

### Studio (`/home` or `/workspace/studio`)
✅ Business overview
✅ Revenue metrics
✅ Student counts
✅ Quick actions
✅ Links to detailed management
❌ Detailed product editing (that's Store)

### Store (`/store/[storeId]/products`)
✅ Create new products
✅ Edit existing products
✅ Manage all products
✅ Product settings
✅ Detailed product management
❌ High-level business metrics (that's Studio)

---

## 🚀 **Proposed Unified Structure**

### `/workspace` (Main Entry)
Shows cards based on user type:

**Students:**
- [Library Card] → Go to learning content

**Creators:**
- [Studio Card] → Business overview
- [Store Card] → Product management
- [Showcase Card] → Artist profile

**Hybrid:**
- [Library Card] → Learning
- [Studio Card] → Business
- [Store Card] → Management

Each card clearly explains what's inside!



