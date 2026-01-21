# Build /for-creators Landing Page - Ralph Loop Prompt

## Context

You are building a landing page at `/for-creators` for PPR Academy (PausePlayRepeat), a platform where music producers can sell digital products. This page needs to convert music producers into creators on the platform.

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animations:** Framer Motion
- **Auth:** Clerk (`useAuth`, `SignUpButton`)
- **Location:** `/app/for-creators/page.tsx`

### Design System Reference
- Look at `app/page.tsx` for animation patterns, gradient styles, and component usage
- Use existing components from `@/components/ui/`
- Follow the visual style: glassmorphism, gradient orbs, smooth animations

---

## Your Task

Build a `/for-creators` landing page that tells the **story of a creator's journey** through ALL the product types PPR Academy offers. The page should:

1. **Hook them emotionally** - Start with their current frustration (giving away free content, using multiple platforms, not monetizing their skills)

2. **Walk through product types as a narrative** - Show how one producer can build multiple income streams:
   - Sample Packs & Preset Packs (sell your sounds)
   - MIDI Packs (sell your melodies)
   - Effect Chains (sell your signal chains, DAW-specific)
   - Beat Leases (license your instrumentals)
   - Project Files (sell your sessions for learning)
   - Mixing Templates (sell your workflow)
   - Courses (teach what you know)
   - Coaching Sessions (1-on-1 mentoring)
   - PDFs & Cheat Sheets (quick reference guides)
   - Community Access (paid Discord/community)
   - Tip Jar (let fans support you)

3. **Highlight the Follow Gate feature** - This is the unique differentiator. Explain how free products can require email + social follows before download.

4. **Show the value props:**
   - Keep 90% of sales
   - All-in-one platform (no more Gumroad + Teachable + Calendly + Mailchimp)
   - AI-powered content assistance
   - Beautiful storefronts
   - Built-in email marketing

5. **End with strong CTA** - "Start Selling Free" button that goes to `/sign-up?intent=creator`

---

## Page Structure

### Section 1: Hero
- Headline that speaks to creators (not consumers)
- Subtext about turning skills into income
- Primary CTA: "Start Selling Free"
- Secondary: "See how it works" (scroll to next section)

### Section 2: The Problem
- "You're probably using 5 different tools..."
- Pain points: Gumroad for products, Teachable for courses, Calendly for coaching, Mailchimp for emails, Linktree for links
- Visual showing the fragmented stack

### Section 3: The Solution - Product Type Journey
- Interactive or scrolling narrative through each product type
- For each type, show:
  - Icon
  - What it is
  - Who it's for
  - Example use case
- Group logically:
  - **Sounds & Tools:** Sample Packs, Preset Packs, MIDI Packs, Effect Chains, Mixing Templates
  - **Music:** Beat Leases, Project Files
  - **Education:** Courses, Coaching, PDFs/Cheat Sheets
  - **Community:** Community Access, Tip Jar

### Section 4: The Follow Gate Feature
- Dedicated section explaining this unique feature
- "Turn free downloads into followers"
- Show how it works: Free product → Require email + Instagram follow + YouTube subscribe → User completes → Gets download
- Emphasize: "No other platform does this"

### Section 5: Why PPR Academy
- 90% revenue (compare to Gumroad's 10% + fees)
- All-in-one dashboard
- AI content assistant
- Beautiful storefronts
- Built-in analytics
- Email marketing included

### Section 6: Social Proof (Placeholder)
- "Creators earning on PPR Academy"
- Placeholder cards for future testimonials
- Or pull from existing `featuredCreators` data

### Section 7: Final CTA
- Strong headline: "Ready to turn your skills into income?"
- "Start Selling Free" button
- Trust indicators: "No credit card required", "Free to start", "90% payout"

---

## Technical Requirements

### File Location
```
app/for-creators/page.tsx
```

### Imports to Use
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";
// Icons from lucide-react as needed
```

### Make it "use client"
The page needs Framer Motion animations, so add `"use client"` at the top.

### Responsive Design
- Mobile-first approach
- Test at sm, md, lg breakpoints
- Stack sections vertically on mobile

### Animation Patterns
Reference `app/page.tsx` for:
- `motion.div` with `initial`, `animate`, `whileInView`
- Staggered children animations
- Scroll-triggered reveals with `viewport={{ once: true }}`

---

## Product Type Data

Use this data for the product sections:

```tsx
const productTypes = [
  {
    category: "Sounds & Tools",
    items: [
      {
        name: "Sample Packs",
        icon: Music,
        description: "Drums, loops, one-shots, and textures",
        forWho: "Producers with unique sounds",
        example: "Lo-fi drum kit with 200+ samples"
      },
      {
        name: "Preset Packs",
        icon: Sliders,
        description: "Synth presets for Serum, Vital, Massive, etc.",
        forWho: "Sound designers and synth nerds",
        example: "50 future bass presets for Serum"
      },
      {
        name: "MIDI Packs",
        icon: Piano,
        description: "Chord progressions, melodies, and drum patterns",
        forWho: "Producers who write great progressions",
        example: "Neo-soul chord pack with 100 progressions"
      },
      {
        name: "Effect Chains",
        icon: Zap,
        description: "Signal chains for vocals, drums, mix bus",
        forWho: "Mix engineers with go-to chains",
        example: "Vocal chain rack for Ableton"
      },
      {
        name: "Mixing Templates",
        icon: Layout,
        description: "Pre-configured DAW sessions",
        forWho: "Engineers with proven workflows",
        example: "Hip-hop mixing template for Pro Tools"
      }
    ]
  },
  {
    category: "Music",
    items: [
      {
        name: "Beat Leases",
        icon: Music2,
        description: "License instrumentals to artists",
        forWho: "Beat makers and producers",
        example: "Trap beat with MP3, WAV, and trackout options"
      },
      {
        name: "Project Files",
        icon: FolderOpen,
        description: "Full DAW sessions for learning",
        forWho: "Producers who want to teach by example",
        example: "Full Ableton project breakdown"
      }
    ]
  },
  {
    category: "Education",
    items: [
      {
        name: "Courses",
        icon: Video,
        description: "Structured video lessons with modules",
        forWho: "Producers who can teach",
        example: "Complete mixing course with 20 lessons"
      },
      {
        name: "Coaching Sessions",
        icon: Mic2,
        description: "1-on-1 calls and feedback sessions",
        forWho: "Experienced producers and engineers",
        example: "60-minute mix feedback session"
      },
      {
        name: "PDFs & Cheat Sheets",
        icon: FileText,
        description: "Quick reference guides and ebooks",
        forWho: "Anyone with knowledge to share",
        example: "EQ frequency cheat sheet"
      }
    ]
  },
  {
    category: "Community",
    items: [
      {
        name: "Community Access",
        icon: Users,
        description: "Paid Discord or private community",
        forWho: "Producers with engaged audiences",
        example: "Monthly Discord membership"
      },
      {
        name: "Tip Jar",
        icon: Heart,
        description: "Let fans support you directly",
        forWho: "Anyone with supporters",
        example: "Pay-what-you-want support"
      }
    ]
  }
];
```

---

## Completion Criteria

Your work is COMPLETE when:

- [ ] `/app/for-creators/page.tsx` exists and renders without errors
- [ ] All 7 sections are implemented with content
- [ ] All 12 product types are displayed in the journey section
- [ ] Follow Gate feature has a dedicated, compelling section
- [ ] Page is responsive (mobile, tablet, desktop)
- [ ] Animations are smooth and match homepage style
- [ ] CTAs link to `/sign-up?intent=creator`
- [ ] `npm run build` passes without errors
- [ ] `npm run typecheck` passes without errors

---

## Iteration Protocol

On each iteration:

1. **Check current state** - Does the file exist? What's implemented?
2. **Build incrementally** - Add one section at a time
3. **Verify** - Run `npm run typecheck` after significant changes
4. **Refine** - Polish animations, copy, and responsiveness

---

## Exit Conditions

### Success Exit
When all completion criteria are met and the page is fully functional:

```
RALPH_CREATORS_PAGE_COMPLETE
```

### Blocked Exit
If you encounter an unresolvable blocker:

```
RALPH_BLOCKED: [specific reason]
```

---

## Design Inspiration

The page should feel like a story unfolding as you scroll:

1. **"You make music. Why not make money from it?"** (Hook)
2. **"Right now, you're probably juggling..."** (Problem)
3. **"What if you could do it all in one place?"** (Solution tease)
4. **"Here's everything you can sell..."** (Product journey)
5. **"Plus, turn free content into followers"** (Follow Gate)
6. **"Keep 90% of everything you earn"** (Value props)
7. **"Join creators already earning"** (Social proof)
8. **"Ready to start?"** (CTA)

Make it feel aspirational but achievable. Show the full breadth of possibilities without overwhelming.

---

## Begin

Start by creating the file at `app/for-creators/page.tsx` with the basic structure. Then build section by section.
