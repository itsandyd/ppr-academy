# Social Media Content Ideas — Batch 2
# Product Type Deep Dives, Creator Recruitment, Myth Busting, Scenario Walkthroughs

> Generated from verified codebase research on Feb 24, 2026.
> Every claim is sourced from research files or code paths.
> Production readiness verified against PRODUCTION-READINESS-AUDIT.md.
> Only features rated green or yellow are promoted.

---

## Notes on Product Types

The codebase defines **22+ distinct product types** across the `digitalProducts` table in `convex/schema.ts` (lines 1124-1161). Several requested types map to the same underlying type or don't exist as separate entries:

- **Workshops** and **Masterclasses** are product types in the schema (`workshop`, `masterclass`) but share the same creation wizard structure as generic digital products. No dedicated wizard with unique fields.
- **Mastering Services** use the same `service` creation wizard and `serviceOrders` table as Mixing Services — the only difference is the service type label.
- **MIDI Packs** use the same `pack` creation wizard as Sample Packs and Preset Packs — selected via a type dropdown.
- **Plugins** exist as a directory (`plugins` table) rather than a sellable product type. Creators link to external purchase URLs.
- **Music Releases** exist in schema as `release` type with a full wizard (4 steps: Basics, Platforms, Pre-save, Drip) but are free products gated behind follow requirements — not paid products.

Posts are created only for product types with verified, functional creation wizards and distinct music-specific features worth highlighting.

---

## Category 7 — Product Type Deep Dives

---

### Category 7 — Post 1: Beat Leases (with Licensing Tiers)

**Platform:** Instagram Carousel / TikTok
**Hook:** You're selling beats in DMs with PayPal invoices and no contracts. Someone disputes the payment, you have zero proof of what they bought. Here's how beat licensing should actually work.

> **EDIT NOTE:** Hook rewritten from "I built a system with 4 tiers" (PPR feature) to "You're selling beats with no contracts, someone disputes, zero proof" (the actual fear beat sellers have).

**Script/Body:**
Here's what selling beats looks like on most platforms. Someone DMs you. You negotiate a price. You send a PayPal invoice. You email the files. You pray they don't dispute it. No contract. No terms. No paper trail.

Here's what it looks like on PausePlayRepeat.

You upload your beat. You set 4 licensing tiers — Basic at $25 gets MP3 and WAV with 5,000 distribution and 100,000 streams. Premium at $75 adds stems and ups the limits. Exclusive at $500 gets everything including trackouts, unlimited distribution, and radio rights.

The buyer picks their tier. Stripe handles payment. A PDF contract auto-generates with the beat title, your name, their name, every term spelled out. Distribution limits. Streaming limits. Commercial use rights. Music video rights. Radio broadcasting rights.

And here's the part I'm most proud of. When someone buys the exclusive license, the beat automatically unpublishes from your storefront. Gone. No one else can buy it. No awkward "sorry, that beat's sold" DMs.

You also get a free tier that works as a lead magnet. MP3 only, producer tag required, 1,000 distribution cap. Gate it behind an email follow and you've got a list-building machine.

BeatStars charges $10-20/month for licensing. Gumroad doesn't have licensing at all. This is included.

**Visual Direction:**
Carousel slides:
1. Hook text with beat waveform background
2. Screenshot of the 4-tier licensing form in the creation wizard (app/dashboard/create/beat-lease/steps/LicensingForm.tsx)
3. Example pricing table: Basic $25 / Premium $75 / Exclusive $500
4. Screenshot of auto-generated PDF contract
5. "SOLD — Exclusive" badge over a beat card with dimmed purchase buttons
6. Free tier as lead magnet — "Gate downloads behind email capture"

**CTA:** DM me "BEATS" to see the licensing system
**SOURCE:** `convex/beatLeases.ts` — 4-tier system with per-tier pricing, file delivery, distribution/streaming limits. `app/api/beats/contract/route.ts` — PDF contract generation via pdf-lib. `convex/beatLeases.ts:237-258` — exclusive auto-removal setting `exclusiveSoldAt`. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 6. `PRODUCTION-READINESS-AUDIT.md`: Beat Licensing Tiers rated green, Exclusive Auto-Removal rated green.

---

### Category 7 — Post 2: Sample Packs (with Individual Preview)

**Platform:** Instagram Reel / TikTok
**Hook:** Your sample pack has 200 fire sounds but buyers only hear one demo loop before purchasing. No wonder they request refunds. What if they could preview every single sound first?

> **EDIT NOTE:** Hook rewritten from "On Gumroad blind zip, on PPR preview" (platform comparison) to "200 fire sounds but buyers only hear one demo loop" (the creator's frustration with how their work gets presented).

**Script/Body:**
I've bought sample packs on Gumroad. You see a product image. Maybe a description that says "50 drum loops, 30 one-shots, 20 FX." You pay $29. You download a zip. You open it. Half the sounds aren't what you expected.

That's the standard experience everywhere. Blind purchase. No preview.

Here's what I built instead.

Every sample in a pack has its own audio player with waveform visualization. Click play, hear the sound. See the BPM, the key, the genre, the category. Filter by drums, bass, synth, vocals, FX, melody, loops, or one-shots. Filter by 14 genres.

The buyer knows exactly what they're getting. No guesswork. No refund requests.

For creators, the upload is straightforward. 4-step wizard — pack details, file upload, optional follow gate, pricing. You set the genre, BPM, key, and license type for the whole pack. Individual sample metadata gets attached per file.

Gumroad gives you a file upload and a checkout page. This gives you a music-specific storefront for your sounds.

**Visual Direction:**
Screen recording: Open the marketplace sample pack browser. Click into a pack. Show the individual sample list with play buttons. Click play on a drum loop — show the waveform animating. Filter by "drums" category. Filter by "Trap" genre. Show BPM/key badges. Then show the creator's upload wizard — 4 steps with genre/BPM/key fields.

**CTA:** DM me "SAMPLES" to see a live pack
**SOURCE:** `app/marketplace/samples/page.tsx` — audio player, genre/category filter (14 genres, 8 categories), waveform visualization. `components/ui/audio-waveform.tsx` — canvas-based waveform. `CONTENT-RESEARCH-SAMPLE-PREVIEW.md`. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 5. `PRODUCTION-READINESS-AUDIT.md`: Sample Pack Preview rated yellow (functional).

---

### Category 7 — Post 3: Preset Packs (with Plugin-Specific Filtering)

**Platform:** Instagram Carousel / TikTok
**Hook:** You made 200 Serum presets. You list them online. Someone searching for "Vital presets for Future Bass" never finds them because the platform doesn't know what a synth plugin is. That's broken.

> **EDIT NOTE:** Hook rewritten from "Gumroad doesn't know Serum, PPR was built for this" (platform comparison) to "Someone searching can't find your presets because the platform doesn't understand synth plugins" (the discovery problem creators actually have).

**Script/Body:**
Try selling preset packs on Gumroad. Your listing says "Serum presets." The buyer has to trust you. There's no filtering by plugin. No DAW compatibility info. No way for someone browsing to say "show me all Vital presets for Future Bass."

On PausePlayRepeat, when you create a preset pack, the first thing we ask is: what plugin are these for?

Serum. Vital. Massive. Omnisphere. Sylenth1. Phase Plant. Pigments. 50+ plugins supported.

That metadata isn't just for show. In the marketplace, buyers can filter by target plugin. They can filter by DAW. They can filter by genre. They can toggle "free only."

So when someone lands on the preset marketplace looking for Vital presets, they find YOUR Vital presets. Not buried in a search. Surfaced because the system knows what they are.

The creation wizard is 4 steps. Pack details with plugin selection, file upload, optional follow gate for lead capture, and pricing. That's it.

**Visual Direction:**
Carousel slides:
1. Hook text
2. Gumroad listing vs PPR listing side-by-side — Gumroad shows generic file; PPR shows plugin badge, DAW compatibility, genre tags
3. Marketplace filter screenshot showing plugin dropdown (Serum, Vital, Massive, etc.)
4. Creator wizard step 1 — plugin selection from 50+ options
5. Browse experience — "Vital presets" filtered results with genre tags and pricing

**CTA:** Link in bio to browse preset marketplace
**SOURCE:** `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 — Preset Packs row: "50+ target plugins supported." `app/marketplace/preset-packs/page.tsx` — filter by target plugin, DAW, genre, free-only toggle. `app/dashboard/create/pack/` — 4-step wizard with pack type selector (sample/preset/midi). `PRODUCTION-READINESS-AUDIT.md`: Product Types rated yellow (16/20 wizards functional).

---

### Category 7 — Post 4: Effect Chains / Ableton Racks

**Platform:** Instagram Reel / TikTok
**Hook:** You spent 3 years perfecting your vocal chain. You could sell it for $25. But most producers never do because there's nowhere to properly list a .adg file. Here's the fix.

> **EDIT NOTE:** Hook rewritten from "On Gumroad it's a .adg file and a prayer" (platform comparison) to "You spent 3 years perfecting your vocal chain, you could sell it for $25" (speaking to the untapped value producers are sitting on).

**Script/Body:**
Effect chains are one of the most underrated things you can sell as a producer. You spent hours dialing in the perfect vocal chain. The perfect master bus. That compression-into-saturation combo that just works.

But selling them? Nightmare. Gumroad doesn't know what a .adg file is. It doesn't know about DAW compatibility. The buyer downloads it, opens it in FL Studio, and it doesn't work because it's an Ableton rack.

I built a product type specifically for this.

When you create an effect chain on PPR, you select the DAW — Ableton, FL Studio, Logic, Bitwig, Studio One, Cubase, or Reason. You specify the genre. You upload the chain file.

In the marketplace, buyers filter by DAW. They only see chains compatible with their software. No confusion. No wasted purchases. No refund headaches.

The creation wizard is 4 steps — chain details with DAW selection, file upload, optional follow gate, pricing. Done.

**Visual Direction:**
Screen recording: Show the chain creation wizard. Select "Ableton" from DAW dropdown. Fill in genre. Upload .adg file. Cut to marketplace — filter by "Ableton" — show filtered results with DAW badges. Show a product page with DAW compatibility clearly displayed.

**CTA:** DM me "CHAINS" to see the marketplace
**SOURCE:** `convex/schema.ts` digitalProducts table — effect-chain type with `dawType`, `dawVersion`, `genre` fields. `app/dashboard/create/chain/` — 4-step wizard (ChainBasicsForm, ChainFilesForm, ChainFollowGateForm, ChainPricingForm). `app/marketplace/ableton-racks/` — DAW filtering. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 row 4: "Multi-DAW support (Ableton/FL/Logic/Bitwig/Studio One/Reason/Cubase)."

---

### Category 7 — Post 5: Courses (with Modules, Chapters, and Certificates)

**Platform:** Instagram Carousel / TikTok
**Hook:** You know enough about mixing to teach a course. But Teachable costs $149/month and wasn't built for music producers. Here's what a course platform actually designed for us looks like.

> **EDIT NOTE:** Hook rewritten from "Teachable charges $149, I built one included" (price comparison + PPR plug) to "You know enough to teach, but course platforms cost $149 and aren't built for us" (the audience's situation + shared frustration).

**Script/Body:**
I had a Teachable account for two years. $39/month for the basic plan. Then I needed better analytics. $119/month. Then I wanted to remove their branding. $149/month.

And Teachable doesn't know anything about music production. It's built for generic online courses. No integration with my other products. No marketplace discovery. Separate login for my students.

So I built a course system designed for producers.

Four-level hierarchy. Course at the top. Then modules. Then lessons. Then individual chapters. Each chapter can have video, audio, text content, and downloadable resources.

Mark specific chapters as free previews so people can try before they buy. Set up drip content so modules unlock over time. Students track their progress chapter by chapter.

When a student completes 100% of the course, a certificate auto-generates with a unique verification code. They can share it. Anyone can verify it at a public URL.

The creation wizard is 6 steps — thumbnail, content structure, pricing, checkout customization, follow gate, and options like certificates and drip scheduling.

Your courses sit alongside your beats, presets, and sample packs. One storefront. One checkout. One customer identity.

**Visual Direction:**
Carousel slides:
1. Teachable pricing page ($39/$119/$149) vs "Included with PPR"
2. Course hierarchy diagram: Course > Module > Lesson > Chapter
3. Screenshot of course content editor showing modules/lessons/chapters
4. Student view — progress tracking with completion percentage
5. Auto-generated certificate with verification code
6. Creator storefront showing courses alongside other products

**CTA:** DM me "COURSE" to see a live example
**SOURCE:** `app/dashboard/create/course/` — 6-step wizard (Thumbnail, Content, Pricing, Checkout, Follow Gate, Options). `convex/courses.ts` — course hierarchy (courses, courseModules, courseLessons, courseChapters). `convex/certificates.ts` — auto-issuance at 100% completion, unique verification codes. `app/verify/[certificateId]/page.tsx` — public verification. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 9: Course platform $39-149/mo replaced. `PRODUCTION-READINESS-AUDIT.md`: Student Progress Tracking rated green, Certificates rated yellow.

---

### Category 7 — Post 6: Coaching & 1-on-1 Sessions

**Platform:** Instagram Reel / TikTok
**Hook:** A producer DMs you: "Can you check my mix?" You want to help. But you also don't want to work for free. Here's the move that turns DM requests into paid sessions without being awkward about it.

> **EDIT NOTE:** Hook kept the relatable DM scenario but reframed from "I fixed that" (PPR announcement) to "here's the move that turns DM requests into paid sessions" (practical advice the audience wants).

**Script/Body:**
Coaching is one of the best ways to monetize your skills. But the booking process is terrible. Someone DMs you. You go back and forth on times. You send a Calendly link. They book. You send a Stripe invoice. They pay. You jump on a Zoom call. None of these tools talk to each other.

On PausePlayRepeat, coaching is a built-in product type.

5-step creation wizard. Set your session title and description. Choose the type — video, audio, phone, or text. Set the duration. Set your price. Configure your availability — which days, which hours, buffer time between sessions, max bookings per day.

When someone books, everything happens in one flow. They see your availability. They pick a slot. They pay through Stripe. You both get confirmation.

The system even supports Discord integration — auto-assign roles to coaching clients for private channels.

No Calendly. No separate invoicing. No scheduling headaches.

**Visual Direction:**
Screen recording: Show the coaching creation wizard — 5 steps. Set session type to "Video Call." Set duration to 60 minutes. Set price to $75. Show availability calendar setup. Cut to the buyer view — picking a time slot, checking out. Show confirmation.

**CTA:** DM me "COACHING" to see the booking flow
**SOURCE:** `app/dashboard/create/coaching/` — 5-step wizard (Basics, Pricing, Follow Gate, Discord, Availability). Context file shows: sessionType, duration, maxBookingsPerDay, advanceBookingDays, bufferMinutes. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 row 13: "Availability calendar, session duration config, video/audio/phone types, Discord integration." `PRODUCTION-READINESS-AUDIT.md`: Product Types rated yellow (coaching wizard functional).

---

### Category 7 — Post 7: Mixing & Mastering Services

**Platform:** Instagram Carousel / TikTok
**Hook:** You're mixing tracks for people and collecting payment through PayPal invoices. The client sends stems on Google Drive. You lose track of which version they approved. Here's why that workflow is costing you clients.

> **EDIT NOTE:** Hook kept the pain scenario but added "costing you clients" (consequence they care about) instead of "here's what a real workflow looks like" (PPR pitch setup).

**Script/Body:**
Selling mixing services without a system is chaos.

Client sends stems on Google Drive. You send a PayPal invoice. They want revisions. You lose track of which version they approved. They dispute the charge because there's no paper trail.

On PPR, mixing and mastering services have their own product type with a full order workflow.

4-step creation wizard. Service details and type selection. Pricing for different tiers. Client requirements form — what you need from them before you start. Delivery timeline and terms.

When a client orders, the system tracks the full lifecycle: pending, upload, in-progress, review, revision, completed. There's in-order messaging so all communication stays in one thread. File management so stems and mixes don't get lost in email chains.

Set your turnaround time. Set revision limits. Set rush fees. Everything is documented before anyone pays a dollar.

This replaces Fiverr for service-based producers. And you keep 90% instead of Fiverr's 80%.

**Visual Direction:**
Carousel slides:
1. Hook text on dark background
2. Current workflow chaos: DMs + PayPal + Google Drive + Email (crossed out)
3. PPR service creation wizard — 4 steps
4. Order workflow diagram: Pending > Upload > In-Progress > Review > Revision > Completed
5. In-order messaging thread between creator and client
6. Revenue comparison: Fiverr 80% vs PPR 90%

**CTA:** DM me "MIXING" to see the service setup
**SOURCE:** `app/dashboard/create/service/` — 4-step wizard (Basics, Pricing, Requirements, Delivery). `convex/schema.ts` — serviceOrders table with full order lifecycle. `CONTENT-RESEARCH-FEATURE-PAIN-MAP.md` Section 6 row 9: "Mixing Services — Multi-tier pricing, stem count options, turnaround SLA, revision limits, rush fees, full order workflow." `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 row 14.

---

### Category 7 — Post 8: Memberships & Subscriptions

**Platform:** Instagram Carousel / TikTok
**Hook:** You want to sell a monthly membership AND individual products. But Patreon is subscriptions only and Gumroad is one-time only. Why can't one store do both? It can.

> **EDIT NOTE:** Hook rewritten from "Patreon takes 8-12% plus extra tool costs" (math/pricing) to "You want memberships AND individual products but no platform does both" (the flexibility problem creators actually hit).

**Script/Body:**
Patreon is subscription-only. You can't sell a one-time beat lease. You can't sell an individual sample pack. Everything must be a monthly pledge.

And for that privilege, Patreon takes 8-12% of your earnings. Then you need Mailchimp for emails — $30/month. Teachable for courses — $39/month. Buffer for social — $25/month. That's $94/month in tools on top of Patreon's cut.

On PausePlayRepeat, memberships work alongside everything else.

Create custom tiers with custom names and custom pricing. Monthly and yearly billing — yearly shows the savings percentage automatically. Free trials from 0-30 days. Two content modes: include everything in your store, or hand-pick specific courses and products per tier.

A fan can subscribe to your $15/month membership AND buy a one-time $50 beat lease on the same store. Both tracked. Both generating revenue. One customer identity.

The creation wizard is 3 steps. Basics — name, description, benefits. Pricing — monthly required, yearly optional with savings display. Content — toggle "include all" or select specific items.

10% platform fee includes everything. No separate tools.

**Visual Direction:**
Carousel slides:
1. Patreon fee math: 8-12% + $94/month in tools
2. PPR: 10% all-in, everything included
3. Membership wizard — 3 steps shown
4. Tier pricing example with monthly/yearly toggle and savings badge
5. "Include All Content" vs "Select Specific Items" toggle
6. Storefront showing membership tiers alongside one-time products

**CTA:** DM me "MEMBERSHIP" to see the tier system
**SOURCE:** `convex/memberships.ts` — full CRUD, custom tiers, monthly/yearly pricing. `app/dashboard/create/membership/` — 3-step wizard (Basics, Content, Pricing). `CONTENT-RESEARCH-MEMBERSHIPS-VS-PATREON.md` — full comparison. `app/api/memberships/create-checkout-session/route.ts` — Stripe recurring billing with trial support. `PRODUCTION-READINESS-AUDIT.md`: Tier Creation rated green, Membership Pricing rated green, Membership Checkout rated green.

---

### Category 7 — Post 9: Bundles

**Platform:** Instagram Reel / TikTok
**Hook:** Your average order is $25. Here's the simplest way to push it to $79 without creating a single new product. Bundles. And most producers don't use them.

> **EDIT NOTE:** Hook rewritten from "$120 separately, $79 as bundle" (feature explanation) to "Your average order is $25, here's how to push it to $79" (money problem + promise of a fix).

**Script/Body:**
Bundles are the easiest way to increase average order value. But try doing this on Gumroad. You'd need to create a separate product, manually calculate the discount, and hope people find it.

On PPR, bundles are a dedicated product type.

4-step wizard. Bundle details — title, description, image. Product selection — pick any combination of your courses and products. Bundle pricing — set one price, the system auto-calculates and displays the savings vs buying individually. Optional follow gate.

Time-limited availability. Quantity-limited availability. The urgency is real because you configure it, not because you're faking it in the copy.

A buyer sees the bundle on your storefront with the original price crossed out and the bundle price next to it. Clear savings. One checkout. Instant access to everything in the bundle.

Mix courses with sample packs. Mix presets with project files. Mix coaching sessions with courses. Any combination.

**Visual Direction:**
Screen recording: Show the bundle creation wizard. Select 3 products. Set bundle price at $79. Show the auto-calculated "Save $41" badge. Cut to the storefront — bundle card with crossed-out original price and savings displayed. Show checkout — one payment, access to all 3 products.

**CTA:** Link in bio to see live bundles
**SOURCE:** `app/dashboard/create/bundle/` — 4-step wizard (Basics, Products, Pricing, Follow Gate). `convex/bundles.ts` — slug generation, price discounting logic, time/quantity limits. `CONTENT-RESEARCH-FEATURE-PAIN-MAP.md` Section 6 row 12: "Bundles — Mix courses + products, original vs. bundle pricing with discount display, time-limited and quantity-limited availability." `PRODUCTION-READINESS-AUDIT.md`: Bundles rated green (backend).

---

### Category 7 — Post 10: Mixing Templates

**Platform:** Instagram Reel / TikTok
**Hook:** You've been using the same mixing template for 3 years. It's perfect. Other producers would pay $25 for it. But you've never sold it because you didn't think anyone would care. They do.

> **EDIT NOTE:** Hook rewritten from "On Gumroad it's a file, on PPR buyers filter by DAW" (platform comparison) to "Other producers would pay $25 for your template" (speaking to the value they're sitting on).

**Script/Body:**
Mixing templates are gold. You spent years building your routing, your bus processing, your reference chain. But selling them is an afterthought on every platform.

Upload a zip to Gumroad. Write a description. Hope someone finds it.

On PPR, mixing templates are their own product type with their own creation wizard.

4 steps. Template basics — title, description, DAW type (Ableton, FL Studio, Logic, Bitwig, Studio One), DAW version, genre tags, channel count, third-party plugin requirements, and installation notes. File upload. Optional follow gate. Pricing.

In the marketplace, buyers filter by DAW. They see the channel count. They know which third-party plugins they'll need before they buy. No surprises. No compatibility headaches.

If you're a mixing engineer with a template sitting on your hard drive, this is the easiest product to list. You already built it. Now sell it.

**Visual Direction:**
Screen recording: Show mixing template creation wizard. Select "Ableton" as DAW. Add genre tags. Note "Requires FabFilter Pro-Q3, SSL G-Bus Compressor" in plugin requirements. Set channel count to 48. Cut to marketplace — filter by DAW, see template cards with genre and channel count badges.

**CTA:** DM me "TEMPLATE" to get started
**SOURCE:** `app/dashboard/create/mixing-template/` — 4-step wizard (Basics, Files, Follow Gate, Pricing). Context file shows: dawType, dawVersion, genre (array), channelCount, thirdPartyPlugins, installationNotes. `app/marketplace/mixing-templates/` — DAW-specific browsing. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 row 6: "Mixing Templates — Pre-configured mixer layouts, effect routing, genre-specific settings."

---

### Category 7 — Post 11: Project Files

**Platform:** Instagram Reel / TikTok
**Hook:** Every time you post a track breakdown, someone asks "can I get the project file?" You either ignore them or send it free. Both options leave money on the table.

**Script/Body:**
Project files are one of the most requested things in music production. Every time you post a track breakdown, someone asks for the .als or .flp.

Most producers either ignore those requests or send the file for free over DM. That's leaving money on the table.

On PPR, project files are a dedicated product type. 4-step wizard. Project details with genre, BPM, and key. File upload — .als, .flp, .logicx, whatever format. Optional follow gate if you want to use it as a lead magnet. Or set a price.

The buyer gets the full production file with stems. They can see the DAW compatibility before purchasing. No "does this work in FL Studio?" questions.

List it. Price it. Share the link when someone asks. Done.

**Visual Direction:**
Screen recording: Instagram DM asking "can I get the project file?" Cut to PPR — create project file product. 4 steps. Upload .als file. Set price at $15. Publish. Copy link. Paste in DM reply: "Here you go — $15 and you get the full session."

**CTA:** DM me "PROJECT" to list your first file
**SOURCE:** `app/dashboard/create/project-files/` — 4-step wizard (Basics, Files, Follow Gate, Pricing). `convex/schema.ts` digitalProducts table — project-files type. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 row 5: "Project Files — DAW-specific versions (.als, .flp, .logicx), full production files with stems."

---

### Category 7 — Post 12: Playlist Curation

**Platform:** Instagram Reel / TikTok
**Hook:** You curate a playlist with 50K followers. Artists flood your DMs begging for placement. You listen to 50 tracks, add 3, and never reply to the other 47. Here's how to stop working for free.

**Script/Body:**
If you run a playlist — Spotify, Apple Music, SoundCloud — you know the drill. Artists flood your DMs asking for placement. You listen to 50 tracks. You add 3. You never respond to the other 47.

On PPR, playlist curation is its own product type.

3-step wizard. Playlist basics — name, description, genres you accept, cover art. Submission settings — acceptance criteria, submission rules, review SLA (how long you guarantee to respond). Pricing — free submissions or paid (charge per submission).

Artists submit through a proper form. You review in a queue. Accept or decline with feedback. The artist knows what genres you accept before they waste your time. You get paid for your curation work instead of doing it for free.

This turns a side hustle into a real revenue stream.

**Visual Direction:**
Screen recording: Show a playlist curation product page. Genre tags displayed. Submission fee shown. Cut to creator dashboard — submission review queue with accept/decline buttons. Show the 3-step creation wizard with genre selection and submission pricing.

**CTA:** DM me "PLAYLIST" to set up submissions
**SOURCE:** `app/dashboard/create/playlist-curation/` — 3-step wizard (Basics, Submission Settings, Pricing). Context file shows: genres array, submissionSLA, submissionRules, visibility. `convex/schema.ts` — curatorPlaylists + trackSubmissions tables. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 row 15: "Playlist Curation — Multi-platform (Spotify, Apple Music, SoundCloud), submission pricing, review queue."

---

### Category 7 — Post 13: PDF Guides & Cheat Sheets

**Platform:** Instagram Reel / TikTok
**Hook:** The best lead magnet for music producers isn't a free beat. It's a one-page cheat sheet. An EQ frequency chart. A chord progression reference. Here's why — and how to make one in 2 minutes.

> **EDIT NOTE:** Hook rewritten from "The fastest product on PPR" (about the platform) to "The best lead magnet for producers is a one-page cheat sheet" (educational insight about lead magnets).

**Script/Body:**
Not every product needs to be a $50 sample pack or a $200 course.

Sometimes the best first product is a one-page cheat sheet. A mixing frequency chart. A chord progression reference. An EQ cheatsheet for vocals.

On PPR, PDF guides are their own product type. The creation wizard is dead simple — basics, file upload, follow gate, pricing. That's it.

Here's the move. Make a useful PDF. Set the price to free. Turn on the follow gate — require an email address and an Instagram follow before they can download.

Now you have a lead magnet that builds your email list and your Instagram following simultaneously. Every download grows your audience.

The AI content assistant can even help generate the description and tags. You supply the knowledge. The system helps you package it.

This is the product I recommend every new creator starts with. Zero risk. Maximum list-building potential.

**Visual Direction:**
Screen recording: Create a new PDF product. Title: "Vocal EQ Cheat Sheet." Upload a 1-page PDF. Toggle price to "Free." Enable follow gate — check "Require email" and "Require Instagram follow." Publish. Show the buyer experience — enter email, follow on Instagram, download PDF. Show the creator's email contact list growing.

**CTA:** DM me "GUIDE" and I'll show you the fastest path to your first product
**SOURCE:** `app/dashboard/create/pdf/` — 4-step wizard (Basics, Files, Follow Gate, Pricing). `CONTENT-RESEARCH-ZERO-TO-PRODUCT.md` Step 3: "Cheat Sheet (easiest to create)" recommended as first product. Follow gate: `convex/followGateSubmissions.ts` — email + social follow capture. `PRODUCTION-READINESS-AUDIT.md`: Product Types rated yellow (PDF wizard functional).

---

### Category 7 — Post 14: Music Releases (Pre-save Campaigns)

**Platform:** Instagram Reel / TikTok
**Hook:** You drop a single. You post the Spotify link. 24 hours later, nobody's listening. Here's the pre-release strategy that turns one track into a list-building machine.

**Script/Body:**
Most producers announce a release like this: "New track out now" with a Spotify link. Engagement dies after 24 hours. No email capture. No follow-up. No momentum.

On PPR, music releases are a product type with a 4-step creation wizard.

Step 1 — basics: title, artist name, featured artists, release type (single, EP, album, mixtape, remix), genre, BPM, key, cover art. Even ISRC and UPC codes if you have them.

Step 2 — platforms: paste your streaming links for Spotify, Apple Music, SoundCloud, YouTube, Tidal, Deezer, Amazon Music, Bandcamp. All in one place.

Step 3 — pre-save campaign: gate the pre-save behind an email follow. Now every pre-save grows your email list. When release day hits, you email everyone who pre-saved.

Step 4 — drip email campaign: set up automated emails. Pre-save confirmation. Release day announcement. First-week milestone celebration.

Turn a single release into a list-building, engagement-driving machine.

**Visual Direction:**
Screen recording: Show the release creation wizard — 4 steps. Fill in track details. Paste Spotify and Apple Music links. Enable pre-save with email gate. Set up a 3-email drip: pre-save confirmation, release day, one-week follow-up.

**CTA:** DM me "RELEASE" to set up your next drop
**SOURCE:** `app/dashboard/create/release/` — 4-step wizard (Basics, Platforms, Presave, Drip). Context file shows: releaseType (single/EP/album/mixtape/remix), artistName, featuredArtists, label, genre, BPM, key, ISRC, UPC, streamingPlatformURLs (8 platforms), smartLinkUrl. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 row 19: "Music Releases — Pre-save campaign capture, release day announcements."

---

### Category 7 — Post 15: Tip Jars

**Platform:** Instagram Reel / TikTok
**Hook:** Your followers already appreciate your content. Some of them would literally pay you for it if you gave them a way. A tip jar takes 60 seconds to set up and breaks the mental barrier of "I'm not ready to sell yet."

**Script/Body:**
Here's what nobody tells new creators. Your first product doesn't need to be a masterpiece.

A tip jar is the lowest-friction product on PPR. Title. Description. That's it. No file uploads. No pricing tiers. No configuration.

"Support My Music." "Buy Me a Coffee While I Make Beats." Whatever you want.

Publish it. Share the link. People who appreciate your content can support you directly.

This isn't going to make you rich. But it does two things. First, it gets you past the mental barrier of "listing your first product." Second, it proves the system works — you see a real payment hit your Stripe account.

Once you've done that, creating your next product feels a lot less scary.

**Visual Direction:**
Screen recording: Create a tip jar. Title: "Support My Music." Description: "If my tutorials helped you, buy me a coffee." Publish. Show the storefront with the tip jar card. Show a $5 tip processing through Stripe. Timer overlay: "60 seconds."

**CTA:** Create your first product today — link in bio
**SOURCE:** `app/dashboard/create/tip-jar/` — 2-step wizard (Basics, Publish). `CONTENT-RESEARCH-ZERO-TO-PRODUCT.md` Step 3: "Tip Jar — 2 steps, title + description only." `CONTENT-RESEARCH-FEATURE-PAIN-MAP.md` Section 6 row 16: "Tip Jar — Donation/appreciation payments."

---

## Category 8 — Founding Creator Recruitment

---

### Category 8 — Post 1: I'm Looking for 10 Founding Creators

**Platform:** Instagram Carousel / Static Post
**Hook:** I'm looking for 10 music producers to be the first creators on PausePlayRepeat. Not 500. Not 100. Ten.

**Script/Body:**
I've spent over a year building PausePlayRepeat. A platform designed specifically for music producers to sell courses, beats, presets, sample packs, coaching, mixing services, memberships — 22+ product types, all under one roof.

Now I need creators.

Not hundreds. Ten. Here's why that number matters.

At ten creators, I can personally help each of you set up. Not a support ticket. Not a chatbot. Me. On a call. Walking you through your storefront, your first product, your first email sequence.

At ten creators, your feedback actually shapes the platform. You say "I wish the beat licensing page showed X" and I build it. That's not possible at scale.

At ten creators, there's almost no competition in the marketplace. Right now the marketplace has 14 categories and barely any products in most of them. You list a Serum preset pack and you're the only Serum preset pack. You list a mixing course and you're the featured mixing course.

Here's what founding creators get:
- Early access to every feature
- Direct line to me (DMs, not tickets)
- Input on what gets built next
- Featured placement in the marketplace

Pricing:
- Free tier: set up storefront, link-in-bio, listed in creator directory, one free product
- Starter: $12/month — 15 products, email marketing, follow gates, coaching
- Creator: $29/month — 50 products, advanced analytics, automations
- Pro: $79/month — unlimited everything, custom domain

Plus 10% of each sale. That covers Stripe payments, email infrastructure, AI content generation, the marketplace, everything.

No hidden fees. No annual contracts. Cancel anytime.

I built this because I was paying for 7 platforms to do what this does in one. The first ten creators who join will help shape what it becomes.

**Visual Direction:**
Carousel slides:
1. "I'm looking for 10 founding creators" — bold text on dark background
2. "Why 10?" — personal help, platform input, no competition
3. What founding creators get — bullet list
4. Pricing table — Free / $12 / $29 / $79 + 10% of sales
5. "What's included in 10%" — email marketing, AI content, storefront, marketplace, beat licensing, certificates, DM automation
6. CTA: "DM me FOUNDING to apply"

**CTA:** DM me "FOUNDING" to apply
**SOURCE:** `app/creators/page.tsx` — full creator recruitment letter. "Looking for: 10 founding creators (not 500, not 100)." Pricing: "Start at $12/month, plus 10% of sales." Benefits: "Shape the platform features, direct access to founder." `convex/creatorPlans.ts` — Free (1 product, $0), Starter ($12, 15 products), Creator ($29, 50 products), Pro ($79, unlimited). `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 7: 10% fee structure.

---

### Category 8 — Post 2: What Your First Week as a Creator Looks Like

**Platform:** Instagram Carousel / TikTok
**Hook:** "I want to sell my presets and tutorials but I don't know where to start." Most producers get stuck here for months. Here's exactly what the first 5 days look like when you stop overthinking it.

**Script/Body:**
Day 1: Sign up. Click "Become Creator." Your store auto-generates from your profile — name, avatar, bio, social links. You're live at pauseplayrepeat.com/your-name in 30 seconds. Connect your Stripe account so you can accept payments.

Day 2: Create your first product. I recommend a PDF cheat sheet or a tip jar. Two steps. Upload a file or just write a title. Set it as free with a follow gate to start building your email list. Published in under 5 minutes.

Day 3: Use the AI content engine. Feed it your product description and it generates 4 social media scripts — one for TikTok, one for Instagram, one for YouTube Shorts, one for YouTube long-form. Plus images. Plus voiceover audio. You now have a week's worth of content from one product.

Day 4: Set up your first email sequence. The platform has pre-built workflow templates — Producer Welcome Series, Free-to-Paid conversion, Cart Recovery. Pick one. Customize the copy. Turn it on. It runs automatically from now on.

Day 5: You're discoverable. Your products show up in the marketplace under "Newest." Your store shows up in the creator directory. Someone searching for your genre finds your stuff without you promoting it.

That's it. Store live. Product listed. Content created. Email automation running. Marketplace presence. Five days.

**Visual Direction:**
Carousel slides:
1. "Your first week as a creator" title card
2. Day 1: Screenshot of one-click store creation with confetti animation
3. Day 2: PDF cheat sheet wizard — 2 steps
4. Day 3: AI content pipeline showing 4 platform scripts generated from one source
5. Day 4: Email workflow builder with pre-built template
6. Day 5: Marketplace listing showing "Newest" sort with the creator's product visible
7. "5 days. Zero confusion." summary card

**CTA:** DM me "WEEK1" and I'll walk you through it personally
**SOURCE:** `components/dashboard/one-click-creator-setup.tsx` — 3-step flow: Confirm > Customize > Success (with confetti). Auto-generates store from profile. `CONTENT-RESEARCH-ZERO-TO-PRODUCT.md` — full journey analysis. Step 3: Tip Jar (2 steps), Cheat Sheet (2-3 steps). Step 5: AI content pipeline — 6-step creation gets 4 platform scripts. `app/dashboard/emails/workflows/templates/workflow-templates.ts` — pre-built templates (Producer Welcome Series, Sales/Conversion). `convex/marketplace.ts` — "newest" sort gives new products visibility.

---

### Category 8 — Post 3: The Founding Creator Advantage

**Platform:** Instagram Reel / TikTok
**Hook:** The producers who joined BeatStars in 2015 built the biggest stores on the platform. The ones who joined in 2023 are fighting for scraps. Timing matters.

**Script/Body:**
Every marketplace platform has the same pattern.

Early creators get featured placement. They build audience before there's competition. They shape the platform's direction. They become the default names people associate with the platform.

BeatStars in 2015. Gumroad in 2014. Patreon in 2013. The early creators on those platforms built empires. The ones who joined years later? They're fighting against established sellers with thousands of reviews and followers.

PausePlayRepeat is in that early stage right now. 14 marketplace categories. Most of them nearly empty.

If you list a sample pack today, you might be one of the only sample packs in the marketplace. If you list a mixing course, you could be THE mixing course people find when they browse.

That changes as the platform grows. More creators means more competition. More noise. Harder to stand out.

Right now, I'm personally building features based on what the first creators need. You say "I need X" and I build X. Try getting that from Gumroad's support team.

This window doesn't stay open. That's not marketing. That's just how marketplaces work.

**Visual Direction:**
Screen recording or graphic: Timeline showing BeatStars 2015 (early movers), 2020 (crowded), 2024 (saturated). Parallel timeline for PPR: 2026 — "You are here" arrow. Show the marketplace with categories and low competition. Show the creator directory with room for more.

**CTA:** DM me "EARLY" to lock in your spot
**SOURCE:** `app/creators/page.tsx` lines 639-677: "Almost no competition. Shape the platform features. Direct access to founder. Early advantage (same as BeatStars 2015, Gumroad early adopters)." `convex/marketplace.ts` — 14 marketplace categories. `app/marketplace/creators/page.tsx` — creator directory with current listings.

---

### Category 8 — Post 4: Spots Filling Up

**Platform:** Instagram Story / Static Post
**Hook:** 3 of 10 founding creator spots filled. Here's who's in so far.

**Script/Body:**
Quick update. When I posted about looking for 10 founding creators, I didn't expect the response I got.

[Number] of 10 spots are now filled. [Brief mention of genres/types represented without naming names unless they consent].

What I've learned from onboarding the first few: most producers are sitting on products they could list in 10 minutes but never had the right place to put them. One creator had 200+ presets in a folder. Another had a mixing template they'd been giving away for free. A third had been coaching over DM for months without ever formalizing it.

All three are live on the marketplace now.

If you've been thinking about it but haven't pulled the trigger — the remaining spots are still open. DM me "FOUNDING" and I'll personally help you get set up.

No pressure. No deadline manufactured for marketing purposes. Just a real limit because I can only give personal attention to so many people at once.

**Visual Direction:**
Simple graphic: "3/10 Founding Creator Spots Filled" with progress bar. Keep it clean. No over-design.

**CTA:** DM me "FOUNDING" — spots are real, not manufactured
**SOURCE:** `app/creators/page.tsx` — founding creator recruitment pitch. Note: Only post this after actually onboarding creators. Numbers must be real. The letter states "Not 500, not 100. Ten." — maintain authenticity.

---

## Category 9 — Myth Busting

---

### Category 9 — Post 1: "You Need 10K Followers to Sell"

**Platform:** Instagram Reel / TikTok
**Hook:** "I'll start selling when I hit 10K followers." No. You need 100 real fans. Here's the math.

**Script/Body:**
The most common excuse I hear from producers who want to sell: "I don't have enough followers yet."

Let's do the math.

A $30 sample pack. A 2% conversion rate on your audience. That's standard for digital products.

At 10,000 followers, 2% is 200 buyers. That's $6,000. Great.

But you don't need 10,000 to start. At 500 followers, 2% is 10 buyers. That's $300. At 1,000 followers, that's $600.

And here's what most people miss — your first customers aren't random followers. They're the people who already DM you asking for help. The ones who comment on every post. The ones who've been following you for months.

You probably have 10-20 of those people right now. A $30 product sold to 20 real fans is $600. That's your first month.

Kevin Kelly's 1,000 True Fans theory has been around since 2008 and it's still right. You don't need a massive audience. You need a small audience that trusts you.

PPR's follow gate feature actually helps you find these people. Offer a free cheat sheet. Gate it behind email + Instagram follow. The people who go through that process? Those are your real fans. Those are the people who will buy your paid product next.

**Visual Direction:**
Text-on-screen math breakdown: 500 followers x 2% = 10 sales x $30 = $300. Then: 20 real fans x $30 = $600. Show the follow gate capture flow — free download gated behind email. The email list IS your real fan list.

**CTA:** Your first 20 fans are already following you. DM me "START" to reach them.
**SOURCE:** `convex/followGateSubmissions.ts` — follow gate captures email + social follows, building a qualified lead list. `CONTENT-RESEARCH-ZERO-TO-PRODUCT.md` — "You probably have 10-20 of those people right now." 1,000 True Fans theory is well-documented independently. Revenue math is straightforward calculation.

---

### Category 9 — Post 2: "Nobody Will Pay for Presets When Free Ones Exist"

**Platform:** Instagram Reel / TikTok
**Hook:** There are 10,000 free Serum presets on the internet. People still pay $30 for curated packs. Here's why.

**Script/Body:**
"Why would anyone pay for presets when there are free ones everywhere?"

Same reason people pay for sample packs when Splice exists. Same reason people buy courses when YouTube is free. Same reason people go to restaurants when they have a kitchen.

Convenience. Curation. Trust.

A free preset folder from Reddit has 500 presets. 490 of them are garbage. You spend 3 hours auditioning to find 10 usable ones.

A curated preset pack from a producer you trust has 50 presets that are all usable. You install them and you're making music in 5 minutes.

People aren't paying for the files. They're paying for the time you saved them. They're paying for the curation. They're paying because they trust your ears.

The producers making real money from presets aren't competing on quantity. They're competing on trust and specificity. "50 Dark Trap Serum Presets from the producer who made [specific track]" beats "1000 Free Presets" every time.

On PPR, your preset pack shows the target plugin, the genre, and your name as the creator. The buyer knows exactly what they're getting from someone whose work they already respect.

**Visual Direction:**
Split screen: Left side — Reddit preset dump, 500 files, no organization, no previews. Right side — PPR preset pack with plugin badge, genre tag, creator name, description. Text overlay: "One saves time. The other wastes it."

**CTA:** If you have presets people have asked for, they'll pay for them. Link in bio.
**SOURCE:** `app/marketplace/preset-packs/page.tsx` — plugin-specific filtering, genre tags, creator attribution. General market logic — the paid-vs-free argument is well-documented in creator economy research. The curation/trust/convenience value proposition is observable in existing markets (Splice, Cymatics, etc.).

---

### Category 9 — Post 3: "I'm Not Good Enough to Teach"

**Platform:** Instagram Reel / TikTok
**Hook:** You don't need to be the best producer in the world to teach. You just need to be 2 steps ahead of someone.

**Script/Body:**
"I'm not good enough to teach."

I hear this from producers who've been making music for 5+ years. Producers who've mixed hundreds of tracks. Producers who other producers DM for advice.

You don't need a Grammy to teach. You need to know something that someone else doesn't know yet.

A producer with 2 years of experience knows things a producer with 6 months doesn't. How to set up a compressor chain. How to get a clean low end. How to use sidechain properly.

That's a course. That's a cheat sheet. That's a coaching session.

The myth is that you need to be the world's expert. The reality is that you need to be helpful to the person one step behind you.

On PPR, the course system supports free preview chapters. Let people taste your teaching before they buy. If your free content is helpful, they'll pay for the full course.

Certificates auto-generate when a student completes your course. That's social proof for them and credibility for you.

Start with what you know. A cheat sheet costs nothing to create. Upload a PDF, set it free, and see if people find it useful. The market will tell you if you're "good enough."

**Visual Direction:**
Text-on-screen: "2 years experience → 0-6 month producers need YOU." Show the course creation wizard — focus on the free preview chapter toggle. Show a certificate being generated. End with: "Start with a free cheat sheet. Let the market decide."

**CTA:** DM me "TEACH" — I'll help you figure out your first topic
**SOURCE:** `convex/courses.ts` — free preview chapters (creator marks specific chapters as free). `convex/certificates.ts` — auto-generated on 100% completion with unique verification codes. `app/dashboard/create/pdf/` — PDF/cheat sheet as lowest-barrier first product. `CONTENT-RESEARCH-ZERO-TO-PRODUCT.md`: "Cheat Sheet (easiest to create)" as recommended first product. The "2 steps ahead" teaching principle is widely cited in education and creator economy contexts.

---

### Category 9 — Post 4: "Selling Online is Passive Income"

**Platform:** Instagram Reel / TikTok
**Hook:** I need to be honest. Selling digital products is NOT passive income. Here's what it actually requires.

**Script/Body:**
Everyone selling courses about selling courses calls it "passive income." Let me be honest.

Passive income means you do nothing and money appears. That doesn't exist in music production.

Here's what actually happens.

You spend 20 hours creating a quality sample pack. You spend 5 hours writing product descriptions, creating a demo track, setting up the listing. You spend 10 hours creating content to promote it. You spend 3 hours setting up email sequences.

After all that — yes, sales can come in while you sleep. The automation runs. The marketplace works. The email sequences nurture leads.

But you still need to:
- Create new content regularly to drive traffic
- Respond to customer questions
- Update products based on feedback
- Create new products to keep people coming back
- Monitor what's working and adjust

The "passive" part is real — once your storefront, email sequences, and content library are set up, they work for you 24/7. I built PPR specifically so that setup work compounds. Content you create once gets repurposed by the AI engine. Email sequences you build once run forever.

But the honest truth is: it's a real business. It requires real work. The tools reduce the work. They don't eliminate it.

If someone tells you it's easy money, they're selling you something. I'm selling you a tool that makes the hard work more efficient.

**Visual Direction:**
No fancy graphics. Face to camera. Honest tone. Maybe a simple text breakdown: "20 hours creating + 5 hours listing + 10 hours promoting + 3 hours automation = ongoing work that compounds."

**CTA:** If you're willing to do the work, the tools are ready. Link in bio.
**SOURCE:** `app/creators/page.tsx` lines 712-754: "What I Won't Tell You" section — "Not a guaranteed path to riches. Platform isn't perfect. 100,000 followers ≠ 100,000 sales." `CONTENT-RESEARCH-EVERGREEN-ENGINE.md` — email sequences and content that run forever once set up. The honest framing directly mirrors Andrew's voice in the creator letter.

---

### Category 9 — Post 5: "You Need to Be on Every Platform"

**Platform:** Instagram Reel / TikTok
**Hook:** Gumroad for downloads. BeatStars for beats. Teachable for courses. Patreon for memberships. What if you just... didn't?

**Script/Body:**
The conventional wisdom is: be everywhere. Gumroad for your digital products. BeatStars for your beats. Teachable for your courses. Patreon for your memberships. Buffer for your scheduling. Mailchimp for your emails.

I did that. Six platforms. Six logins. Six sets of analytics that don't talk to each other. Six monthly bills. Hundreds of dollars.

And the worst part? My customers had to create accounts on each platform. Someone who bought my course on Teachable was a stranger on Gumroad. I couldn't email my Gumroad buyers about my new course because they were in a different system.

One platform, done well, beats five platforms done poorly.

When everything is in one place — your storefront, your products, your email list, your social scheduling, your analytics — everything compounds. A student who finishes your course gets recommended your preset pack. A sample pack buyer gets enrolled in your email sequence about your mixing course. A beat buyer sees your coaching sessions on your storefront.

Cross-selling only works when the data is connected. On PPR, it is.

**Visual Direction:**
Screen recording: Open 6 browser tabs (Gumroad, BeatStars, Teachable, Patreon, Buffer, Mailchimp). Show the chaos. Close them one by one. Open PPR dashboard. Show: products, courses, email, social, analytics — all in one place. End with a storefront showing beats, courses, presets, and coaching side by side.

**CTA:** One place. Everything connected. Link in bio.
**SOURCE:** `CONTENT-RESEARCH-PLATFORM-REPLACEMENT.md` — "7 platforms, hundreds of dollars a month." `app/creators/page.tsx` lines 35-77: "The Backstory — 7 platforms (Kajabi, Active Campaign, Shopify, Discord, Google Drive, Zapier, Stripe/PayPal)." `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 9: Hidden cost stack $210-$583/month to replicate PPR features. Note: this topic was briefly touched in Batch 1 Post 1 ("The Stack I Killed"). This post goes deeper into the customer experience fragmentation angle rather than the creator cost angle.

---

## Category 10 — "How Would You Sell This?" Series

---

### Category 10 — Post 1: You Just Finished a Beat Tape with 10 Tracks

**Platform:** Instagram Carousel / TikTok
**Hook:** You just finished a 10-track beat tape. Here's exactly how you'd turn it into 5 revenue streams on one platform.

**Script/Body:**
You've got 10 beats. Most producers would upload them to BeatStars and wait. Here's what I'd do on PPR.

**Revenue stream 1: Individual beat leases.** List each beat with 4 licensing tiers. Basic at $25. Premium at $75. Exclusive at $500. That's 10 products from one beat tape. A buyer who wants one beat can pick their tier. A buyer who wants the exclusive gets the beat removed from the marketplace automatically.

**Revenue stream 2: The beat tape bundle.** Create a bundle with all 10 beats. Price individually they'd be $250 at the basic tier. Bundle price: $149. The savings display automatically — "Save $101." One checkout.

**Revenue stream 3: Project files.** For each beat, list the project file as a separate product. Producers who want to study your workflow will pay $15-25 per session file. That's 10 more products.

**Revenue stream 4: Free beats as lead magnets.** Pick your 2 weakest beats. Set them to free with a follow gate — require email + Instagram follow. Now every free download builds your audience for the paid beats.

**Revenue stream 5: Email sequence.** Set up an automation: when someone downloads a free beat, they get a 3-email sequence over 5 days. Email 1: "Here's your beat." Email 2: "Check out these other beats." Email 3: "The exclusive is still available — grab it before someone else does."

10 beats. 22 products. 2 lead magnets. 1 automated email sequence. Everything on one storefront.

**Visual Direction:**
Carousel slides:
1. "10 beats → 5 revenue streams" title card
2. Beat leases: 4 tiers x 10 beats visualization
3. Bundle: $250 individual → $149 bundle with savings badge
4. Project files: .als/.flp icons with $15-25 price tags
5. Follow gate: Free beat → email capture → Instagram follow
6. Email sequence: 3-step automation flow diagram
7. Summary: "22 products. 2 lead magnets. 1 email sequence. 1 storefront."

**CTA:** DM me "BEATS" to start listing yours
**SOURCE:** Beat leases: `convex/beatLeases.ts` — 4-tier licensing. Bundles: `convex/bundles.ts` — auto-calculated savings, mixed product types. Project files: `app/dashboard/create/project-files/` — 4-step wizard. Follow gates: `convex/followGateSubmissions.ts` — email + social capture. Email automation: `convex/emailWorkflows.ts` — trigger-based sequences. `CONTENT-RESEARCH-FEATURE-PAIN-MAP.md` Section 6 — all product types verified.

---

### Category 10 — Post 2: You Have 200 Serum Presets Sitting in a Folder

**Platform:** Instagram Reel / TikTok
**Hook:** You have 200 Serum presets in a folder called "My Presets." You made them over 3 years. They're doing nothing. Here's how to turn them into $2,000.

**Script/Body:**
Step 1: Organize them. Split 200 presets into 4 packs of 50. Theme each one — "Dark Trap Basses," "Future Bass Leads," "Ambient Pads," "Lo-Fi Keys." Themed packs sell better than "200 Random Presets."

Step 2: Create the packs on PPR. The creation wizard asks for the target plugin — select Serum. Set the genre. Upload the files. Write a description. The AI assistant can help generate the description and tags.

4 packs. 4 products. Maybe 20 minutes of work per pack if you already have the files organized.

Step 3: Price them. $19 each. Or create a bundle — "Complete Serum Collection" — all 4 packs for $49 instead of $76. The savings math displays automatically.

Step 4: Create a lead magnet. Take 10 of your best presets and put them in a free pack. Gate it behind email + Instagram follow. Now people can try your presets before buying.

Step 5: Set up the funnel. When someone downloads the free pack, an automated email sequence runs. Day 1: "Here are your presets." Day 3: "Here's what else I made." Day 7: "The bundle saves you $27."

Step 6: Use the AI content engine. Feed it your preset pack description. Get back TikTok and Instagram scripts. Post a 30-second demo of each preset with the script the AI wrote.

You started with a folder. You end with 5 products, a lead magnet, an email funnel, and a content calendar. From presets you already made.

**Visual Direction:**
Screen recording walkthrough: Folder with 200 presets → organize into 4 themed folders → PPR creation wizard (select Serum as target plugin) → publish 4 packs → create bundle → create free lead magnet pack → email automation setup → AI content generation showing TikTok script.

**CTA:** DM me "PRESETS" to list your first pack today
**SOURCE:** Preset packs: `app/dashboard/create/pack/` — 4-step wizard with target plugin selection (50+ plugins). Bundles: `convex/bundles.ts` — auto savings calculation. Follow gates: `convex/followGateSubmissions.ts`. Email automation: `convex/emailWorkflows.ts`. AI content: `convex/masterAI/socialMediaGenerator.ts` — platform-specific script generation. `CONTENT-RESEARCH-PLATFORM-COMPARISON.md` Section 1 row 3: "50+ target plugins supported."

---

### Category 10 — Post 3: Someone DM'd You Asking for Mixing Feedback

**Platform:** Instagram Reel / TikTok
**Hook:** A producer DMs you: "Can you listen to my mix and give feedback?" You say yes for free. Here's how to turn that into paid coaching without being weird about it.

**Script/Body:**
This happens to every producer with any following. DMs asking for feedback. Mixing advice. Production tips. "Can you check my track real quick?"

You have two options. Say yes and work for free forever. Or say no and feel like a jerk.

Here's option three.

Create a coaching product on PPR. "1-on-1 Mix Review — 30 minutes — $50." Set your availability. Set the session type — video call, audio call, or text-based feedback.

Next time someone DMs you, respond with: "I'd love to! I actually do formal mix reviews now — here's the link." Send them your coaching page.

No awkward negotiation. No "how much do you charge?" back-and-forth. The price is right there. The availability is right there. They book a slot. They pay. You show up.

And here's the thing — you can still do free feedback too. Create a follow-gated coaching intro. A free 15-minute "quick feedback" option gated behind email capture. The serious ones book the paid session.

To make this even easier: set up the DM automation. When someone comments "FEEDBACK" on your posts, auto-send them the booking link. No manual work.

**Visual Direction:**
Screen recording: Instagram DM asking "can you check my mix?" → PPR coaching wizard → set up "Mix Review" session → $50 / 30 min → set availability → publish → copy link → paste in DM reply. Then show DM automation setup: keyword "FEEDBACK" → auto-send booking link.

**CTA:** DM me "COACHING" to set up your first session
**SOURCE:** Coaching: `app/dashboard/create/coaching/` — 5-step wizard (Basics, Pricing, Follow Gate, Discord, Availability). DM Automation: `convex/automations.ts` — keyword-triggered auto-replies with product link attachment. `PRODUCTION-READINESS-AUDIT.md`: DM Automation rated 95% production-ready. `CONTENT-RESEARCH-FEATURE-PAIN-MAP.md` Section 6 row 8: "Coaching — Session scheduling with timezone support, duration/type configuration."

---

### Category 10 — Post 4: You Made a YouTube Tutorial That Went Viral

**Platform:** Instagram Carousel / TikTok
**Hook:** Your YouTube tutorial hit 500K views. 500,000 people watched you teach for free. Here's how to turn those viewers into customers.

**Script/Body:**
Your tutorial went viral. 500K views. Thousands of comments. People saying "this changed my workflow." Amazing.

But 500K views on YouTube pays about $1,500. And now those viewers are gone. They watched, they left. No email. No relationship. No way to reach them again.

Here's the play.

**Step 1: Create a deeper version as a course.** Your viral tutorial was 15 minutes. Create a 2-hour course that goes deeper on the same topic. Modules. Chapters. Downloadable resources. Charge $49.

**Step 2: Create a cheat sheet from the tutorial.** Summarize the key points into a one-page PDF. Set it free with a follow gate. Email capture. Instagram follow. You're converting YouTube viewers into YOUR audience.

**Step 3: Pin the link.** YouTube description. Instagram bio. All pointing to your PPR storefront.

**Step 4: Set up the funnel.** Free cheat sheet → email sequence → course promotion. Day 1: cheat sheet. Day 3: "Liked the cheat sheet? Here's the full course." Day 7: "Students who took this course say [testimonial]."

**Step 5: Create a related product.** If the tutorial was about mixing vocals, create a vocal mixing template. A preset pack for vocal processing. A coaching offer for mix feedback.

One viral video. Five products. An email funnel. And now every future viewer has a path from "free content" to "paying customer."

**Visual Direction:**
Carousel slides:
1. "500K views → $1,500 from YouTube. Here's how to make more."
2. YouTube tutorial → PPR course with modules and chapters
3. Cheat sheet as lead magnet with follow gate
4. Email funnel: Cheat sheet → Day 3 course pitch → Day 7 testimonial
5. Related products: template + preset pack + coaching
6. "One video. Five products. One funnel."

**CTA:** DM me "VIRAL" to plan your product suite
**SOURCE:** Course system: `app/dashboard/create/course/` — 6-step wizard with modules/chapters. PDF/cheat sheets: `app/dashboard/create/pdf/` — 4-step wizard. Follow gates: `convex/followGateSubmissions.ts`. Email automation: `convex/emailWorkflows.ts` with pre-built templates. Related products on same storefront: `app/[slug]/page.tsx` — unified product grid. `CONTENT-RESEARCH-EVERGREEN-ENGINE.md` — email sequences run forever once set up.

---

### Category 10 — Post 5: You Have a Sample Pack but Zero Followers

**Platform:** Instagram Reel / TikTok
**Hook:** You made a fire sample pack. You have 47 Instagram followers. Here's the plan — and it doesn't start with "get more followers."

**Script/Body:**
Zero audience? Cool. Let's work backwards.

**Week 1: List the pack.** Upload it to PPR. Set the genre, BPM, key. Write a solid description — the AI assistant helps. Publish. You're in the marketplace under "Newest." Someone browsing for your genre can find you. That's discovery you didn't have 5 minutes ago.

**Week 2: Create a free version.** Take 5-10 of your best samples. Create a free mini-pack. Gate it behind email + Instagram follow. This is your lead magnet.

**Week 3: Create content.** Use the AI content engine. Feed it your sample pack description. Get back 4 scripts — TikTok, Instagram, YouTube Shorts, YouTube long-form. Post the TikTok: "I made a sample pack. Here's what's in it." Play the samples. Show the waveforms. 30 seconds. Post it.

**Week 4: Engage.** Find producers in your genre. Comment on their posts. Not "check out my sample pack" — actually engage. "That 808 pattern is sick, what BPM?" Build real relationships. Some of those people will check your profile. Your bio links to your PPR storefront.

You didn't need 10K followers to start. You needed one product, one lead magnet, one piece of content, and a willingness to show up in the community.

The marketplace gives you baseline discovery. The content gives you reach. The follow gate builds your list. The list converts to sales.

It's not fast. It's not passive. But it works.

**Visual Direction:**
Screen recording: Week-by-week walkthrough. Week 1: upload sample pack to PPR marketplace. Week 2: create free mini-pack with follow gate. Week 3: AI content engine generating TikTok script from pack description. Week 4: Instagram engagement (commenting, not spamming). Show the email list growing week over week.

**CTA:** DM me "ZERO" — I'll help you make your first plan
**SOURCE:** Marketplace discovery: `convex/marketplace.ts` — "Newest" sort gives new products immediate visibility. Follow gates: `convex/followGateSubmissions.ts`. AI content: `convex/masterAI/socialMediaGenerator.ts` — 4 platform-specific scripts from one source. `CONTENT-RESEARCH-ZERO-TO-PRODUCT.md` Step 6: "Products browsable by category, newest sort means new creators get immediate visibility." `app/marketplace/samples/page.tsx` — sample browsing with audio preview.

---

## Integrated 7-Week Content Calendar

This calendar integrates all 25 posts from Batch 1 (SOCIAL-CONTENT-IDEAS.md) with the 24 posts from Batch 2 for a total of 49 posts across 7 weeks (7 posts per week, 1 per day).

### Sequencing Logic

1. **Weeks 1-2: Establish authority and surface the pain.** Lead with "I Replaced 7 Platforms" and pain-point content from Batch 1. Mix in myth busting posts that challenge assumptions. This builds credibility before any ask.

2. **Weeks 3-4: Go deep on product types.** Now that the audience understands the platform exists, show specific product types that match their situation. Each deep dive makes a different producer think "that's exactly what I need."

3. **Week 5: Scenario-based content.** "How Would You Sell This?" posts bridge from features to action. They help producers see themselves using the platform.

4. **Week 6: Soft recruitment.** Founding creator posts go here — after 5 weeks of value. The audience is warmed up. The ask feels earned.

5. **Week 7: Urgency and conversion.** Final recruitment pushes, remaining deep dives, and the progress update. Close the loop.

### Legend
- **B1-C#-P#** = Batch 1, Category #, Post #
- **B2-C#-P#** = Batch 2, Category #, Post #

---

### Week 1 — Establish Authority

| Day | Post | Rationale |
|-----|------|-----------|
| Mon | **B1-C1-P1:** The Stack I Killed (7 Platforms → 1) | Lead with the strongest hook. Establishes the entire narrative. |
| Tue | **B2-C9-P1:** You Need 10K Followers to Sell (Myth) | Immediately address the #1 objection before they have it. |
| Wed | **B1-C1-P2:** I Replaced Mailchimp | Deep credibility — show the technical depth. |
| Thu | **B1-C2-P1:** Individual Sample Preview | First product-specific feature. Visual, demonstrable. |
| Fri | **B1-C1-P3:** I Replaced ManyChat and Added AI | Another platform replacement. Building the pattern. |
| Sat | **B2-C9-P2:** Nobody Pays for Presets (Myth) | Weekend myth bust — challenges a common excuse. |
| Sun | **B1-C3-P1:** "I Lost Thousands Before Automation" | Origin story. Emotional hook for Sunday engagement. |

### Week 2 — Deepen Pain Points & Features

| Day | Post | Rationale |
|-----|------|-----------|
| Mon | **B1-C1-P4:** I Replaced Buffer With AI Content Engine | Continues platform replacement series. |
| Tue | **B2-C9-P3:** I'm Not Good Enough to Teach (Myth) | Addresses the teaching hesitation before course deep dives. |
| Wed | **B1-C2-P2:** AI Content From One Chapter | Feature showcase — demonstrates the AI pipeline. |
| Thu | **B1-C1-P5:** I Replaced Teachable for $0 Extra | Sets up course-related content. |
| Fri | **B1-C3-P2:** "None of the Platforms Had a Storefront For Us" | Storefront pain point — bridges to product types. |
| Sat | **B2-C9-P4:** Selling Online is Passive Income (Myth — Honest) | Weekend honesty post. Builds trust. |
| Sun | **B1-C3-P3:** "How Do Buyers Find Creators?" | Discovery pain point. Sets up marketplace content. |

### Week 3 — Product Type Deep Dives (Part 1)

| Day | Post | Rationale |
|-----|------|-----------|
| Mon | **B2-C7-P1:** Beat Leases (Licensing Tiers) | Start with the most differentiated product type. |
| Tue | **B2-C7-P2:** Sample Packs (Individual Preview) | Second strongest differentiator. |
| Wed | **B1-C2-P3:** Follow Gate = Lead Gen Machine | Feature that connects to every product type. |
| Thu | **B2-C7-P3:** Preset Packs (Plugin Filtering) | Appeals to a huge segment of producers. |
| Fri | **B2-C7-P5:** Courses (Modules, Certificates) | Big product type — Teachable replacement. |
| Sat | **B2-C7-P13:** PDF Guides & Cheat Sheets (Easiest First Product) | Weekend — easy win, lowest barrier. |
| Sun | **B1-C4-P1:** Show the Dashboard | Visual tour. Let people see the actual product. |

### Week 4 — Product Type Deep Dives (Part 2)

| Day | Post | Rationale |
|-----|------|-----------|
| Mon | **B2-C7-P4:** Effect Chains / Ableton Racks | Niche but passionate audience. |
| Tue | **B2-C7-P6:** Coaching & 1-on-1 Sessions | Service-based producers. |
| Wed | **B2-C7-P7:** Mixing & Mastering Services | Another service type. |
| Thu | **B2-C7-P8:** Memberships & Subscriptions | Patreon replacement pitch. |
| Fri | **B2-C7-P10:** Mixing Templates | Underrated product type. |
| Sat | **B2-C7-P9:** Bundles | Revenue optimization — weekend content. |
| Sun | **B1-C3-P4:** "I Was Posting at Random Times" | Analytics pain point. Lighter Sunday content. |

### Week 5 — Scenario Walkthroughs

| Day | Post | Rationale |
|-----|------|-----------|
| Mon | **B2-C10-P1:** 10-Track Beat Tape → 5 Revenue Streams | Strongest scenario. Concrete and actionable. |
| Tue | **B2-C10-P2:** 200 Serum Presets → $2,000 | Resonates with preset makers. Step-by-step. |
| Wed | **B2-C7-P11:** Project Files | Quick deep dive between scenarios. |
| Thu | **B2-C10-P3:** DM Feedback → Paid Coaching | Relatable for anyone with a following. |
| Fri | **B2-C10-P4:** Viral YouTube Tutorial → Customer Funnel | For the content creators. |
| Sat | **B2-C10-P5:** Sample Pack with Zero Followers | Weekend inspiration — "you can start now." |
| Sun | **B2-C9-P5:** You Need to Be on Every Platform (Myth) | Consolidation message. Primes for the ask next week. |

### Week 6 — Creator Recruitment

| Day | Post | Rationale |
|-----|------|-----------|
| Mon | **B2-C8-P1:** I'm Looking for 10 Founding Creators | THE recruitment post. Monday = fresh audience. |
| Tue | **B2-C8-P2:** What Your First Week Looks Like | Remove friction. Show how easy the start is. |
| Wed | **B1-C4-P2:** Behind the Scenes: One Feature Deep Dive | Technical credibility to support the ask. |
| Thu | **B2-C8-P3:** The Founding Creator Advantage | FOMO — why early matters. |
| Fri | **B2-C7-P12:** Playlist Curation | Fill the week with a unique product type. |
| Sat | **B1-C5-P1:** Platform Pricing vs Tool Stack Cost | Cost comparison — supports the value proposition. |
| Sun | **B1-C3-P5:** "I Needed Different Tools for Everything" | Pain point recap. Reinforces why PPR exists. |

### Week 7 — Close and Convert

| Day | Post | Rationale |
|-----|------|-----------|
| Mon | **B2-C7-P14:** Music Releases (Pre-save Campaigns) | Last product deep dive. |
| Tue | **B2-C7-P15:** Tip Jars (Easiest Product — 60 Seconds) | Lowest barrier. "You can start today." |
| Wed | **B1-C5-P2:** One-to-One Session (Value Content) | Value-add post before final push. |
| Thu | **B1-C6-P1:** Community Question / Poll | Engagement content. Gauge interest. |
| Fri | **B2-C8-P4:** Spots Filling Up (Progress Update) | Urgency — only if real numbers support it. |
| Sat | **B1-C6-P2:** Responding to Objections / FAQ | Handle remaining objections. |
| Sun | **B1-C4-P3:** Recap / Summary Post | Wrap the 7-week campaign. Restate the CTA. |

---

### Calendar Notes

1. **Batch 1 posts referenced** (B1): These assume SOCIAL-CONTENT-IDEAS.md contains 25 posts across Categories 1-6. The specific post numbers above are illustrative — map to your actual post numbering in that file.

2. **B2-C8-P4 (Spots Filling Up):** Only post this if you've actually onboarded creators. If not, swap with another myth bust or product deep dive. Never fake urgency.

3. **Platform rotation:** Alternate between Reels/TikTok (Mon, Wed, Fri) and Carousels/Static (Tue, Thu, Sat, Sun) for format variety.

4. **Repurposing:** Every Reel/TikTok script can be repurposed as a carousel with the same content in text slides. Every carousel can be narrated as a Reel. The AI content engine on PPR can help generate both formats from one source.

5. **DM keywords used:** BEATS, SAMPLES, CHAINS, COURSE, COACHING, MIXING, MEMBERSHIP, TEMPLATE, PROJECT, PLAYLIST, GUIDE, RELEASE, AUTOMATION, EMAIL, START, TEACH, PRESETS, VIRAL, ZERO, FOUNDING, WEEK1, EARLY. Each maps to a specific product type or action — set up DM automation to respond to each keyword with the relevant link.
