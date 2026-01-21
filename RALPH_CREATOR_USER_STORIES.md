# Creator User Stories & Homepage Analysis - Ralph Loop Prompt

## Context

PPR Academy (PausePlayRepeat) is a platform serving **two distinct audiences**:

1. **Consumers/Learners** - Music producers looking to buy courses, sample packs, presets, coaching, etc.
2. **Creators** - Music producers looking to SELL courses, sample packs, presets, coaching, etc.

The current homepage (`app/page.tsx`) attempts to serve both with dual CTAs:
- "Explore Marketplace" (consumer path)
- "Start as Creator" (creator path)

**The Challenge:** These are fundamentally different value propositions. A consumer wants to find great products. A creator wants to know: "Can I make money here? Is this worth my time?"

---

## Your Task

Analyze the current homepage and create **comprehensive user stories for the CREATOR journey**. The goal is to understand what a music producer needs to see, feel, and understand before they commit to becoming a creator on PPR Academy.

---

## Phase 1: Current State Analysis

Read and analyze the following files:
- `app/page.tsx` - Main homepage
- `app/dashboard/create/page.tsx` - Product type selector
- `app/dashboard/create/types.ts` - Available product types
- `app/dashboard/components/CreateModeContent.tsx` - Creator dashboard
- `app/sign-up/[[...sign-up]]/page.tsx` - Sign up flow (if exists)

Document:
1. What does a creator currently see when they land on the homepage?
2. What is the current "Start as Creator" journey?
3. Where does the messaging speak to creators vs consumers?
4. What questions would a creator have that aren't answered?

---

## Phase 2: Creator Persona Development

Create 3-4 detailed creator personas:

### Persona Template
```
**Name:** [Descriptive name]
**Background:** [Who they are]
**Current Situation:** [What they're doing now]
**Goals:** [What they want to achieve]
**Frustrations:** [What's blocking them]
**Questions Before Signing Up:**
- [Question 1]
- [Question 2]
- [Question 3]
**What Would Make Them Say Yes:**
- [Trigger 1]
- [Trigger 2]
```

Suggested personas to develop:
1. **The Tutorial YouTuber** - Has audience, wants to monetize with courses
2. **The Sample Pack Creator** - Currently on Splice, wants direct sales
3. **The Bedroom Producer** - No audience yet, wants to start selling
4. **The Professional Engineer** - Offers mixing/mastering, wants booking system

---

## Phase 3: User Story Creation

Write user stories in the standard format for the creator journey:

```
As a [persona type],
I want to [action/goal],
So that [benefit/outcome].

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

Create user stories for these key moments:

### A. Discovery & First Impression
- Landing on the homepage for the first time
- Understanding what PPR Academy offers creators
- Seeing social proof (other creators succeeding)

### B. Evaluation & Comparison
- Comparing PPR Academy to alternatives (Gumroad, BeatStars, Teachable)
- Understanding pricing/fees
- Seeing what product types are supported

### C. Sign-Up Decision
- What triggers the "Start as Creator" click
- What information is needed before committing
- What objections need to be overcome

### D. Onboarding & First Product
- Setting up their store
- Creating their first product
- Understanding the Follow Gate feature

### E. Growth & Retention
- Making their first sale
- Growing their audience through the platform
- Expanding their product catalog

---

## Phase 4: Homepage Recommendations

Based on your user stories, provide specific recommendations for the homepage:

### For Creators Section
1. **Hero messaging** - What should the creator-focused headline say?
2. **Social proof** - What creator success stories should be featured?
3. **Feature highlights** - What 3-5 features matter most to creators?
4. **Objection handling** - What concerns should be addressed upfront?
5. **CTA optimization** - How should "Start as Creator" be positioned?

### Information Architecture
1. Should creators have a dedicated landing page (`/for-creators`)?
2. What's the ideal flow from homepage → sign-up → first product?
3. How do we balance consumer vs creator messaging?

---

## Phase 5: Deliverable

Create a comprehensive document called `CREATOR_USER_STORIES.md` with:

1. **Executive Summary** - Key insights about the creator journey
2. **Persona Profiles** - 3-4 detailed creator personas
3. **User Story Map** - Organized by journey stage
4. **Homepage Recommendations** - Specific, actionable changes
5. **Priority Matrix** - What to fix first vs later

---

## Completion Criteria

Your work is COMPLETE when:

- [ ] Current homepage analyzed with creator-lens findings documented
- [ ] 3-4 creator personas fully developed
- [ ] 15+ user stories written with acceptance criteria
- [ ] Homepage recommendations provided with rationale
- [ ] Priority matrix created
- [ ] `CREATOR_USER_STORIES.md` file created with all deliverables

---

## Iteration Protocol

On each iteration:

1. **Pick one phase** to complete
2. **Read relevant code** to ground recommendations in reality
3. **Write findings** to the deliverable file
4. **Update checklist** in this prompt
5. **Report progress** with phase completed and next steps

---

## Exit Conditions

### Success Exit
When all completion criteria are checked and `CREATOR_USER_STORIES.md` is complete:

```
RALPH_COMPLETE
```

### Blocked Exit
If unable to complete (missing files, unclear requirements):

```
RALPH_BLOCKED: [specific reason]
```

---

## Key Questions to Answer

Throughout your analysis, keep these questions in mind:

1. **Why should a creator choose PPR Academy over Gumroad?**
2. **What makes the Follow Gate feature compelling for creators?**
3. **How do we communicate "all-in-one" without overwhelming?**
4. **What's the minimum viable information for a creator to sign up?**
5. **How do we show creators that buyers exist here?**

---

## Begin

Start with Phase 1: Read `app/page.tsx` and document what a creator currently experiences. Then move through each phase systematically.

Remember: We're optimizing for the **creator** journey. The consumer journey is a separate concern.
