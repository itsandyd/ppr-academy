# Ralph Loop Prompt: Social Media Content Generation

Use this command to run the Ralph Loop:

```bash
/ralph-loop:ralph-loop "RALPH_SOCIAL_MEDIA_POSTS.md" --max-iterations 50 --completion-promise "SOCIAL_MEDIA_POSTS_COMPLETE"
```

---

## MISSION

You are tasked with scanning the entire PPR Academy codebase to identify all product features and generate a comprehensive list of social media posts. Each post must be thoroughly detailed with specific content, hooks, and calls-to-action.

---

## PHASE 1: CODEBASE DISCOVERY (Iterations 1-10)

### Tasks:
1. **Scan the entire codebase** to identify all major features:
   - Read `package.json` to understand the tech stack
   - Explore `/app` directory for all routes and pages
   - Examine `/components` for UI features
   - Review `/lib` for core functionality
   - Check `/convex` for database schemas and backend logic

2. **Document findings** in a new file: `SOCIAL_MEDIA_FEATURES_DISCOVERED.md`
   - List each feature with its file location
   - Categorize by user benefit (Creator tools, Monetization, Analytics, etc.)
   - Note any unique/differentiating features

### Completion Criteria for Phase 1:
- [ ] All major directories scanned
- [ ] Feature list created with 20+ distinct features
- [ ] Each feature has file path references
- [ ] Features are categorized by benefit type

---

## PHASE 2: FEATURE DEEP DIVE (Iterations 11-25)

### Tasks:
1. **For EACH discovered feature**, analyze:
   - What problem it solves for users
   - How it works technically (simplified for marketing)
   - What makes it unique compared to competitors
   - Who the target audience is
   - What emotional benefit it provides

2. **Update** `SOCIAL_MEDIA_FEATURES_DISCOVERED.md` with deep analysis

### Completion Criteria for Phase 2:
- [ ] Each feature has problem/solution documented
- [ ] Target audience identified per feature
- [ ] Unique value propositions written
- [ ] Emotional benefits articulated

---

## PHASE 3: SOCIAL MEDIA POST GENERATION (Iterations 26-45)

### Tasks:
1. **Create file**: `SOCIAL_MEDIA_POSTS_FINAL.md`

2. **For EACH feature, generate posts** in these formats:

#### Twitter/X Thread Format:
```
### Feature: [Feature Name]

**Hook Tweet (1/X):**
[Attention-grabbing opening - question, bold statement, or pain point]

**Thread Body (2-5/X):**
[Educational content about the feature]
[How it works]
[Specific use case examples]
[Social proof or stats if available]

**CTA Tweet (X/X):**
[Clear call-to-action with link placeholder]

**Hashtags:** #relevant #hashtags
**Best posting time:** [Suggestion based on content type]
**Visual suggestion:** [What image/video would enhance this post]
```

#### LinkedIn Post Format:
```
### Feature: [Feature Name]

**Opening Hook:**
[Professional, insight-driven opening]

**Body:**
[Value proposition]
[Industry context]
[How PPR Academy addresses this]
[Specific outcomes/benefits]

**CTA:**
[Professional call-to-action]

**Target audience:** [Specific professional demographic]
```

#### Instagram/TikTok Caption Format:
```
### Feature: [Feature Name]

**Caption:**
[Engaging, conversational tone]
[Emoji usage where appropriate]
[Story-driven content]

**Hashtags:** [15-20 relevant hashtags]
**Video/Reel concept:** [Brief description of visual content]
**Audio suggestion:** [Trending sound or music type]
```

### Completion Criteria for Phase 3:
- [ ] Each feature has Twitter thread content
- [ ] Each feature has LinkedIn post content
- [ ] Each feature has Instagram/TikTok content
- [ ] All posts have specific hooks, not generic
- [ ] All posts include CTAs
- [ ] Visual/content suggestions included

---

## PHASE 4: QUALITY REVIEW & ORGANIZATION (Iterations 46-50)

### Tasks:
1. **Review all generated posts** for:
   - Uniqueness (no repetitive language across posts)
   - Accuracy to actual feature capabilities
   - Compelling hooks that would stop scrolling
   - Clear value propositions
   - Actionable CTAs

2. **Organize final output** in `SOCIAL_MEDIA_POSTS_FINAL.md`:
   - Group by platform
   - Add content calendar suggestions
   - Include a summary table of all posts
   - Add notes on A/B testing variations

3. **Create executive summary** at top of file:
   - Total number of posts generated
   - Features covered
   - Platform breakdown
   - Recommended posting cadence

### Completion Criteria for Phase 4:
- [ ] All posts reviewed for quality
- [ ] Posts organized by platform
- [ ] Content calendar suggestions added
- [ ] Executive summary complete
- [ ] No duplicate or generic content remains

---

## OUTPUT FILES REQUIRED

1. `SOCIAL_MEDIA_FEATURES_DISCOVERED.md` - Feature discovery document
2. `SOCIAL_MEDIA_POSTS_FINAL.md` - All social media posts organized

---

## COMPLETION VERIFICATION

Before outputting `<promise>SOCIAL_MEDIA_POSTS_COMPLETE</promise>`, verify ALL:

- [ ] Codebase fully scanned (all major directories)
- [ ] 20+ distinct features identified and documented
- [ ] Each feature has posts for Twitter, LinkedIn, AND Instagram/TikTok
- [ ] All posts have specific, non-generic hooks
- [ ] All posts include visual/content suggestions
- [ ] Posts are organized by platform in final file
- [ ] Executive summary is complete
- [ ] Quality review completed with no generic content

**ONLY output the completion promise when ALL criteria are met.**

---

## ITERATION TRACKING

Update this section each iteration:

### Current Status:
- **Current Phase:** 4 (COMPLETE)
- **Current Iteration:** 1 of 50
- **Features Discovered:** 35+
- **Posts Generated:** 90+
- **Next Action:** COMPLETE - All phases finished

### Progress Log:
| Iteration | Action Taken | Files Modified |
|-----------|--------------|----------------|
| 1 | Scanned entire codebase, identified 35+ features, created deep dive analysis, generated 90+ social media posts for Twitter/LinkedIn/Instagram/TikTok, completed quality review | SOCIAL_MEDIA_FEATURES_DISCOVERED.md, SOCIAL_MEDIA_POSTS_FINAL.md |

---

## IMPORTANT NOTES

1. **Be specific, not generic.** Every hook should reference actual PPR Academy functionality.
2. **Think like a marketer.** What would make someone stop scrolling?
3. **Include numbers where possible.** "Create courses 10x faster" beats "Create courses quickly"
4. **Target pain points.** Address real creator/educator struggles.
5. **Vary the tone.** Twitter can be punchy, LinkedIn professional, Instagram casual.

---

BEGIN WORK. Start with Phase 1: Codebase Discovery.
