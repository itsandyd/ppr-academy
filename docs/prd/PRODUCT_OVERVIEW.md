# Product Overview

> **Last Updated:** 2026-02-19
> **Pass:** 1 — Foundation

---

## Table of Contents

- [1. What Is PPR Academy?](#1-what-is-ppr-academy)
- [2. Target Audience](#2-target-audience)
- [3. Business Model](#3-business-model)
- [4. Major Product Areas](#4-major-product-areas)
- [5. Dual-Mode Dashboard System](#5-dual-mode-dashboard-system)
- [6. Core Value Proposition](#6-core-value-proposition)
- [7. Competitive Positioning](#7-competitive-positioning)

---

## 1. What Is PPR Academy?

PPR Academy (PausePlayRepeat) is an **all-in-one platform for music production education and creator commerce**. It combines:

- A **learning management system (LMS)** where students take courses on music production
- A **creator marketplace** where music producers sell digital products (sample packs, presets, beats, project files, courses, coaching sessions)
- A **creator toolkit** with email marketing, social media automation, landing pages, and analytics
- An **AI-powered content engine** for course creation, content generation, and intelligent assistance

The platform serves a dual purpose — enabling music producers to both **learn** their craft and **monetize** their knowledge. The vision is a "Teachable + Gumroad + ConvertKit + Linktree" specifically built for the music production community.

## 2. Target Audience

### Primary Users

| User Type | Description | Goals |
|-----------|-------------|-------|
| **Learners** | Aspiring and intermediate music producers | Learn production techniques, earn certificates, track progress |
| **Creators** | Experienced producers, educators, and content creators | Sell courses & products, build audience, grow revenue |
| **Hybrid** | Users who both learn and create | Transition from learner to creator as skills develop |

### Secondary Users

| User Type | Description |
|-----------|-------------|
| **Platform Admin** | Manages the overall marketplace, monitors health, runs campaigns |
| **Affiliates** | Promote creator products for commission |

### Music Production Verticals

The platform specifically targets these production disciplines:
- DAW-specific (Ableton Live, FL Studio, Logic Pro, Bitwig, Studio One)
- Sound design & synthesis (Serum, Vital, Massive, Omnisphere)
- Mixing & mastering
- Beat-making & leasing
- Music business & marketing

## 3. Business Model

PPR Academy has a **multi-layered revenue model**:

### Platform Revenue

| Stream | Description | Pricing |
|--------|-------------|---------|
| **PPR Pro** | All-access subscription for learners | Monthly / yearly |
| **Creator Plans** | SaaS tiers for creator tools | Free, Starter ($12/mo), Creator ($29/mo), Pro ($79/mo), Business ($149/mo) |
| **Platform Fee** | Transaction cut on creator sales | 10% via Stripe Connect |

### Creator Revenue

| Stream | Description |
|--------|-------------|
| **Course Sales** | One-time purchase or follow-gate (free with social follow) |
| **Digital Products** | Sample packs, presets, project files, PDFs, templates |
| **Beat Leases** | Tiered licensing (Basic, Premium, Exclusive, Unlimited) |
| **Coaching Sessions** | 1:1 video/audio sessions with Discord integration |
| **Memberships** | Per-creator subscription tiers (Patreon-style) |
| **Bundles** | Product bundles at discounted prices |
| **Tips** | Tip jar for fan support |
| **Playlist Curation** | Paid playlist submission reviews |
| **Mixing/Mastering Services** | Service orders with in-order messaging |

### Growth Mechanics

| Mechanic | Description |
|----------|-------------|
| **Follow Gates** | Free content gated behind social follows (Instagram, TikTok, YouTube, Spotify) + email capture |
| **Lead Magnets** | Free downloads that capture email addresses |
| **Pre-saves** | Music release pre-save campaigns with email sequences |
| **Affiliate Program** | Referral commissions for product promotion |
| **Credits System** | Platform credits for sample marketplace purchases |

## 4. Major Product Areas

### 1. Course Creation & Management
The core LMS functionality — creators build multi-module courses with video chapters (Mux-hosted), drip content scheduling, follow-gate access, and AI-assisted content generation. Includes reference guide PDFs and cheat sheets auto-generated from course content.

### 2. Course Consumption & Progress Tracking
Students browse, purchase, and take courses with chapter-by-chapter progress tracking, learning streaks, collaborative timestamped notes, Q&A system, quizzes, and certificates of completion.

### 3. Digital Products Marketplace
A multi-category storefront supporting 30+ product types: sample packs, preset packs, beat leases, project files, mixing templates, PDFs/guides, community access, tip jars, music releases, and more. Each creator gets a customizable store with optional custom domain.

### 4. Email Marketing System
A full-featured email marketing suite built into the platform — visual workflow builder (node-based), broadcast campaigns, drip sequences, contact management with segmentation, lead scoring, A/B testing, deliverability monitoring, and AI-generated email content.

### 5. AI-Powered Features
AI assistant with long-term memory, course outline & chapter content generation, cheat sheet generation, social media caption/script generation, virality scoring, and reference guide creation. Powered by OpenAI + LangChain with RAG.

### 6. Social Media Tools
Multi-platform social publishing (TikTok, Instagram, Twitter/X, YouTube, LinkedIn), content calendar, AI script generation with virality scoring, post templates, and DM automation (ManyChat-style). Includes follow-gate verification for content access.

### 7. Analytics & Reporting
Creator-level analytics (revenue, course performance, student progress, email health), platform-level admin analytics (user growth, revenue trends, category distribution), and learner-level progress tracking.

### 8. Gamification & Engagement
XP and leveling system, achievements/badges, creator levels, learning streaks, leaderboards, certificates, and contextual nudges to encourage learner-to-creator conversion.

### 9. Creator Storefronts
Each creator gets a branded store page (`/[slug]` or custom domain) displaying their courses, products, beats, memberships, and profile. Supports custom branding, social links, and pinned products.

### 10. Music-Specific Features
Audio sample browser with waveform visualization, beat marketplace with tiered licensing, curator playlists with submission system, music release pre-save campaigns, artist profiles, and track showcase system.

### 11. Community & Messaging
Direct messaging between users, Discord integration for coaching sessions and communities, and blog/content system.

### 12. Admin Dashboard
30+ admin pages for platform management including user management, financial overview, content moderation (DMCA), email monitoring, AI flywheel, creator management, and system configuration.

## 5. Dual-Mode Dashboard System

A defining architectural feature of PPR Academy is the **unified dashboard with learn/create mode toggle**:

```
┌─────────────────────────────────────────────┐
│              Dashboard                       │
│  ┌─────────────┐  ┌──────────────────┐      │
│  │  Learn Mode │  │   Create Mode    │      │
│  │             │  │                  │      │
│  │  My Courses │  │  My Products     │      │
│  │  Downloads  │  │  My Courses      │      │
│  │  Sessions   │  │  Analytics       │      │
│  │  Notes      │  │  Email Marketing │      │
│  │  Messages   │  │  Social Media    │      │
│  │  Certs      │  │  Settings        │      │
│  └─────────────┘  └──────────────────┘      │
│          ↕ Toggle ↕                          │
└─────────────────────────────────────────────┘
```

### How It Works

1. **Onboarding**: New users choose "I want to learn" or "I want to create & sell"
2. **Mode Persistence**: Preference stored in URL param (`?mode=learn`), localStorage, and Convex user record (`dashboardPreference`)
3. **Mode Resolution** (priority order):
   - URL query parameter
   - localStorage
   - Convex user preference
   - Has stores → default "create"
   - No preference → redirect to onboarding
4. **Navigation**: Each mode shows different sidebar links, content sections, and CTAs
5. **Hybrid Users**: Users with both a store AND enrollments see a mode switcher dropdown
6. **Conversion Nudges**: The platform encourages learners to become creators through contextual prompts at key milestones (course completion, reaching expert level, etc.)

### Learn Mode Features
Dashboard overview, enrolled courses, purchased products, downloads, coaching sessions, messages, notes, memberships, certificates

### Create Mode Features
Dashboard overview, course management, product management, sample management, analytics, affiliates, marketing tools, email campaigns, social media publishing, pricing, settings, integrations

## 6. Core Value Proposition

| For Learners | For Creators |
|-------------|-------------|
| Structured music production courses | All-in-one creator toolkit |
| Progress tracking & certificates | Zero-friction store setup |
| Community & Q&A | Built-in email marketing |
| AI-assisted learning | AI content generation |
| PPR Pro all-access subscription | Social media automation |
| Sample marketplace with credits | Beat licensing system |

## 7. Competitive Positioning

PPR Academy occupies a niche at the intersection of several product categories:

| Category | Competitors | PPR Differentiator |
|----------|-----------|-------------------|
| Online courses | Teachable, Thinkific, Skillshare | Music-production-specific features (beat leasing, sample packs, DAW presets) |
| Digital products | Gumroad, Payhip, Sellfy | Integrated with LMS, AI content generation, follow-gate growth mechanics |
| Email marketing | ConvertKit, Mailchimp | Built into the platform, no separate tool needed |
| Beat marketplace | BeatStars, Airbit | Part of a larger creator ecosystem, not standalone |
| Link in bio | Linktree, Koji | Full storefront with e-commerce, not just links |

---

*NEEDS EXPANSION IN PASS 2: Detailed feature comparison matrix, user journey maps, conversion funnels, pricing page breakdown, mobile experience assessment.*
