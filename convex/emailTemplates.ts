import { v } from "convex/values";
import { query } from "./_generated/server";

// ============================================================================
// FUNNEL-BASED EMAIL TEMPLATES
// ============================================================================
// Organized by funnel stage (TOFU, MOFU, BOFU) and product type
// ============================================================================

const CAMPAIGN_TEMPLATES = [
  // ========================================================================
  // SAMPLE PACKS FUNNEL
  // ========================================================================
  
  // TOFU - Sample Packs
  {
    id: "free-sample-pack-tofu",
    name: "🎁 Free Sample Pack Giveaway",
    description: "Build your email list with a free sample pack",
    category: "sample-packs",
    funnelStage: "TOFU",
    subject: "FREE Download: {{packName}} ({{sampleCount}} Pro Samples)",
    previewText: "{{sampleCount}} royalty-free {{genre}} samples - instant download",
    body: `What's up,

Giving away **{{packName}}** completely free. No catch.

**What You Get:**
• {{sampleCount}} professional {{genre}} samples
• WAV format, ready for your DAW
• 100% royalty-free (commercial use included)
• Instant download, no credit card

[Download Free Pack →]({{downloadLink}})

Why free? I remember being a broke producer hunting for quality sounds.

Use these to make something fire. That's all I ask.

{{creatorName}}

P.S. - Browse {{totalPacks}} more packs [here]({{storeLink}}) when you're ready.`,
    tags: ["free", "lead-magnet", "tofu", "sample-pack"],
    useCase: "List building, cold audience, social media traffic",
    estimatedOpenRate: "45-55%",
    popular: true,
  },

  // MOFU - Sample Packs
  {
    id: "sample-pack-showcase-mofu",
    name: "📦 Sample Pack Collection Showcase",
    description: "Showcase your full sample pack catalog to interested subscribers",
    category: "sample-packs",
    funnelStage: "MOFU",
    subject: "{{genre}} Producer? These {{packCount}} packs are for you",
    previewText: "Handpicked samples for {{genre}} production",
    body: `Hey {{firstName}},

Since you grabbed the free pack, thought you'd want to see the full collection.

**🎵 My Top {{packCount}} Sample Packs:**

**1. {{pack1Name}}** - {{pack1Count}} samples ({{pack1Price}} credits)
{{pack1Description}}
[Preview & Download →]({{pack1Link}})

**2. {{pack2Name}}** - {{pack2Count}} samples ({{pack2Price}} credits)
{{pack2Description}}
[Preview & Download →]({{pack2Link}})

**3. {{pack3Name}}** - {{pack3Count}} samples ({{pack3Price}} credits)
{{pack3Description}}
[Preview & Download →]({{pack3Link}})

**💰 BUNDLE DEAL:** Get all 3 packs for {{bundlePrice}} credits (save {{savingsPercent}}%)

Every sample is:
✓ 100% original and cleared
✓ Mixed and mastered
✓ Ready to drag and drop
✓ Commercial license included

[Browse Full Collection →]({{catalogLink}})

Questions? Hit reply.

{{creatorName}}`,
    tags: ["catalog", "mofu", "sample-pack", "bundle"],
    useCase: "Educate on product range, create desire",
    estimatedOpenRate: "30-38%",
    popular: true,
  },

  // BOFU - Sample Packs
  {
    id: "sample-pack-launch-bofu",
    name: "🚀 Sample Pack Launch",
    description: "Launch a new sample pack to your engaged audience",
    category: "sample-packs",
    funnelStage: "BOFU",
    subject: "LIVE NOW: {{packName}} - {{sampleCount}} {{genre}} Samples",
    previewText: "Launch price: {{creditPrice}} credits ({{discount}}% off) - First 100 only",
    body: `{{firstName}},

It's live. **{{packName}}** just dropped.

This is the pack I've been cooking up for {{developmentTime}}. {{sampleCount}} samples that I actually use in my own productions.

**🎧 What's Inside:**
• {{feature1}}
• {{feature2}}  
• {{feature3}}
• {{feature4}}
• All in {{format}} format, {{bitDepth}}-bit

🔊 **[Preview every sample here]({{previewLink}})**

**💰 LAUNCH PRICING:**
First 100 people: {{creditPrice}} credits
After that: {{regularPrice}} credits

You already know the quality from the free pack. This is that × 10.

[Get {{packName}} Now →]({{purchaseLink}})

Launch price ends: {{deadline}}

Make some heat,
{{creatorName}}

P.S. - If you're not feeling it after listening to the previews, no worries. But if you are, don't wait - this price won't last.`,
    tags: ["launch", "bofu", "sample-pack", "urgency"],
    useCase: "Launch to engaged audience, maximize conversions",
    estimatedOpenRate: "38-48%",
    popular: true,
  },

  // ========================================================================
  // COURSES FUNNEL
  // ========================================================================

  // TOFU - Courses
  {
    id: "free-course-module-tofu",
    name: "🎓 Free Course Module/Masterclass",
    description: "Attract new leads with valuable free training",
    category: "courses",
    funnelStage: "TOFU",
    subject: "Free Training: {{skillName}} in {{duration}} Minutes",
    previewText: "Learn {{keyBenefit}} - no credit card required",
    body: `{{firstName}},

I put together a free training that's going to change how you approach {{skillTopic}}.

**FREE MASTERCLASS: {{trainingTitle}}**

In this {{duration}}-minute video, you'll learn:
• {{takeaway1}}
• {{takeaway2}}
• {{takeaway3}}
• {{takeaway4}}

[Watch Free Training →]({{trainingLink}})

This is the exact {{technique}} I use on every track. 

No fluff. No upsell. Just pure value.

(OK, there's a small pitch at the end for my full course, but you can skip it if you want.)

Let's go,
{{creatorName}}

P.S. - This training is live for {{availabilityPeriod}}. Watch it while it's up.`,
    tags: ["free-training", "tofu", "course", "masterclass"],
    useCase: "Attract cold traffic, build authority, capture emails",
    estimatedOpenRate: "35-45%",
    popular: true,
  },

  // MOFU - Courses
  {
    id: "course-content-preview-mofu",
    name: "📚 Course Behind-the-Scenes",
    description: "Show course content and student results to build interest",
    category: "courses",
    funnelStage: "MOFU",
    subject: "Inside my {{courseName}} course (student results)",
    previewText: "See what students are creating after taking {{courseName}}",
    body: `Hey {{firstName}},

Quick update on **{{courseName}}**.

We're {{weeksLive}} weeks in and the student results are crazy.

**🎵 What Students Are Saying:**

"{{testimonial1}}" - {{student1Name}}

"{{testimonial2}}" - {{student2Name}}

"{{testimonial3}}" - {{student3Name}}

**📚 Here's What We Cover:**

**Module 1:** {{module1Title}}
{{module1Preview}}

**Module 2:** {{module2Title}}
{{module2Preview}}

**Module 3:** {{module3Title}}
{{module3Preview}}

Plus {{bonusCount}} bonus modules on {{bonusTopics}}.

**Current Price:** {{currentPrice}} credits ({{studentsEnrolled}} students enrolled)

[See Full Curriculum →]({{courseLink}})

Not ready yet? No pressure. Just showing you what's possible.

{{creatorName}}

P.S. - Next enrollment period the price goes up. Fair warning.`,
    tags: ["course", "mofu", "social-proof", "preview"],
    useCase: "Nurture leads, build desire, show results",
    estimatedOpenRate: "28-36%",
    popular: true,
  },

  // BOFU - Courses
  {
    id: "course-enrollment-closing-bofu",
    name: "🚨 Course Enrollment Closing",
    description: "Create urgency with limited-time enrollment window",
    category: "courses",
    funnelStage: "BOFU",
    subject: "{{courseName}} closes in {{hoursLeft}} hours",
    previewText: "Last chance to enroll + get {{bonusValue}} in bonuses",
    body: `{{firstName}},

Enrollment for **{{courseName}}** closes in {{hoursLeft}} hours.

After that, doors are closed until {{nextLaunchDate}}.

**What You Get Right Now:**
✅ {{moduleCount}} modules ({{totalHours}} hours of content)
✅ {{bonus1}}
✅ {{bonus2}}
✅ {{bonus3}}
✅ Private Discord community
✅ Lifetime access + future updates
✅ Certificate on completion

**Investment:** {{price}} credits

{{studentCountThisCohort}} producers already enrolled this round.

[Enroll Now →]({{enrollLink}})

**Why the deadline?**
{{reasonForDeadline}}

**Still not sure?** Here's what {{testimonialName}} said:
"{{testimonial}}"

This is your last chance for {{monthYear}}. 

Make the call.

{{creatorName}}

P.S. - 30-day money-back guarantee. If it's not for you, full refund. No risk.`,
    tags: ["course", "bofu", "urgency", "closing"],
    useCase: "Convert warm leads, final enrollment push",
    estimatedOpenRate: "42-52%",
    popular: true,
  },

  // ========================================================================
  // COACHING FUNNEL
  // ========================================================================

  // TOFU - Coaching
  {
    id: "free-feedback-offer-tofu",
    name: "🎧 Free Track Feedback Offer",
    description: "Attract leads by offering free production feedback",
    category: "coaching",
    funnelStage: "TOFU",
    subject: "I'll review your track for free ({{spotsLeft}} spots left)",
    previewText: "Get professional feedback on your production",
    body: `What's up,

Opening up {{totalSpots}} FREE track feedback spots this week.

**Here's the deal:**

Send me your track → I'll record a {{duration}}-minute video breaking down:
• What's working
• What needs improvement  
• Quick wins you can implement today
• How to take it to the next level

**No cost. No pitch. Just honest feedback.**

[Submit Your Track →]({{submissionLink}})

Spots available: {{spotsLeft}}/{{totalSpots}}

These fill up in hours, so if you want feedback, grab a spot now.

{{creatorName}}

P.S. - I do this monthly to stay connected with producers and give back. Simple as that.`,
    tags: ["free-feedback", "tofu", "coaching", "lead-gen"],
    useCase: "Build authority, capture emails, demonstrate value",
    estimatedOpenRate: "40-50%",
    popular: true,
  },

  // MOFU - Coaching
  {
    id: "coaching-case-study-mofu",
    name: "💎 Coaching Client Results",
    description: "Build interest with coaching transformation stories",
    category: "coaching",
    funnelStage: "MOFU",
    subject: "How {{clientName}} went from {{before}} to {{after}}",
    previewText: "Real coaching results from a {{genre}} producer",
    body: `Hey {{firstName}},

Want to show you something cool.

{{clientName}} came to me {{timeAgo}} with {{problem}}.

**The Challenge:**
{{detailedProblem}}

**What We Did:**
{{solution1}}
{{solution2}}
{{solution3}}

**The Results:**
{{result1}}
{{result2}}
{{result3}}

**Before:** {{beforeAudio}}
**After:** {{afterAudio}}

Listen to that difference. That's what {{sessionsCount}} focused sessions can do.

**My 1-on-1 Coaching Includes:**
• {{sessionDuration}}-min Zoom sessions
• Screen share + project file review
• Custom action plan for YOUR music
• Unlimited Discord support between sessions
• Session recordings

**Investment:** {{packagePrice}} credits for {{sessionsCount}} sessions

[Book Your First Session →]({{bookingLink}})

{{spotsAvailable}} spots left this month.

{{creatorName}}

P.S. - {{clientName}}'s track just got {{achievement}}. This stuff works.`,
    tags: ["coaching", "mofu", "case-study", "results"],
    useCase: "Build desire for coaching, show transformations",
    estimatedOpenRate: "32-40%",
    popular: true,
  },

  // BOFU - Coaching
  {
    id: "coaching-limited-spots-bofu",
    name: "📅 Last Coaching Spots Available",
    description: "Fill remaining coaching slots with scarcity messaging",
    category: "coaching",
    funnelStage: "BOFU",
    subject: "{{spotsLeft}} coaching spots left for {{month}}",
    previewText: "Book your 1-on-1 session before they're gone",
    body: `{{firstName}},

Quick update: {{spotsLeft}} coaching spots left for {{month}}.

If you've been thinking about booking a session, now's the time.

**What We'll Work On:**
{{customizable based on your needs}}

Common requests:
• Mix/master feedback
• Arrangement/structure  
• Sound design review
• Career/industry advice
• Workflow optimization

**Session:** {{duration}} min via Zoom
**Price:** {{sessionPrice}} credits
**Includes:** Recording + Discord follow-up support

[Book Your Spot →]({{bookingLink}})

These usually fill by {{usuallyFullBy}}, and I don't open more until {{nextMonth}}.

**Not sure if coaching is right for you?**
Here's what {{studentName}} said: "{{testimonial}}"

Let's work.

{{creatorName}}

P.S. - Come with a project file and specific questions. We'll maximize every minute.`,
    tags: ["coaching", "bofu", "scarcity", "conversion"],
    useCase: "Fill remaining slots, convert fence-sitters",
    estimatedOpenRate: "38-46%",
    popular: true,
  },

  // ========================================================================
  // CONTENT/NEWSLETTER (NURTURE - ALL STAGES)
  // ========================================================================

  {
    id: "production-tips-newsletter",
    name: "🎛️ Weekly Production Tips",
    description: "Nurture: Regular value delivery and product mentions",
    category: "content",
    funnelStage: "NURTURE",
    subject: "Producer Tips: {{weekTopic}}",
    previewText: "This week's production technique + studio updates",
    body: `What's good {{firstName}},

**This Week's Production Tip:**

{{productionTip}}

I just used this on my latest {{projectType}} and it completely transformed the {{aspect}}.

**🔊 From The Studio:**
{{studioUpdate}}

**🆕 New This Week:**
{{newRelease}}

**💰 Deal of the Week:**
{{weeklyDeal}}

Keep creating,
{{creatorName}}

P.S. - Next week: {{nextWeekTopic}}`,
    tags: ["newsletter", "nurture", "tips", "all-stages"],
    useCase: "Stay top of mind, provide value, soft promotions",
    estimatedOpenRate: "28-35%",
    popular: true,
  },

  // ========================================================================
  // CROSS-SELL & UPSELL
  // ========================================================================

  {
    id: "sample-pack-to-course-upsell",
    name: "💎 Sample Pack → Course Upsell",
    description: "Upsell course to sample pack buyers",
    category: "cross-sell",
    funnelStage: "BOFU",
    subject: "You bought {{packName}}. Now learn how I made them.",
    previewText: "Behind-the-scenes course on creating pro samples",
    body: `Hey {{firstName}},

You bought **{{packName}}**. Now I want to show you how I made every sound in it.

**Introducing: {{courseName}}**

The complete process I use to create samples that actually get used.

**You'll Learn:**
• {{technique1}}
• {{technique2}}
• {{technique3}}
• {{technique4}}

**BUYER BONUS:** Since you bought {{packName}}, you get {{discount}}% off.

Your price: {{discountedPrice}} credits (normally {{regularPrice}})

[Enroll With Buyer Discount →]({{courseLink}})

Plus you get:
✓ {{bonusPackName}} ({{bonusPackCount}} extra samples)
✓ All my {{resourceType}} templates
✓ Private Discord access

Offer expires: {{expirationDate}}

This is for buyers only. Non-transferable.

{{creatorName}}

P.S. - {{studentResult}}`,
    tags: ["upsell", "course", "sample-pack", "cross-sell"],
    useCase: "Maximize customer lifetime value",
    estimatedOpenRate: "35-42%",
    popular: true,
  },

  {
    id: "course-to-coaching-upsell",
    name: "🎯 Course → Coaching Upsell",
    description: "Upsell coaching to course students",
    category: "cross-sell",
    funnelStage: "BOFU",
    subject: "Ready for personalized help with {{courseName}}?",
    previewText: "1-on-1 coaching for {{courseName}} students",
    body: `Hey {{firstName}},

You're crushing it in **{{courseName}}**.

But I know sometimes you hit a wall where you need 1-on-1 help.

**NEW: Student Coaching Sessions**

Exclusive for {{courseName}} students:
• {{duration}}-min personalized session
• Review YOUR actual project
• Get specific feedback on your mix/track
• Custom action plan based on where you're at

**Student Rate:** {{studentPrice}} credits ({{discount}}% off regular {{regularPrice}})

[Book Your Session →]({{bookingLink}})

{{spotsThisMonth}} spots available this month.

This isn't for everyone. But if you're serious about taking your production to the next level, this is how.

{{creatorName}}

P.S. - Bring a project file and come with questions. We'll go deep.`,
    tags: ["upsell", "coaching", "course", "premium"],
    useCase: "Upsell premium service to engaged students",
    estimatedOpenRate: "30-38%",
    popular: false,
  },

  // ========================================================================
  // RETENTION & RE-ENGAGEMENT
  // ========================================================================

  {
    id: "inactive-producer-reengagement",
    name: "🎵 Win Back Inactive Producers",
    description: "Re-engage producers who haven't purchased in 60+ days",
    category: "retention",
    funnelStage: "RE-ENGAGEMENT",
    subject: "{{firstName}}, still producing?",
    previewText: "Here's {{creditsAmount}} free credits to come back",
    body: `{{firstName}},

Haven't seen you around in a while.

Still making music? Or did life get in the way? (Happens to all of us.)

**If you're still producing**, I want to get you back in:

→ {{creditsAmount}} FREE credits (no strings)
→ Access to {{newPacksCount}} new sample packs you missed
→ {{newCourseTitle}} course is finally done (you asked about this)

[Claim Your Credits →]({{claimLink}})

Credits expire in {{expirationDays}} days.

**Or if you're done with production emails**, I get it. [Unsubscribe here]({{unsubscribeLink}}) - no hard feelings.

Either way, hope you're doing well.

{{creatorName}}

P.S. - If you come back and make something with the credits, send it to me. I want to hear it.`,
    tags: ["re-engagement", "inactive", "retention", "credits"],
    useCase: "Win back cold subscribers, clean list",
    estimatedOpenRate: "18-25%",
    popular: true,
  },

  {
    id: "student-dropout-reengagement",
    name: "📖 Course Dropout Re-Engagement",
    description: "Bring back students who stopped halfway through course",
    category: "retention",
    funnelStage: "RE-ENGAGEMENT",
    subject: "You're {{percentComplete}}% through {{courseName}}... finish it?",
    previewText: "Come back and complete the course - here's what you're missing",
    body: `Hey {{firstName}},

Real talk: I noticed you stopped at Module {{lastModule}} of **{{courseName}}**.

You were {{percentComplete}}% done. That's too close to quit now.

**What You're Missing:**
• {{upcomingModule1}}
• {{upcomingModule2}}
• {{upcomingModule3}}
• The final project that ties it all together

**Why producers drop off:**
Usually it's not the content - it's life getting in the way.

I get it. But here's the thing: you already paid for it. Might as well finish.

[Pick Up Where You Left Off →]({{resumeLink}})

Need help? Jump in Discord. The community's still there.

Or if something about the course isn't working for you, hit reply and tell me. I want to know.

{{creatorName}}

P.S. - When you finish, you get the certificate + {{completionBonus}}. Don't leave that on the table.`,
    tags: ["re-engagement", "course", "dropout", "completion"],
    useCase: "Increase course completion rates",
    estimatedOpenRate: "35-43%",
    popular: false,
  },

  // ========================================================================
  // CART ABANDONMENT (ALL PRODUCTS)
  // ========================================================================

  {
    id: "cart-abandonment-universal",
    name: "🛒 Cart Abandonment (Universal)",
    description: "Recover abandoned carts for any product type",
    category: "automation",
    funnelStage: "BOFU",
    subject: "Still thinking about {{productName}}? 🤔",
    previewText: "Complete your order + get {{discount}}% off",
    body: `Hey {{firstName}},

Noticed you were checking out **{{productName}}** but didn't complete the purchase.

Still interested?

**Here's {{discount}}% off** - but only for the next {{hours}} hours.

**{{productName}}** includes:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

Your discounted price: {{discountedPrice}} credits

[Complete Your Order →]({{checkoutLink}})

Questions holding you back? Hit reply. I'll answer personally.

{{creatorName}}

P.S. - This discount is only for cart abandoners. Use it or lose it.`,
    tags: ["cart", "abandonment", "recovery", "discount"],
    useCase: "Recover abandoned purchases across all products",
    estimatedOpenRate: "36-44%",
    popular: true,
  },

  // ========================================================================
  // POST-PURCHASE (ALL PRODUCTS)
  // ========================================================================

  {
    id: "product-delivery-confirmation",
    name: "✅ Purchase Confirmation & Access",
    description: "Transactional: Deliver product and onboard customer",
    category: "transactional",
    funnelStage: "POST-PURCHASE",
    subject: "Your {{productName}} is ready! Here's how to access it",
    previewText: "Download links + getting started guide inside",
    body: `Hey {{firstName}},

Thanks for grabbing **{{productName}}**!

**Access Your Purchase:**
[Download {{productType}} →]({{downloadLink}})

**Getting Started:**
{{gettingStartedStep1}}
{{gettingStartedStep2}}
{{gettingStartedStep3}}

**Need Help?**
• Reply to this email
• Join our Discord: {{discordLink}}
• Check the docs: {{docsLink}}

**Your License:**
You have full commercial rights to use {{productName}} in your productions. Create whatever you want.

Questions? I'm here.

{{creatorName}}

P.S. - {{nextStepRecommendation}}`,
    tags: ["transactional", "delivery", "onboarding", "post-purchase"],
    useCase: "Deliver purchases, reduce support tickets, set up success",
    estimatedOpenRate: "70-80%",
    popular: false,
  },

  {
    id: "request-review-testimonial",
    name: "⭐ Request Review/Testimonial",
    description: "Ask happy customers for reviews and testimonials",
    category: "engagement",
    funnelStage: "POST-PURCHASE",
    subject: "Quick favor? (2 min)",
    previewText: "Share your experience with {{productName}}",
    body: `Hey {{firstName}},

You've had **{{productName}}** for {{daysSincePurchase}} days now.

**Quick question: How's it working for you?**

If you're happy with it, would you mind leaving a quick review? Takes 2 minutes and helps other producers decide.

[Leave a Review →]({{reviewLink}})

**As a thank you**, everyone who leaves a review gets:
{{reviewIncentive}}

And if something's NOT working, I want to know that too. Hit reply and tell me what's up.

Either way, thanks for the support.

{{creatorName}}

P.S. - Real reviews help me create better stuff. I read every single one.`,
    tags: ["review", "testimonial", "feedback", "social-proof"],
    useCase: "Collect social proof, testimonials, product feedback",
    estimatedOpenRate: "28-36%",
    popular: false,
  },

  // ========================================================================
  // PROMOTIONAL
  // ========================================================================

  {
    id: "credit-sale-flash",
    name: "💳 Credit Sale (Flash)",
    description: "Promote bonus credits or credit bundles",
    category: "promotion",
    funnelStage: "MOFU",
    subject: "⚡ {{bonusPercent}}% Bonus Credits ({{hoursLeft}} hours)",
    previewText: "Stock up on credits and save big",
    body: `{{firstName}},

Running a rare credit sale for the next {{hoursLeft}} hours.

**Buy {{creditAmount}} credits, get {{bonusAmount}} FREE**

That's {{bonusPercent}}% bonus credits on top of your purchase.

**What you can do with {{totalCredits}} credits:**
• Download {{examplePackCount}} sample packs
• Purchase {{exampleCourseCount}} courses  
• Book {{exampleCoachingCount}} coaching sessions
• Mix and match however you want

**Your Price:** \${{price}} for {{totalCredits}} credits
**Regular Price:** \${{regularPrice}}

[Get {{bonusPercent}}% Bonus Credits →]({{purchaseLink}})

**Sale ends:** {{endTime}}

Credits never expire. Stock up now while the bonus is active.

{{creatorName}}

P.S. - We only run this sale {{frequency}}. Next one won't be until {{nextSaleMonth}}.`,
    tags: ["credits", "sale", "promotion", "bonus"],
    useCase: "Drive credit purchases, increase platform revenue",
    estimatedOpenRate: "30-38%",
    popular: true,
  },

  {
    id: "bundle-deal-promotion",
    name: "📦 Product Bundle Promotion",
    description: "Promote bundle of sample packs or courses",
    category: "promotion",
    funnelStage: "MOFU",
    subject: "Bundle: {{bundleName}} (Save {{savingsPercent}}%)",
    previewText: "Get {{productCount}} products for the price of {{discountedCount}}",
    body: `{{firstName}},

Put together a bundle for producers serious about {{niche}}.

**{{bundleName}}**

Includes:
{{product1}} ({{product1Price}} credits)
{{product2}} ({{product2Price}} credits)  
{{product3}} ({{product3Price}} credits)

**Total Value:** {{totalValue}} credits
**Bundle Price:** {{bundlePrice}} credits

**You save {{savingsAmount}} credits ({{savingsPercent}}%)**

[Get The Bundle →]({{bundleLink}})

**Why bundle?**
{{bundleRationale}}

This is the complete {{niche}} toolkit. Everything you need in one purchase.

{{creatorName}}

P.S. - Bundle available until {{expirationDate}}. After that, back to individual pricing.`,
    tags: ["bundle", "promotion", "savings", "mofu"],
    useCase: "Increase average order value, move multiple products",
    estimatedOpenRate: "32-40%",
    popular: true,
  },

  // ========================================================================
  // DIRECT RESPONSE MARKETING
  // ========================================================================

  {
    id: "dr-sample-pack-scarcity",
    name: "⚡ Sample Pack - Scarcity DR",
    description: "Direct response: Limited quantity, FOMO-driven sample pack sale",
    category: "promotion",
    funnelStage: "BOFU",
    subject: "ONLY {{unitsLeft}} LEFT: {{packName}} selling out fast",
    previewText: "{{soldCount}} already sold - don't miss out",
    body: `{{firstName}} -

{{packName}} is almost gone.

**{{unitsLeft}} packs left** (started with {{totalUnits}})

{{soldCount}} producers grabbed theirs in the last {{timeframe}}.

Here's why:

**PROBLEM:** You're spending hours digging through trash sample packs trying to find ONE usable sound.

**REALITY:** Most sample packs are recycled garbage. Same sounds everyone else has.

**SOLUTION:** {{packName}}

• {{sampleCount}} 100% original samples
• Zero recycled sounds
• {{genre}} only - no filler
• Used in {{creditedTracks}} released tracks
• {{keyBenefit}}

**Price: {{creditPrice}} credits**

But here's the thing:

Once these {{unitsLeft}} packs are gone, I'm pulling it down. No restock. Done.

[Get It Before It's Gone →]({{packLink}})

**BONUSES** if you order in the next {{bonusDeadline}}:
✓ {{bonus1}}
✓ {{bonus2}}

This won't be here tomorrow.

{{creatorName}}

P.S. - Still thinking? {{testimonialName}} said: "{{testimonial}}" 

P.P.S. - Seriously, {{unitsLeft}} left. Check the page - there's a live counter.`,
    tags: ["direct-response", "scarcity", "sample-pack", "urgency"],
    useCase: "High-pressure sales, limited releases, maximize urgency",
    estimatedOpenRate: "38-48%",
    popular: true,
  },

  {
    id: "dr-course-pain-agitate",
    name: "🎯 Course - Problem/Agitate/Solution DR",
    description: "Direct response: Hit pain points, build urgency for course",
    category: "courses",
    funnelStage: "BOFU",
    subject: "Still struggling with {{painPoint}}? (Read this)",
    previewText: "The real reason your {{skillArea}} isn't improving",
    body: `{{firstName}},

Let me guess:

You've watched {{hoursWasted}} hours of YouTube tutorials.

You've tried {{thingsTried}}.

But you're STILL struggling with {{painPoint}}.

**Am I right?**

Here's why nothing's working:

{{reasonForFailure}}

I know because I was stuck in the exact same place for {{yearsStuck}} years.

**What changed?**

I figured out {{bigInsight}}.

Everything I learned is inside **{{courseName}}**.

**Here's What You Get:**
• {{module1}} - {{module1Benefit}}
• {{module2}} - {{module2Benefit}}
• {{module3}} - {{module3Benefit}}
• {{module4}} - {{module4Benefit}}

**Plus {{bonusCount}} bonuses:**
{{bonusList}}

**The Investment:** {{price}} credits

**The Alternative:** Keep struggling for another {{yearsProjection}} years.

Your call.

[Stop Struggling, Start Progressing →]({{enrollLink}})

**Enrollment closes:** {{deadline}}

After that, you're on your own.

{{creatorName}}

P.S. - 30-day guarantee. If it doesn't help, full refund. You risk nothing.

P.P.S. - {{currentStudents}} producers already enrolled. See what they're saying [here]({{testimonialsLink}}).`,
    tags: ["direct-response", "pain-agitate", "course", "conversion"],
    useCase: "Overcome objections, drive course enrollment, high-intent buyers",
    estimatedOpenRate: "35-45%",
    popular: true,
  },

  {
    id: "dr-coaching-transformation",
    name: "💎 Coaching - Before/After DR",
    description: "Direct response: Show dramatic transformations from coaching",
    category: "coaching",
    funnelStage: "BOFU",
    subject: "{{clientName}}'s track went from {{before}} to {{after}} ({{timeframe}})",
    previewText: "See the exact process + book your transformation",
    body: `{{firstName}},

{{timeframe}} ago, {{clientName}} sent me this:

[{{beforeAudio}}]({{beforeLink}})

Struggled with {{problem1}}, {{problem2}}, and {{problem3}}.

Today:

[{{afterAudio}}]({{afterLink}})

Just got {{achievement}}.

**What happened in between?**

{{sessionsCount}} coaching sessions.

**Here's what we fixed:**

Session 1: {{fix1}}
Session 2: {{fix2}}
Session 3: {{fix3}}

**The difference?**
Listen to the before/after. That's {{timeframe}} of focused work.

**Same process available for you:**

• {{sessionDuration}}-min sessions
• Review YOUR actual projects
• Fix YOUR specific problems
• Get YOUR tracks to the next level

**Investment:** {{packagePrice}} credits ({{sessionsIncluded}} sessions)

{{spotsLeft}} spots this month.

[Book Your Transformation →]({{bookingLink}})

**NOT CONVINCED?**

{{testimonial1Name}}: "{{testimonial1}}"
{{testimonial2Name}}: "{{testimonial2}}"

Results speak.

{{creatorName}}

P.S. - If you're not seeing improvement after session 1, full refund. I'm that confident.

P.P.S. - Spots fill in {{avgFillTime}}. If you see this, book now.`,
    tags: ["direct-response", "coaching", "transformation", "proof"],
    useCase: "Sell high-ticket coaching, show proof, overcome skepticism",
    estimatedOpenRate: "40-50%",
    popular: true,
  },

  {
    id: "dr-bundle-value-stack",
    name: "📦 Bundle - Value Stack DR",
    description: "Direct response: Stack value, show massive savings",
    category: "promotion",
    funnelStage: "BOFU",
    subject: "${{totalValue}} worth for {{bundlePrice}} credits? ({{hoursLeft}}h left)",
    previewText: "Everything you need in one bundle - save {{savingsPercent}}%",
    body: `{{firstName}},

Putting together everything you need to {{goal}}.

**THE {{bundleName}} BUNDLE**

Here's what's included:

**1. {{product1}}** ({{product1Price}} credits)
→ {{product1Benefit}}

**2. {{product2}}** ({{product2Price}} credits)  
→ {{product2Benefit}}

**3. {{product3}}** ({{product3Price}} credits)
→ {{product3Benefit}}

**4. {{product4}}** ({{product4Price}} credits)
→ {{product4Benefit}}

**TOTAL VALUE:** {{totalValue}} credits

**TODAY'S PRICE:** {{bundlePrice}} credits

**YOU SAVE:** {{savingsAmount}} credits ({{savingsPercent}}%)

**BONUSES** (if you order in next {{bonusDeadline}}):
✓ {{bonus1}} ({{bonus1Value}} value)
✓ {{bonus2}} ({{bonus2Value}} value)
✓ {{bonus3}} ({{bonus3Value}} value)

**TOTAL PACKAGE VALUE:** {{totalWithBonuses}} credits
**YOU PAY:** {{bundlePrice}} credits

**That's {{finalSavingsPercent}}% off.**

[Get The Complete Bundle →]({{bundleLink}})

**Bundle goes away in {{hoursLeft}} hours.**

After that:
- No more bundle
- Products sold separately
- You pay {{totalValue}} credits
- Bonuses disappear

**Why I'm doing this:**

{{bundleRationale}}

**GUARANTEE:**
30 days. If you don't use it, full refund.

{{creatorName}}

P.S. - {{alreadyBought}} producers grabbed this already. Don't be last.

P.P.S. - Can't afford {{bundlePrice}}? Start with {{product1}} [here]({{individualLink}}). But you'll end up buying the rest anyway (trust me).`,
    tags: ["direct-response", "bundle", "value-stack", "conversion"],
    useCase: "Maximize order value, create irresistible offers",
    estimatedOpenRate: "42-52%",
    popular: true,
  },

  {
    id: "dr-credit-sale-fomo",
    name: "💳 Credit Sale - FOMO DR",
    description: "Direct response: Credit sale with stacking bonuses and urgency",
    category: "promotion",
    funnelStage: "MOFU",
    subject: "{{bonusPercent}}% BONUS credits ends in {{hoursLeft}}h (rare sale)",
    previewText: "Stock up now - won't see this again for {{monthsUntilNext}} months",
    body: `{{firstName}} -

Credit sale. Rare.

**Buy {{baseCredits}} credits, get {{bonusCredits}} FREE**

That's {{totalCredits}} credits for \$\{\{price\}\}.

**We run this {{saleFrequency}}.**
Last one was {{monthsSinceLastSale}} months ago.
Next one won't be until {{nextSaleMonth}}.

**What you can do with {{totalCredits}} credits:**

Sample Packs:
• {{examplePacks}} packs ({{packsDescription}})

Courses:
• {{exampleCourses}} courses ({{coursesDescription}})

Coaching:
• {{exampleSessions}} coaching sessions

**Or mix and match.**

**BONUSES** (if you buy in next {{bonusHours}}h):
✓ {{bonus1}}
✓ {{bonus2}}

[Get {{bonusPercent}}% Bonus Credits →]({{purchaseLink}})

**Sale ends:** {{exactEndTime}}

**FAQ:**

Q: Do credits expire?
A: Never.

Q: Can I use them on anything?
A: Yes. Any product, any time.

Q: Is this the cheapest credits get?
A: Yes. Regular price is \\$\\{\\{regularPricePerCredit\\}\\}/credit.

**MATH:**
Regular: \\$\\{\\{regularTotal\\}\\} for {{totalCredits}} credits
Today: \\$\\{\\{price\\}\\} for {{totalCredits}} credits
**You save: \\$\\{\\{dollarSavings\\}\\}**

Stock up now or pay more later.

{{creatorName}}

P.S. - {{customersPurchased}} people bought already. Sale inventory: {{percentRemaining}}% left.`,
    tags: ["direct-response", "credits", "fomo", "urgency"],
    useCase: "Drive credit purchases, create buying events",
    estimatedOpenRate: "36-46%",
    popular: true,
  },

  // ========================================================================
  // ENGAGEMENT & COMMUNITY
  // ========================================================================

  {
    id: "community-invite",
    name: "👥 Discord Community Invite",
    description: "Invite customers/students to Discord community",
    category: "engagement",
    funnelStage: "POST-PURCHASE",
    subject: "You're invited: Join our producer community",
    previewText: "{{memberCount}} producers helping each other level up",
    body: `What's up {{firstName}},

Want to invite you to something special.

**{{communityName}} Discord Server**

This is where {{memberCount}} producers hang out, share tracks, give feedback, and level up together.

**What happens in there:**
• Daily production challenges
• Feedback threads (real producers, real feedback)
• Exclusive sample drops
• Live Q&A sessions with me
• Collab opportunities
• Studio tours and gear talk

**It's free for {{productType}} owners.**

[Join The Community →]({{discordLink}})

No self-promo BS. No spam. Just producers helping producers.

See you inside,
{{creatorName}}

P.S. - We just hit {{recentAchievement}} in the community. Come be part of it.`,
    tags: ["community", "discord", "engagement", "retention"],
    useCase: "Build community, increase retention, create network effects",
    estimatedOpenRate: "40-48%",
    popular: false,
  },

  {
    id: "user-generated-content",
    name: "🎤 Feature Your Track",
    description: "Request user-generated content from customers",
    category: "engagement",
    funnelStage: "POST-PURCHASE",
    subject: "I want to feature YOUR track",
    previewText: "Show off what you made with {{productName}}",
    body: `{{firstName}},

Running a showcase for producers who used **{{productName}}**.

**Here's the deal:**

Made something with {{productName}}? Send it to me.

I'll feature the best {{numberOfFeatures}} tracks:
• On my Instagram ({{followerCount}} followers)
• In next week's newsletter ({{subscriberCount}} producers)
• In the Discord community
• On the {{productName}} landing page

**What you get:**
• Exposure to {{totalReach}} producers
• Backlink to your socials
• Feature in my next YouTube video
• {{additionalPerk}}

[Submit Your Track →]({{submissionLink}})

Deadline: {{deadline}}

**What I'm looking for:**
{{criteria}}

Can't wait to hear what you made.

{{creatorName}}

P.S. - All genres welcome. Show me what you got.`,
    tags: ["ugc", "engagement", "showcase", "social-proof"],
    useCase: "Generate social proof, create content, build community",
    estimatedOpenRate: "32-40%",
    popular: false,
  },
];

// ============================================================================
// AUTOMATION TEMPLATES (FUNNEL-BASED)
// ============================================================================

const AUTOMATION_TEMPLATES = [
  // ========================================================================
  // SAMPLE PACK AUTOMATIONS
  // ========================================================================

  {
    id: "free-pack-to-paid-funnel",
    name: "🎁 Free Pack → Paid Pack (5 emails)",
    description: "Convert free sample pack downloaders into paying customers",
    category: "sample-packs",
    funnelStage: "FULL-FUNNEL",
    trigger: "lead_magnet_downloaded",
    emails: [
      {
        delay: 0,
        subject: "Your {{freePackName}} is ready! 🎁",
        purpose: "TOFU: Deliver + welcome + set expectations",
      },
      {
        delay: 1,
        subject: "3 ways to use {{freePackName}} in your beats",
        purpose: "MOFU: Education + demonstrate expertise",
      },
      {
        delay: 4,
        subject: "Here's what's NOT in the free pack...",
        purpose: "MOFU: Create desire for paid products",
      },
      {
        delay: 7,
        subject: "My full {{genre}} sample collection",
        purpose: "MOFU: Showcase catalog + build value",
      },
      {
        delay: 12,
        subject: "Exclusive: 25% off for {{freePackName}} users",
        purpose: "BOFU: Special offer + urgency",
      },
    ],
    tags: ["sample-pack", "full-funnel", "conversion"],
    popular: true,
    conversionRate: "22-30%",
  },

  {
    id: "sample-pack-buyer-ascension",
    name: "💎 Sample Pack Buyer → Premium Customer (4 emails)",
    description: "Post-purchase ascension sequence",
    category: "sample-packs",
    funnelStage: "POST-PURCHASE",
    trigger: "product_purchased",
    emails: [
      {
        delay: 0,
        subject: "Your {{packName}} samples are ready 🎵",
        purpose: "Delivery + onboarding + usage tips",
      },
      {
        delay: 3,
        subject: "Producer tip: How I use {{packName}} samples",
        purpose: "Value delivery + build expertise",
      },
      {
        delay: 7,
        subject: "Want to learn how I made {{packName}}?",
        purpose: "Course upsell introduction",
      },
      {
        delay: 14,
        subject: "Complete {{genre}} Producer Bundle ({{discount}}% off)",
        purpose: "Bundle upsell to maximize LTV",
      },
    ],
    tags: ["upsell", "sample-pack", "ascension"],
    popular: true,
    conversionRate: "18-25%",
  },

  // ========================================================================
  // COURSE AUTOMATIONS
  // ========================================================================

  {
    id: "course-student-completion-funnel",
    name: "🎓 Course Student Engagement (6 emails)",
    description: "Keep course students engaged and completing modules",
    category: "courses",
    funnelStage: "POST-PURCHASE",
    trigger: "course_enrolled",
    emails: [
      {
        delay: 0,
        subject: "Welcome to {{courseName}}! Start here 👋",
        purpose: "Onboarding + module 1 + quick win",
      },
      {
        delay: 3,
        subject: "Module 2 unlocked + your first assignment 📝",
        purpose: "Engagement + community invite",
      },
      {
        delay: 7,
        subject: "How's {{courseName}} going so far?",
        purpose: "Check-in + offer support + prevent dropout",
      },
      {
        delay: 14,
        subject: "You're halfway there! 🎯 (+ bonus content)",
        purpose: "Motivation + bonus + push to finish",
      },
      {
        delay: 21,
        subject: "Almost done with {{courseName}}!",
        purpose: "Final motivation + community showcase",
      },
      {
        delay: 30,
        subject: "Claim your {{courseName}} certificate 🏆",
        purpose: "Completion + testimonial request + next offer",
      },
    ],
    tags: ["course", "engagement", "completion", "retention"],
    popular: true,
    conversionRate: "N/A (completion-focused)",
  },

  {
    id: "course-graduate-coaching-funnel",
    name: "🚀 Course Graduate → Coaching (3 emails)",
    description: "Upsell coaching to students who completed your course",
    category: "courses",
    funnelStage: "POST-PURCHASE",
    trigger: "course_completed",
    emails: [
      {
        delay: 0,
        subject: "Congrats on finishing {{courseName}}! 🎉",
        purpose: "Celebrate + deliver certificate + next steps",
      },
      {
        delay: 3,
        subject: "What's next after {{courseName}}?",
        purpose: "Assess readiness + introduce coaching",
      },
      {
        delay: 7,
        subject: "Graduate rate: 1-on-1 coaching for {{courseName}} alumni",
        purpose: "Coaching offer with alumni discount",
      },
    ],
    tags: ["course", "coaching", "upsell", "graduate"],
    popular: false,
    conversionRate: "25-35%",
  },

  // ========================================================================
  // COACHING AUTOMATIONS
  // ========================================================================

  {
    id: "coaching-client-lifecycle",
    name: "🎯 Coaching Client Journey (5 emails)",
    description: "Complete coaching experience from prep to repeat booking",
    category: "coaching",
    funnelStage: "POST-PURCHASE",
    trigger: "coaching_booked",
    emails: [
      {
        delay: -2,
        subject: "Your coaching session prep ({{sessionDate}})",
        purpose: "Pre-session: Set expectations + preparation",
      },
      {
        delay: 0,
        subject: "Session recording + action plan 📋",
        purpose: "Post-session: Deliver recording + next steps",
      },
      {
        delay: 3,
        subject: "How's the track progressing?",
        purpose: "Follow-up + support + engagement",
      },
      {
        delay: 7,
        subject: "Before & after: Your progress",
        purpose: "Show transformation + motivate",
      },
      {
        delay: 14,
        subject: "Ready for session #2? (Client rate)",
        purpose: "Repeat booking offer + loyalty discount",
      },
    ],
    tags: ["coaching", "lifecycle", "retention", "repeat"],
    popular: true,
    conversionRate: "40-50%",
  },

  // ========================================================================
  // WELCOME & ONBOARDING
  // ========================================================================

  {
    id: "producer-welcome-full-funnel",
    name: "👋 Welcome Series → First Purchase (7 emails)",
    description: "Complete welcome sequence leading to first purchase",
    category: "onboarding",
    funnelStage: "FULL-FUNNEL",
    trigger: "new_subscriber",
    emails: [
      {
        delay: 0,
        subject: "Welcome! Your free {{freebie}} is ready 🎁",
        purpose: "TOFU: Deliver lead magnet + set expectations",
      },
      {
        delay: 2,
        subject: "Production tip: {{tipTitle}}",
        purpose: "TOFU: Value + expertise demonstration",
      },
      {
        delay: 5,
        subject: "My producer journey (how I went from {{before}} to {{after}})",
        purpose: "MOFU: Build connection + credibility",
      },
      {
        delay: 8,
        subject: "Quick question about your production",
        purpose: "MOFU: Segment + learn needs",
      },
      {
        delay: 12,
        subject: "Check out my {{productType}} collection",
        purpose: "MOFU: Introduce paid products",
      },
      {
        delay: 16,
        subject: "{{testimonialName}}'s results with {{productName}}",
        purpose: "MOFU: Social proof + build desire",
      },
      {
        delay: 21,
        subject: "New subscriber offer: {{discount}}% off anything",
        purpose: "BOFU: First purchase conversion",
      },
    ],
    tags: ["welcome", "full-funnel", "nurture", "conversion"],
    popular: true,
    conversionRate: "15-22%",
  },

  // ========================================================================
  // CART & SALES
  // ========================================================================

  {
    id: "cart-recovery-3-step",
    name: "🛒 Cart Recovery (3 emails)",
    description: "Recover abandoned purchases with strategic follow-up",
    category: "sales",
    funnelStage: "BOFU",
    trigger: "cart_abandoned",
    emails: [
      {
        delay: 1,
        subject: "Forgot something? {{productName}} is waiting",
        purpose: "Gentle reminder + benefits",
      },
      {
        delay: 24,
        subject: "Here's {{discount}}% off {{productName}} (24 hours)",
        purpose: "Discount incentive + urgency",
      },
      {
        delay: 72,
        subject: "Last call: {{productName}} discount expires tonight",
        purpose: "Final urgency + FOMO",
      },
    ],
    tags: ["cart", "recovery", "bofu", "conversion"],
    popular: true,
    conversionRate: "25-35%",
  },

  // ========================================================================
  // RE-ENGAGEMENT
  // ========================================================================

  {
    id: "inactive-customer-winback",
    name: "💔 Win Back Inactive Customers (4 emails)",
    description: "Re-engage customers who haven't purchased in 60+ days",
    category: "retention",
    funnelStage: "RE-ENGAGEMENT",
    trigger: "inactive_60_days",
    emails: [
      {
        delay: 0,
        subject: "{{firstName}}, you still producing?",
        purpose: "Personal check-in + nostalgia",
      },
      {
        delay: 3,
        subject: "What you missed: {{newReleasesCount}} new drops",
        purpose: "Show new value + FOMO",
      },
      {
        delay: 7,
        subject: "Come back gift: {{creditsAmount}} free credits",
        purpose: "Incentive + remove barrier",
      },
      {
        delay: 14,
        subject: "Before you go... (last email)",
        purpose: "Final offer or clean unsubscribe",
      },
    ],
    tags: ["re-engagement", "winback", "inactive", "retention"],
    popular: true,
    conversionRate: "12-20%",
  },

  // ========================================================================
  // RELEASE MARKETING FUNNEL (NEW)
  // ========================================================================

  // TOFU - Release Pre-Save
  {
    id: "release-presave-capture",
    name: "🎵 Pre-Save Capture Email",
    description: "Capture pre-saves and grow your fanbase before release",
    category: "releases",
    funnelStage: "TOFU",
    subject: "Pre-save {{trackTitle}} - drops {{releaseDate}}!",
    previewText: "Be the first to hear it when it drops",
    body: `What's up,

My new {{releaseType}} **{{trackTitle}}** drops on {{releaseDate}}.

**Pre-save it now** and it'll automatically appear in your library the moment it's live.

[Pre-Save on Spotify →]({{spotifyUrl}})
[Pre-Add on Apple Music →]({{appleMusicUrl}})

**Why pre-save?**
• It saves to your library automatically on release day
• You get notified the second it drops
• Early plays help the algorithm push it to more people

Only {{daysUntilRelease}} days to go. Lock it in now.

{{artistName}}

P.S. - Everyone who pre-saves gets {{bonusDescription}}.`,
    tags: ["release", "pre-save", "tofu", "capture"],
    useCase: "Build pre-save list, grow fanbase before release",
    estimatedOpenRate: "45-55%",
    popular: true,
  },

  // Pre-Save Confirmation
  {
    id: "release-presave-confirmation",
    name: "✅ Pre-Save Confirmation",
    description: "Thank fans for pre-saving and build excitement",
    category: "releases",
    funnelStage: "MOFU",
    subject: "You're locked in! {{trackTitle}} drops {{releaseDate}}",
    previewText: "Thanks for pre-saving - you'll be first to hear it",
    body: `{{firstName}},

You're locked in. **{{trackTitle}}** will be waiting in your library on {{releaseDate}}.

**What happens next:**
• {{daysUntilRelease}} days until release
• You'll get a notification the second it's live
• First listeners get early access to {{bonusDescription}}

**While you wait:**
{{preReleaseContent}}

Keep an ear out,
{{artistName}}

P.S. - Share this pre-save link with friends who'd vibe with it: {{preSaveLink}}`,
    tags: ["release", "confirmation", "pre-save", "mofu"],
    useCase: "Confirm pre-save, build anticipation, encourage sharing",
    estimatedOpenRate: "65-75%",
    popular: true,
  },

  // Release Day Announcement
  {
    id: "release-day-announcement",
    name: "🚀 Release Day Announcement",
    description: "Let fans know the music is live on all platforms",
    category: "releases",
    funnelStage: "BOFU",
    subject: "IT'S HERE: {{trackTitle}} is out now!",
    previewText: "Listen now on all platforms",
    body: `{{firstName}},

**{{trackTitle}} IS LIVE.**

The wait is over. Go stream it right now:

🟢 [Listen on Spotify →]({{spotifyUrl}})
🍎 [Listen on Apple Music →]({{appleMusicUrl}})
▶️ [Watch on YouTube →]({{youtubeUrl}})

**If you're feeling it:**
• Add it to your playlist
• Share it with a friend who'd vibe
• Drop a comment - I read every one

**Behind the track:**
{{trackStory}}

This one's for you.

{{artistName}}

P.S. - Reply and let me know what you think. I want to hear from you.`,
    tags: ["release", "announcement", "bofu", "launch"],
    useCase: "Maximize day-one streams and engagement",
    estimatedOpenRate: "50-60%",
    popular: true,
  },

  // 48-Hour Follow-Up
  {
    id: "release-48h-followup",
    name: "🔔 48-Hour Follow-Up",
    description: "Remind fans and ask for shares/playlist adds",
    category: "releases",
    funnelStage: "BOFU",
    subject: "{{firstName}}, did you catch {{trackTitle}}?",
    previewText: "Quick follow-up + how you can help",
    body: `Hey {{firstName}},

**{{trackTitle}}** has been out for 48 hours.

**The early reception:**
• {{streamCount}} streams and counting
• {{saveCount}} library saves
• Featured on {{playlistCount}} user playlists

**Did you get a chance to listen?**

If you're vibing with it, here's how you can help it grow:

1. **Add it to a playlist** - even a personal one helps the algorithm
2. **Share with one friend** who'd dig it
3. **Save it to your library** if you haven't yet

Every stream and save helps it reach more ears.

[Listen Again →]({{smartLink}})

Thank you for being part of this,
{{artistName}}

P.S. - Drop a comment on the video or reply to this email. I'm reading everything.`,
    tags: ["release", "followup", "engagement", "bofu"],
    useCase: "Boost streams, encourage playlist adds and shares",
    estimatedOpenRate: "40-50%",
    popular: true,
  },

  // Playlist Pitch Sequence
  {
    id: "release-playlist-pitch",
    name: "📝 Playlist Pitch Request",
    description: "Ask superfans to add the track to their playlists",
    category: "releases",
    funnelStage: "POST-PURCHASE",
    subject: "Can you add {{trackTitle}} to a playlist?",
    previewText: "Your support means more than you know",
    body: `{{firstName}},

Quick favor to ask.

**{{trackTitle}}** is doing well, but playlist placements are what really move the needle.

**Do you have a playlist it would fit?**

Here's why it matters:
• User playlists help the algorithm discover the track
• More playlist adds = more recommendations to new listeners
• Even a 10-follower playlist helps

**If you've got a playlist that fits:**
1. Open [{{trackTitle}} on Spotify]({{spotifyUrl}})
2. Click the "..." menu
3. Add to Playlist → pick one that fits

**No playlist? No worries.**
A simple save to your library helps too.

Your support means everything.

{{artistName}}

P.S. - Wanna see your playlist featured? Send it to me - I'm always looking for new playlists to follow.`,
    tags: ["release", "playlist", "pitch", "superfan"],
    useCase: "Increase playlist adds, leverage superfans",
    estimatedOpenRate: "35-45%",
    popular: true,
  },

  // 1-Week Milestone
  {
    id: "release-1week-milestone",
    name: "📊 1-Week Milestone Update",
    description: "Share results and thank fans for their support",
    category: "releases",
    funnelStage: "POST-PURCHASE",
    subject: "{{trackTitle}} - Week 1 Results Inside",
    previewText: "Here's how your support made a difference",
    body: `{{firstName}},

**{{trackTitle}}** just hit the 1-week mark.

**Here's where we're at:**
• {{totalStreams}} total streams
• {{uniqueListeners}} unique listeners
• {{playlistAdds}} playlist adds
• {{topCountry}} is the top streaming country

**Highlights:**
{{weekOneHighlights}}

**This is all because of you.**

Every stream, every share, every playlist add - it all adds up. Thank you for being part of this.

**What's next:**
{{upcomingContent}}

Stay tuned,
{{artistName}}

P.S. - More music is coming. Reply with what you want to hear next.`,
    tags: ["release", "milestone", "update", "gratitude"],
    useCase: "Share results, maintain engagement, tease upcoming content",
    estimatedOpenRate: "38-48%",
    popular: false,
  },
];

// ========================================================================
// RELEASE AUTOMATION TEMPLATES
// ========================================================================

const RELEASE_AUTOMATION_TEMPLATES = [
  {
    id: "release-presave-to-superfan",
    name: "🎵 Pre-Save → Release Day → Superfan (4 emails)",
    description: "Complete release marketing sequence from pre-save to post-release",
    category: "releases",
    funnelStage: "FULL-FUNNEL",
    trigger: "release_presave",
    emails: [
      {
        delay: 0,
        subject: "You're locked in! {{trackTitle}} drops {{releaseDate}}",
        purpose: "Confirm pre-save + build anticipation",
      },
      {
        delay: -1, // Release day (calculated from release date)
        subject: "IT'S HERE: {{trackTitle}} is out now!",
        purpose: "Announce release + drive streams",
      },
      {
        delay: 2, // 2 days after release
        subject: "Did you catch {{trackTitle}}?",
        purpose: "Follow-up + ask for shares/playlist adds",
      },
      {
        delay: 7, // 1 week after release
        subject: "Can you add {{trackTitle}} to a playlist?",
        purpose: "Playlist pitch to superfans",
      },
    ],
    tags: ["release", "presave", "full-funnel", "automation"],
    popular: true,
    conversionRate: "N/A (engagement-focused)",
  },
  {
    id: "release-day-engagement-boost",
    name: "🚀 Release Day Engagement Boost (3 emails)",
    description: "Maximize engagement in the first 48 hours after release",
    category: "releases",
    funnelStage: "BOFU",
    trigger: "release_published",
    emails: [
      {
        delay: 0,
        subject: "{{trackTitle}} just dropped - listen first!",
        purpose: "Immediate notification for non-presavers",
      },
      {
        delay: 8, // 8 hours after release
        subject: "Early reactions to {{trackTitle}} are 🔥",
        purpose: "Social proof + FOMO",
      },
      {
        delay: 48,
        subject: "48 hours in: {{trackTitle}} update",
        purpose: "Share milestones + ask for engagement",
      },
    ],
    tags: ["release", "engagement", "day-one", "bofu"],
    popular: true,
    conversionRate: "N/A (stream-focused)",
  },
  {
    id: "release-playlist-campaign",
    name: "📝 Playlist Add Campaign (2 emails)",
    description: "Get fans to add your track to their playlists",
    category: "releases",
    funnelStage: "POST-PURCHASE",
    trigger: "track_streamed",
    emails: [
      {
        delay: 3,
        subject: "Thanks for streaming {{trackTitle}}!",
        purpose: "Thank listener + introduce playlist ask",
      },
      {
        delay: 7,
        subject: "Quick favor: Add {{trackTitle}} to a playlist?",
        purpose: "Direct playlist pitch",
      },
    ],
    tags: ["release", "playlist", "campaign", "post-purchase"],
    popular: false,
    conversionRate: "15-25%",
  },
];

// Merge release automation templates with main automation templates
const ALL_AUTOMATION_TEMPLATES = [...AUTOMATION_TEMPLATES, ...RELEASE_AUTOMATION_TEMPLATES];

// ============================================================================
// QUERIES
// ============================================================================

export const getCampaignTemplates = query({
  args: {
    category: v.optional(v.string()),
    funnelStage: v.optional(v.union(
      v.literal("TOFU"),
      v.literal("MOFU"),
      v.literal("BOFU"),
      v.literal("POST-PURCHASE"),
      v.literal("RE-ENGAGEMENT"),
      v.literal("NURTURE")
    )),
  },
  returns: v.array(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    funnelStage: v.optional(v.string()),
    subject: v.string(),
    previewText: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
    useCase: v.string(),
    estimatedOpenRate: v.string(),
    popular: v.boolean(),
  })),
  handler: async (ctx, args) => {
    let templates = CAMPAIGN_TEMPLATES;
    
    if (args.category) {
      templates = templates.filter(t => t.category === args.category);
    }

    if (args.funnelStage) {
      templates = templates.filter(t => t.funnelStage === args.funnelStage);
    }
    
    return templates as any;
  },
});

export const getCampaignTemplateById = query({
  args: { templateId: v.string() },
  returns: v.union(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    funnelStage: v.optional(v.string()),
    subject: v.string(),
    previewText: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
    useCase: v.string(),
    estimatedOpenRate: v.string(),
    popular: v.boolean(),
  }), v.null()),
  handler: async (ctx, args) => {
    const template = CAMPAIGN_TEMPLATES.find(t => t.id === args.templateId);
    return template as any || null;
  },
});

export const getAutomationTemplates = query({
  args: {
    category: v.optional(v.string()),
    funnelStage: v.optional(v.union(
      v.literal("TOFU"),
      v.literal("MOFU"),
      v.literal("BOFU"),
      v.literal("FULL-FUNNEL"),
      v.literal("POST-PURCHASE"),
      v.literal("RE-ENGAGEMENT")
    )),
  },
  returns: v.array(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    funnelStage: v.optional(v.string()),
    trigger: v.string(),
    emails: v.array(v.object({
      delay: v.number(),
      subject: v.string(),
      purpose: v.string(),
    })),
    tags: v.array(v.string()),
    popular: v.boolean(),
    conversionRate: v.string(),
  })),
  handler: async (ctx, args) => {
    let templates = ALL_AUTOMATION_TEMPLATES;

    if (args.category) {
      templates = templates.filter(t => t.category === args.category);
    }

    if (args.funnelStage) {
      templates = templates.filter(t => t.funnelStage === args.funnelStage);
    }

    return templates as any;
  },
});

export const getAutomationTemplateById = query({
  args: { templateId: v.string() },
  returns: v.union(v.object({
    id: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    funnelStage: v.optional(v.string()),
    trigger: v.string(),
    emails: v.array(v.object({
      delay: v.number(),
      subject: v.string(),
      purpose: v.string(),
    })),
    tags: v.array(v.string()),
    popular: v.boolean(),
    conversionRate: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    const template = ALL_AUTOMATION_TEMPLATES.find(t => t.id === args.templateId);
    return template as any || null;
  },
});

export const getTemplateCategories = query({
  args: { type: v.union(v.literal("campaign"), v.literal("automation")) },
  returns: v.array(v.object({
    value: v.string(),
    label: v.string(),
    count: v.number(),
  })),
  handler: async (ctx, args) => {
    if (args.type === "campaign") {
      const categories = new Map<string, number>();
      CAMPAIGN_TEMPLATES.forEach(t => {
        categories.set(t.category, (categories.get(t.category) || 0) + 1);
      });

      return Array.from(categories.entries()).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " "),
        count,
      }));
    } else {
      const categories = new Map<string, number>();
      ALL_AUTOMATION_TEMPLATES.forEach(t => {
        categories.set(t.category, (categories.get(t.category) || 0) + 1);
      });

      return Array.from(categories.entries()).map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " "),
        count,
      }));
    }
  },
});

export const getFunnelStages = query({
  args: { type: v.union(v.literal("campaign"), v.literal("automation")) },
  returns: v.array(v.object({
    value: v.string(),
    label: v.string(),
    count: v.number(),
    description: v.string(),
  })),
  handler: async (ctx, args) => {
    const stages = [
      {
        value: "TOFU",
        label: "Attract New Audience",
        description: "Free offers to grow your email list",
      },
      {
        value: "MOFU",
        label: "Build Interest",
        description: "Educate and showcase your products",
      },
      {
        value: "BOFU",
        label: "Drive Sales",
        description: "Convert interested leads to customers",
      },
      {
        value: "POST-PURCHASE",
        label: "After Purchase",
        description: "Onboard customers and increase lifetime value",
      },
      {
        value: "RE-ENGAGEMENT",
        label: "Win Back Inactive",
        description: "Re-engage people who went quiet",
      },
      {
        value: "FULL-FUNNEL",
        label: "Complete Journey",
        description: "Free offer to first purchase",
      },
      {
        value: "NURTURE",
        label: "Stay Connected",
        description: "Regular content and updates",
      },
    ];

    const templates = args.type === "campaign" ? CAMPAIGN_TEMPLATES : AUTOMATION_TEMPLATES;
    
    return stages.map(stage => ({
      ...stage,
      count: templates.filter((t: any) => t.funnelStage === stage.value).length,
    })).filter(s => s.count > 0);
  },
});
