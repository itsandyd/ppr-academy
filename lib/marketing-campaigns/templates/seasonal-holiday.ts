import { MarketingCampaignTemplate, musicProducerHashtags } from "../types";

// Black Friday / Cyber Monday Template
export const blackFridayTemplate: MarketingCampaignTemplate = {
  id: "black-friday",
  name: "Black Friday / Cyber Monday",
  description: "Biggest sale of the year",
  campaignType: "seasonal_holiday",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "ShoppingBag",
  estimatedReach: "high",

  email: {
    subject: "BLACK FRIDAY: {{discountPercent}}% off EVERYTHING",
    previewText: "The biggest sale of the year is here",
    body: `<p>Hey {{firstName}},</p>

<p><strong>IT'S HERE.</strong></p>

<p>The biggest sale of the year. No games. No tricks.</p>

<p style="background-color: #000; color: #fff; padding: 24px; text-align: center; border-radius: 8px; margin: 20px 0;">
  <span style="font-size: 32px; font-weight: bold;">{{discountPercent}}% OFF EVERYTHING</span><br>
  <span style="font-size: 14px;">Black Friday through Cyber Monday</span>
</p>

<p><strong>What's included:</strong></p>
<ul>
  <li>All sample packs</li>
  <li>All preset packs</li>
  <li>All courses</li>
  <li>All bundles</li>
</ul>

<p>Use code: <strong>{{discountCode}}</strong></p>

<p>Sale ends Monday at midnight.</p>

<p style="margin: 24px 0;">
  <a href="{{storeUrl}}" style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">SHOP BLACK FRIDAY</a>
</p>

<p>This is the lowest prices I offer all year. If you've been waiting - now's the time.</p>

<p>{{creatorName}}</p>`,
    ctaText: "Shop Black Friday",
    ctaUrl: "{{storeUrl}}",
  },

  instagram: {
    caption: `BLACK FRIDAY IS HERE

{{discountPercent}}% OFF EVERYTHING

Sample packs. Presets. Courses. Bundles.

All of it. {{discountPercent}}% off.

Code: {{discountCode}}

This is the lowest prices I offer ALL YEAR.

Sale ends Monday at midnight.

Link in bio. Don't miss this one.`,
    hashtags: [
      "blackfriday", "cybermonday", "blackfridaysale", "musicproducer",
      "beatmaker", "producerlife", "sale", "musicproduction",
      "producer", "studiolife", "blackfridaydeals", "producersale"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `BLACK FRIDAY

{{discountPercent}}% off EVERYTHING

Sample packs. Presets. Courses.

Code: {{discountCode}}

Ends Monday midnight.

{{storeUrl}}`,
    hashtags: ["blackfriday", "producer"],
  },

  facebook: {
    post: `BLACK FRIDAY / CYBER MONDAY SALE

The biggest sale of the year is here.

{{discountPercent}}% off EVERYTHING in my store:
- All sample packs
- All preset packs
- All courses
- All bundles

Use code: {{discountCode}}

This is the lowest prices I offer all year. Sale ends Monday at midnight.

{{storeUrl}}

What are you grabbing?`,
    callToAction: "Shop the Sale",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Black Friday through Cyber Monday: {{discountPercent}}% off all production resources.

If you've been considering investing in professional sample packs, presets, or courses - this is the most cost-effective time to do so.

Use code {{discountCode}} at {{storeUrl}}

Sale ends Monday.`,
    hashtags: ["BlackFriday", "MusicProduction", "CyberMonday"],
    professionalAngle: "Professional investment opportunity",
  },

  tiktok: {
    caption: `BLACK FRIDAY. {{discountPercent}}% off everything. Code: {{discountCode}}. Link in bio. Ends Monday.`,
    hashtags: ["blackfriday", "producertok", "musicproducer", "fyp", "sale"],
    hookLine: "Black Friday sale just went live and here's what you can get",
  },

  variables: [
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "50" },
    { key: "{{discountCode}}", label: "Discount Code", type: "text", required: true, defaultValue: "BLACKFRIDAY" },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: true },
  ],

  recommendedTiming: {
    email: "Black Friday morning, 6:00 AM",
    social: "Post throughout the weekend",
    urgency: "Final reminder Sunday evening",
  },
};

// New Year Sale Template
export const newYearSaleTemplate: MarketingCampaignTemplate = {
  id: "new-year-sale",
  name: "New Year Sale",
  description: "Ring in the new year with a fresh start",
  campaignType: "seasonal_holiday",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "Sparkles",
  estimatedReach: "high",

  email: {
    subject: "New year, new sounds: {{discountPercent}}% off",
    previewText: "Start {{year}} with fresh sounds",
    body: `<p>Hey {{firstName}},</p>

<p>Happy New Year!</p>

<p>{{year}} is here, and it's time to level up your production game.</p>

<p>To help you start the year right, I'm running a <strong>New Year Sale</strong>:</p>

<p style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
  <span style="font-size: 28px; font-weight: bold;">{{discountPercent}}% OFF</span><br>
  <span>All sample packs, presets, and courses</span>
</p>

<p>Use code: <strong>{{discountCode}}</strong></p>

<p><strong>My New Year challenge to you:</strong></p>
<p>{{challenge}}</p>

<p>The tools are here. The year is fresh. What are you going to create?</p>

<p style="margin: 24px 0;">
  <a href="{{storeUrl}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Start the Year Right</a>
</p>

<p>Here's to a creative {{year}},<br>{{creatorName}}</p>`,
    ctaText: "Start the Year Right",
    ctaUrl: "{{storeUrl}}",
  },

  instagram: {
    caption: `NEW YEAR SALE

{{year}} is here. Time to level up.

{{discountPercent}}% off everything in my store.

Code: {{discountCode}}

What's your production goal for this year? Drop it in the comments.

Make {{year}} the year you actually finish that album.

Link in bio.`,
    hashtags: [
      "newyear", "newyearsale", "musicproducer", "producerlife",
      "newyearnewsounds", "musicproduction", "producer", "beats",
      "studiolife", "producergoals"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `New year, new sounds.

{{discountPercent}}% off everything.

Code: {{discountCode}}

What's your #1 production goal for {{year}}?

{{storeUrl}}`,
    hashtags: ["newyear", "producer"],
  },

  facebook: {
    post: `HAPPY NEW YEAR!

{{year}} is here, and I'm kicking it off with a sale.

{{discountPercent}}% off everything in my store. Sample packs, presets, courses - all of it.

Use code: {{discountCode}}

My challenge to you: {{challenge}}

What are your production goals for this year? Share them in the comments.

{{storeUrl}}`,
    callToAction: "Shop New Year Sale",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Welcome to {{year}}.

For producers looking to invest in their craft this year, I'm offering {{discountPercent}}% off all resources through the first week of January.

New year, new skills, new sounds.

{{storeUrl}}`,
    hashtags: ["NewYear", "MusicProduction", "Goals"],
    professionalAngle: "Year-start professional development",
  },

  tiktok: {
    caption: `New year sale. {{discountPercent}}% off everything. What's your production goal for {{year}}?`,
    hashtags: ["newyear", "producertok", "musicproducer", "fyp", "newyearsale"],
    hookLine: "It's a new year and here's how to start it right as a producer",
  },

  variables: [
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{year}}", label: "Year", type: "text", required: true, defaultValue: "2025" },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "30" },
    { key: "{{discountCode}}", label: "Discount Code", type: "text", required: true, defaultValue: "NEWYEAR" },
    { key: "{{challenge}}", label: "New Year Challenge", type: "text", required: true, placeholder: "Finish one full track in January" },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: true },
  ],

  recommendedTiming: {
    email: "January 1st morning",
    social: "New Year's Eve and January 1st",
  },
};

// Summer Sale Template
export const summerSaleTemplate: MarketingCampaignTemplate = {
  id: "summer-sale",
  name: "Summer Sale",
  description: "Hot deals for the summer season",
  campaignType: "seasonal_holiday",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "Sun",
  estimatedReach: "medium",

  email: {
    subject: "Summer sale: {{discountPercent}}% off",
    previewText: "Hot sounds for the summer",
    body: `<p>Hey {{firstName}},</p>

<p>Summer is here - time to make some heat.</p>

<p>I'm running a <strong>Summer Sale</strong> on everything in my store.</p>

<p><strong>{{discountPercent}}% OFF</strong> all sample packs, presets, and courses.</p>

<p>Use code: <strong>{{discountCode}}</strong></p>

<p>Whether you're posting up in the studio or taking your laptop to the beach, here's what's perfect for summer production:</p>

<ul>
  <li>{{featured1}}</li>
  <li>{{featured2}}</li>
  <li>{{featured3}}</li>
</ul>

<p style="margin: 24px 0;">
  <a href="{{storeUrl}}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Shop Summer Sale</a>
</p>

<p>Stay cool, make heat,<br>{{creatorName}}</p>`,
    ctaText: "Shop Summer Sale",
    ctaUrl: "{{storeUrl}}",
  },

  instagram: {
    caption: `SUMMER SALE

{{discountPercent}}% off everything.

Perfect time to stock up on new sounds while the deals are hot.

Code: {{discountCode}}

What are you working on this summer? Drop it in the comments.

Link in bio.`,
    hashtags: [
      "summersale", "summer", "musicproducer", "beatmaker",
      "producerlife", "summervibes", "musicproduction", "producer",
      "studiolife", "sale"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `Summer sale

{{discountPercent}}% off everything

Code: {{discountCode}}

What's your summer production goal?

{{storeUrl}}`,
    hashtags: ["summersale", "producer"],
  },

  facebook: {
    post: `SUMMER SALE

The deals are hot this summer.

{{discountPercent}}% off all sample packs, presets, and courses.

Use code: {{discountCode}}

Perfect time to stock up on new sounds.

What are you producing this summer?

{{storeUrl}}`,
    callToAction: "Shop the Sale",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Summer sale: {{discountPercent}}% off all production resources.

A great time to invest in new tools for your summer projects.

Use code {{discountCode}} at {{storeUrl}}`,
    hashtags: ["SummerSale", "MusicProduction"],
    professionalAngle: "Seasonal professional investment",
  },

  tiktok: {
    caption: `Summer sale. {{discountPercent}}% off. Code: {{discountCode}}. Link in bio.`,
    hashtags: ["summersale", "producertok", "musicproducer", "fyp", "summer"],
    hookLine: "Summer sale on all my sounds and courses",
  },

  variables: [
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "25" },
    { key: "{{discountCode}}", label: "Discount Code", type: "text", required: true, defaultValue: "SUMMER" },
    { key: "{{featured1}}", label: "Featured Item 1", type: "text", required: true },
    { key: "{{featured2}}", label: "Featured Item 2", type: "text", required: true },
    { key: "{{featured3}}", label: "Featured Item 3", type: "text", required: true },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: true },
  ],

  recommendedTiming: {
    email: "Late June or early July",
    social: "Throughout summer",
  },
};

// Anniversary / Birthday Template
export const anniversaryTemplate: MarketingCampaignTemplate = {
  id: "anniversary-birthday",
  name: "Anniversary / Birthday Sale",
  description: "Celebrate your store or brand anniversary",
  campaignType: "seasonal_holiday",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "Cake",
  estimatedReach: "medium",

  email: {
    subject: "{{years}} years! {{discountPercent}}% off to celebrate",
    previewText: "It's our anniversary",
    body: `<p>Hey {{firstName}},</p>

<p><strong>{{years}} YEARS!</strong></p>

<p>I can't believe it's been {{years}} years since I started this journey.</p>

<p>From {{startingPoint}} to now, it's been an incredible ride. And YOU - my community - are the reason I'm still here doing what I love.</p>

<p>To celebrate, I'm giving you <strong>{{discountPercent}}% off</strong> everything in my store for the next 48 hours.</p>

<p>Use code: <strong>{{discountCode}}</strong></p>

<p><strong>Some highlights from {{years}} years:</strong></p>
<ul>
  <li>{{milestone1}}</li>
  <li>{{milestone2}}</li>
  <li>{{milestone3}}</li>
</ul>

<p style="margin: 24px 0;">
  <a href="{{storeUrl}}" style="display: inline-block; background-color: #ec4899; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Celebrate With Me</a>
</p>

<p>Thank you for being part of this journey.</p>

<p>Here's to {{years}} more,<br>{{creatorName}}</p>`,
    ctaText: "Celebrate With Me",
    ctaUrl: "{{storeUrl}}",
  },

  instagram: {
    caption: `{{years}} YEARS

Can't believe it's been {{years}} years since I started this.

From {{startingPoint}} to now - what a journey.

To celebrate, I'm giving you {{discountPercent}}% off everything for the next 48 hours.

Code: {{discountCode}}

Thank you for being part of this community. Seriously.

Link in bio.`,
    hashtags: [
      "anniversary", "celebration", "musicproducer", "beatmaker",
      "thankyou", "producerlife", "milestone", "musicproduction",
      "community", "grateful"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `{{years}} years of making sounds and building this community.

Thank you for being here.

{{discountPercent}}% off everything for 48 hours.

Code: {{discountCode}}

{{storeUrl}}`,
    hashtags: ["anniversary", "thankyou"],
  },

  facebook: {
    post: `{{years}} YEARS!

Can't believe it's been {{years}} years since I started this journey.

From {{startingPoint}} to now - it's been incredible. And you - this community - are the reason I keep going.

To celebrate, {{discountPercent}}% off everything for 48 hours. Use code {{discountCode}}.

Some milestones from {{years}} years:
• {{milestone1}}
• {{milestone2}}
• {{milestone3}}

Thank you for being part of this.

{{storeUrl}}`,
    callToAction: "Celebrate With Me",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Celebrating {{years}} years in the music production education space.

From {{startingPoint}} to building a community of thousands of producers - it's been an incredible journey.

Thank you to everyone who has been part of this growth.

To mark the occasion: {{discountPercent}}% off all resources for 48 hours.

{{storeUrl}}`,
    hashtags: ["Anniversary", "MusicProduction", "Milestone"],
    professionalAngle: "Business milestone celebration",
  },

  tiktok: {
    caption: `{{years}} years! {{discountPercent}}% off everything to celebrate. Thank you for being here.`,
    hashtags: ["anniversary", "producertok", "musicproducer", "fyp", "thankyou"],
    hookLine: "I just hit a big milestone and I want to celebrate with you",
  },

  variables: [
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{years}}", label: "Number of Years", type: "text", required: true },
    { key: "{{startingPoint}}", label: "Where You Started", type: "text", required: true, placeholder: "making beats in my bedroom" },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "30" },
    { key: "{{discountCode}}", label: "Discount Code", type: "text", required: true, defaultValue: "ANNIVERSARY" },
    { key: "{{milestone1}}", label: "Milestone 1", type: "text", required: true },
    { key: "{{milestone2}}", label: "Milestone 2", type: "text", required: true },
    { key: "{{milestone3}}", label: "Milestone 3", type: "text", required: true },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: true },
  ],

  recommendedTiming: {
    email: "Morning of anniversary date",
    social: "Day before and day of anniversary",
  },
};

// Back to School Template
export const backToSchoolTemplate: MarketingCampaignTemplate = {
  id: "back-to-school",
  name: "Back to School Sale",
  description: "Fall learning season promotion",
  campaignType: "seasonal_holiday",
  productTypes: ["course", "sample_pack", "preset_pack", "bundle"],
  icon: "BookOpen",
  estimatedReach: "medium",

  email: {
    subject: "Back to school: {{discountPercent}}% off courses",
    previewText: "Time to level up your skills",
    body: `<p>Hey {{firstName}},</p>

<p>School's back in session - and that includes producer school.</p>

<p>Whether you're a student producer or just getting back into learning mode, now's the perfect time to level up your skills.</p>

<p><strong>{{discountPercent}}% OFF</strong> all courses and educational resources.</p>

<p>Use code: <strong>{{discountCode}}</strong></p>

<p><strong>What you can learn:</strong></p>
<ul>
  <li>{{topic1}}</li>
  <li>{{topic2}}</li>
  <li>{{topic3}}</li>
</ul>

<p>No homework. No tests. Just practical skills you can use in your productions today.</p>

<p style="margin: 24px 0;">
  <a href="{{storeUrl}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Start Learning</a>
</p>

<p>Class is in session,<br>{{creatorName}}</p>`,
    ctaText: "Start Learning",
    ctaUrl: "{{storeUrl}}",
  },

  instagram: {
    caption: `BACK TO SCHOOL

Not that kind of school - producer school.

{{discountPercent}}% off all courses and educational resources.

Code: {{discountCode}}

What production skill do you want to learn this fall? Drop it in the comments.

Link in bio.`,
    hashtags: [
      "backtoschool", "learning", "musicproducer", "producerlife",
      "musicproduction", "producer", "musiccourse", "learnmusic",
      "producereducation", "fall"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `Back to school - producer edition.

{{discountPercent}}% off all courses.

Code: {{discountCode}}

What skill are you learning this fall?

{{storeUrl}}`,
    hashtags: ["backtoschool", "producer"],
  },

  facebook: {
    post: `BACK TO SCHOOL SALE

Time to get back into learning mode.

{{discountPercent}}% off all courses and educational resources.

What you can learn:
• {{topic1}}
• {{topic2}}
• {{topic3}}

Use code: {{discountCode}}

What production skill do you want to master this fall?

{{storeUrl}}`,
    callToAction: "Start Learning",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Back to school season - a perfect time to invest in professional development.

{{discountPercent}}% off all music production courses and educational resources.

Topics include:
• {{topic1}}
• {{topic2}}
• {{topic3}}

Use code {{discountCode}} at {{storeUrl}}`,
    hashtags: ["BackToSchool", "ProfessionalDevelopment", "MusicProduction"],
    professionalAngle: "Professional skill development",
  },

  tiktok: {
    caption: `Back to school sale. {{discountPercent}}% off courses. Time to level up your production skills.`,
    hashtags: ["backtoschool", "producertok", "musicproducer", "fyp", "learning"],
    hookLine: "Back to school but make it producer school",
  },

  variables: [
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "25" },
    { key: "{{discountCode}}", label: "Discount Code", type: "text", required: true, defaultValue: "BACKTOSCHOOL" },
    { key: "{{topic1}}", label: "Course Topic 1", type: "text", required: true },
    { key: "{{topic2}}", label: "Course Topic 2", type: "text", required: true },
    { key: "{{topic3}}", label: "Course Topic 3", type: "text", required: true },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: true },
  ],

  recommendedTiming: {
    email: "Late August / Early September",
    social: "Back to school season",
  },
};

// Export all seasonal/holiday templates
export const seasonalHolidayTemplates: MarketingCampaignTemplate[] = [
  blackFridayTemplate,
  newYearSaleTemplate,
  summerSaleTemplate,
  anniversaryTemplate,
  backToSchoolTemplate,
];
