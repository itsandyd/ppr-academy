# The Artist Evergreen Funnel - Feature Mapping

## 📋 Quick Reference: Course → App Features

This document maps each lesson in "The Artist Evergreen Funnel" to specific PPR Academy features students can use to implement what they learn.

### 📊 Course Metadata (from Convex)
- **Course ID:** `jx78jf4chzkg4wa2pg1hvqy38s7sr227`
- **Slug:** `the-artist-evergreen-funnel`
- **Status:** Published ✅
- **Category:** Business
- **Skill Level:** All Levels
- **Store ID:** `kh78hrngdvmxbqy6g6w4faecpd7m63ra`

---

## Module 1: Evergreen Funnel Foundations

### Lesson 1: What is an Evergreen Marketing Funnel?
**App Features:**
- ✅ Email Campaigns (`/store/[storeId]/email`)
- ✅ Email Workflows (automated sequences)
- ✅ Lead Magnets system

**Student Action:**
> "Go to Email Campaigns and create your first automated welcome sequence using the Welcome template."

---

### Lesson 2: Understanding Sales Funnels
**App Features:**
- ✅ Analytics Dashboard (`/store/[storeId]/analytics`)
- ✅ Audience Segmentation (by funnel stage)
- ✅ Event Tracking (20+ events)

**Student Action:**
> "View your Analytics dashboard to see how many people are at each stage: Awareness (page views) → Interest (email opens) → Decision (cart adds) → Action (purchases)."

---

### Lesson 3: What is a Pixel?
**App Features:**
- ✅ Event Tracking System (`convex/analyticsTracking.ts`)
- ✅ Real-time aggregation
- ✅ Video play/pause/complete tracking
- ✅ Purchase event tracking

**Student Action:**
> "Check your Analytics → Events to see which pages your audience visits most. This is your 'pixel' data."

---

## Module 2: Funnel Diagnostics

### Lesson 1: What are Bottlenecks?
**App Features:**
- ✅ Drop-off Point Visualization
- ✅ Completion Rate Tracking
- ✅ At-Risk Student Alerts

**Student Action:**
> "Navigate to Analytics → Drop-off Points to see where people leave your funnel."

---

### Lesson 2: How to Identify Bottlenecks
**App Features:**
- ✅ Creator Analytics Dashboard
- ✅ Chapter Performance metrics
- ✅ Revenue Analytics

**Student Action:**
> "Identify your biggest bottleneck and create a re-engagement email targeting people who stopped there."

---

### Lesson 3: The 4-Step Sales Funnel
**App Features:**
- ✅ Segmented Email Campaigns
- ✅ Automated Workflows
- ✅ Customer Journey Tracking

**Student Action:**
> "Create 4 different email campaigns, one for each funnel stage: Awareness, Interest, Decision, Action."

---

## Module 3: Fanbase Development Levels

### Lesson 1: Connecting With Your Audience
**App Features:**
- ✅ Fan Management System (`/store/[storeId]/contacts`)
- ✅ Engagement Scoring
- ✅ Producer Profiles (DAW, genre, goals)

**Student Action:**
> "Import your email list to the Fans tab and start tracking engagement scores."

---

### Lesson 2: Level 1 - Discovery
**App Features:**
- ✅ Lead Magnets
- ✅ Instagram DM Automation
- ✅ Social Media Scheduler

**Student Action:**
> "Create a lead magnet (free sample pack or course module) and set up Instagram DM automation to deliver it."

---

### Lesson 3: Level 2 - Social Proof
**App Features:**
- ✅ Course Review System
- ✅ Testimonial Display
- ✅ Certificate Sharing

**Student Action:**
> "Enable course reviews and collect 5 testimonials. Display them on your landing page."

---

### Lesson 4: Level 3 - Engagers
**App Features:**
- ✅ Email Open/Click Tracking
- ✅ Activity Logs
- ✅ Engagement Tags

**Student Action:**
> "Tag all fans who opened 3+ emails as 'Engagers' and send them exclusive content."

---

### Lesson 5: Level 4 - True Fans
**App Features:**
- ✅ Customers Database
- ✅ Purchase History
- ✅ Auto-Sync: Customers → Fans

**Student Action:**
> "View your Customers tab to see who purchased. They're automatically tagged as True Fans."

---

### Lesson 6: Level 5 - Super Fans
**App Features:**
- ✅ Revenue Analytics
- ✅ Customer Lifetime Value
- ✅ Repeat Purchase Tracking

**Student Action:**
> "Identify your top 10 highest-spending customers. These are your Super Fans. Offer them VIP access or exclusive coaching."

---

## Module 4: Audience Strategy

### Lesson 1: How to Identify Your Fan Avatar
**App Features:**
- ✅ Producer Profiles Database
- ✅ Fan Filters (DAW, genre, skill level)
- ✅ Engagement Analytics

**Student Action:**
> "Go to Fans → Filters. Filter by 'Most Engaged' and analyze their Producer Profiles. The most common DAW + genre = your fan avatar."

---

### Lesson 2: How Polarization Breeds Loyalty
**App Features:**
- ✅ Social Media Scheduler
- ✅ Email Campaign System
- ✅ Segmented Messaging

**Student Action:**
> "Schedule 5 posts with bold, opinionated content. Track which posts get the most engagement from your ideal fan avatar vs. everyone else."

---

## 🛠️ Feature Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create lead magnet
- [ ] Set up 3-email welcome sequence
- [ ] Connect Instagram account
- [ ] Enable DM automation
- [ ] Review first week's analytics

### Phase 2: Diagnostics (Week 2)
- [ ] Identify biggest bottleneck
- [ ] Create re-engagement campaign
- [ ] Set up A/B test for email subject lines
- [ ] Track conversion rate improvements

### Phase 3: Audience Levels (Week 3)
- [ ] Import email list to Fans database
- [ ] Tag fans by engagement level
- [ ] Create lead magnet for Discovery
- [ ] Enable course reviews for Social Proof
- [ ] Create Super Fan exclusive offer

### Phase 4: Avatar Strategy (Week 4)
- [ ] Analyze Fans database for patterns
- [ ] Define 3 fan avatars
- [ ] Create segmented campaigns for each
- [ ] Schedule week of social media content
- [ ] Measure ROI by avatar

---

## 📍 Quick Navigation Guide

### Dashboard Locations:
- **Email Campaigns:** `/store/[storeId]/email`
- **Fan Management:** `/store/[storeId]/contacts`
- **Analytics:** `/store/[storeId]/analytics`
- **Social Media:** `/store/[storeId]/social`
- **Customers:** `/store/[storeId]/customers`
- **Lead Magnets:** `/store/[storeId]/lead-magnets`

### Backend Files (Convex):
- **Email System:** `convex/emails.ts` (743 lines)
  - Functions: `sendLeadMagnetConfirmation`, `sendCampaignEmail`, `sendWorkflowEmail`
- **Email Campaigns:** `convex/emailCampaigns.ts` (10 functions)
  - Functions: `createCampaign`, `getCampaigns`, `sendCampaign`, `scheduleCampaign`
- **Email Workflows:** `convex/emailWorkflows.ts` (7 functions)
  - Functions: `createWorkflow`, `triggerWorkflow`, `getActiveWorkflows`
- **Fan Management:** `convex/contacts.ts`
  - Functions: `createContact`, `updateContact`, `tagContact`, `getEngagementScore`
- **Analytics:** `convex/analyticsTracking.ts` (82 lines)
  - Functions: `trackEvent`, `trackProductView`, `trackPurchase`, `trackVideoAnalytics`
- **Social Media:** `convex/socialMedia.ts` (14 functions)
  - Functions: `connectSocialAccount`, `createScheduledPost`, `publishPost`
- **Instagram DM:** `convex/instagramAutomation.ts`
  - Functions: `createAutomation`, `processComment`, `sendAutoReply`
- **Customer Sync:** `convex/customerFanSync.ts`
  - Functions: `syncCustomerToFans`, `updateEngagementScore`

### Convex Tables Used:
- `courses` - Course metadata
- `courseModules` - 4 modules
- `courseLessons` - 12 lessons
- `courseChapters` - Chapter content
- `contacts` - Fan database
- `customers` - Purchase records
- `emailCampaigns` - Campaign data
- `emailWorkflows` - Automation sequences
- `emailTemplates` - Reusable templates
- `emailEvents` - Tracking (opens, clicks, bounces)
- `analyticsEvents` - Universal event tracking
- `videoAnalytics` - Video watch behavior
- `socialAccounts` - Connected platforms
- `scheduledPosts` - Social media queue
- `instagramAutomations` - DM rules

---

## 🎯 Key Integrations

### 1. Email System
**10 Template Types:**
1. Welcome (Discovery → Engager)
2. Launch (Interest → Decision)
3. Enrollment (Decision → Action)
4. Progress Reminder (Engager maintenance)
5. Completion (True Fan upsell)
6. Certificate (Social Proof)
7. New Course (Super Fan offer)
8. Re-engagement (Bottleneck recovery)
9. Weekly Digest (Ongoing value)
10. Custom (Any purpose)

### 2. Fan Segmentation
**Segment By:**
- All users
- Course students
- Store students
- Inactive users (bottleneck recovery)
- Completed course students (upsell)
- Custom lists

### 3. Social Media Automation
**Platforms:**
- Instagram (Business accounts)
- Facebook Pages
- Twitter/X
- LinkedIn
- TikTok

**Features:**
- Post scheduling
- DM automation
- Comment-to-DM triggers
- AI chatbot responses

### 4. Analytics Tracking
**20+ Event Types:**
- Page views (Awareness)
- Product views (Interest)
- Email opens/clicks (Engagement)
- Video play/complete (Engagement)
- Purchases (Action)
- Course completion (True Fan)

---

## 📊 Success Metrics

### After Module 1:
- ✅ Lead magnet created
- ✅ Welcome sequence active
- ✅ Analytics tracking enabled
- **Target:** 10+ new email subscribers

### After Module 2:
- ✅ Bottleneck identified
- ✅ Re-engagement campaign live
- ✅ Conversion rate improvement tracked
- **Target:** 5% increase in funnel completion

### After Module 3:
- ✅ Fans tagged by level
- ✅ Level-specific campaigns created
- ✅ Social proof enabled
- **Target:** 3 Super Fans identified

### After Module 4:
- ✅ Fan avatar defined
- ✅ Segmented campaigns running
- ✅ Social media automation active
- **Target:** 30%+ engagement rate increase

---

**Status:** ✅ Ready for Student Implementation  
**Updated:** October 31, 2025

