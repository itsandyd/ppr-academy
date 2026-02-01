import { MarketingCampaignTemplate, musicProducerHashtags } from "../types";

// Sample Pack Launch Template
export const samplePackLaunchTemplate: MarketingCampaignTemplate = {
  id: "sample-pack-launch",
  name: "Sample Pack Launch",
  description: "Complete multi-platform campaign for launching a new sample pack",
  campaignType: "product_launch",
  productTypes: ["sample_pack"],
  icon: "Music",
  estimatedReach: "high",

  email: {
    subject: "NEW: {{productName}} just dropped",
    previewText: "Fresh sounds for your next hit",
    body: `<p>Hey {{firstName}},</p>

<p>I've been cooking up something special, and it's finally ready.</p>

<p><strong>Introducing {{productName}}</strong></p>

<p>What's inside:</p>
<ul>
  <li>{{soundCount}} drums, loops, and one-shots</li>
  <li>Key and BPM labeled for easy mixing</li>
  <li>100% royalty-free for commercial use</li>
</ul>

<p>Every sound is mixed, processed, and ready to drop straight into your DAW.</p>

<p><strong>Launch special:</strong> {{discountPercent}}% off for the next 48 hours.</p>

<p style="margin: 24px 0;">
  <a href="{{productUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get the Pack</a>
</p>

<p>Let's make some heat,<br>{{creatorName}}</p>`,
    ctaText: "Get the Pack",
    ctaUrl: "{{productUrl}}",
  },

  instagram: {
    caption: `NEW DROP: {{productName}} is here.

{{soundCount}} sounds crafted for {{genre}} producers. Every loop, every drum, every texture - designed to make your tracks stand out.

This is what I've been working on for the past few months. Finally ready to share it with you.

Launch discount: {{discountPercent}}% off for 48 hours only.

Link in bio to grab it now.

What sound are you working on right now? Drop a comment.`,
    hashtags: [
      ...musicProducerHashtags.general.slice(0, 8),
      ...musicProducerHashtags.hiphop.slice(0, 4),
      ...musicProducerHashtags.daw.slice(0, 4),
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "carousel",
  },

  twitter: {
    tweet: `NEW: {{productName}} just dropped

{{soundCount}} sounds for {{genre}} producers
{{discountPercent}}% off for 48 hours

{{productUrl}}`,
    hashtags: ["beatmaker", "producer"],
  },

  facebook: {
    post: `I've been working on something special for the past few months, and it's finally ready.

Introducing {{productName}} - {{soundCount}} sounds crafted for {{genre}} producers.

Every loop, every drum, every texture is mixed and ready to drop straight into your DAW. 100% royalty-free.

Launch special: {{discountPercent}}% off for the next 48 hours only.

What's your current project? Let me know in the comments.

{{productUrl}}`,
    callToAction: "Get the Pack",
    suggestedImageStyle: "carousel",
  },

  linkedin: {
    post: `Excited to share my latest project with the music production community.

{{productName}} is now available - a collection of {{soundCount}} sounds designed for professional {{genre}} productions.

This project represents months of sound design work, focusing on:
• Industry-standard quality
• Immediate usability in productions
• Complete royalty-free licensing

For fellow producers and audio professionals, I'm offering a {{discountPercent}}% launch discount for the next 48 hours.

What production challenges are you currently working through?

{{productUrl}}`,
    hashtags: ["MusicProduction", "SoundDesign", "AudioProduction", "CreativeIndustry"],
    professionalAngle: "Position as professional resource for audio industry",
  },

  tiktok: {
    caption: `New pack just dropped. {{soundCount}} sounds for {{genre}} producers. Link in bio. {{discountPercent}}% off for 48 hours.`,
    hashtags: ["beatmaker", "producertok", "musicproducer", "makingbeats", "producerlife", "studiolife", "newmusic"],
    hookLine: "I just dropped my new sample pack and here's what's inside",
  },

  variables: [
    { key: "{{productName}}", label: "Product Name", type: "text", required: true, placeholder: "e.g., Midnight Drums Vol. 2" },
    { key: "{{productUrl}}", label: "Product URL", type: "url", required: true, placeholder: "https://yourstore.com/pack" },
    { key: "{{soundCount}}", label: "Number of Sounds", type: "number", required: true, defaultValue: "100+" },
    { key: "{{genre}}", label: "Genre/Style", type: "text", required: true, defaultValue: "hip-hop" },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: false, defaultValue: "25" },
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true, placeholder: "Your name or brand" },
  ],

  recommendedTiming: {
    email: "Day 1, 9:00 AM (local time)",
    social: "Day 1, 12:00 PM (highest engagement)",
    urgency: "Send reminder 24 hours before discount expires",
  },
};

// Course Launch Template
export const courseLaunchTemplate: MarketingCampaignTemplate = {
  id: "course-launch",
  name: "Course Launch",
  description: "Multi-platform campaign for launching a new course or masterclass",
  campaignType: "product_launch",
  productTypes: ["course", "masterclass"],
  icon: "GraduationCap",
  estimatedReach: "high",

  email: {
    subject: "Doors are open: {{courseName}}",
    previewText: "Enrollment is now open - limited spots available",
    body: `<p>Hey {{firstName}},</p>

<p>The wait is over. <strong>{{courseName}}</strong> is officially live.</p>

<p>This is the course I wish I had when I was starting out. After years of trial and error, I've packed everything I know into {{moduleCount}} comprehensive modules.</p>

<p><strong>What you'll learn:</strong></p>
<ul>
  <li>{{benefit1}}</li>
  <li>{{benefit2}}</li>
  <li>{{benefit3}}</li>
</ul>

<p><strong>Early bird special:</strong> Save {{discountPercent}}% when you enroll in the next 72 hours.</p>

<p style="margin: 24px 0;">
  <a href="{{courseUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Enroll Now</a>
</p>

<p>Ready to level up?<br>{{creatorName}}</p>`,
    ctaText: "Enroll Now",
    ctaUrl: "{{courseUrl}}",
  },

  instagram: {
    caption: `IT'S HERE. {{courseName}} is officially live.

{{moduleCount}} modules. Hours of content. Everything I know about {{topic}}.

This is the course I wish existed when I started. I've spent months putting this together so you don't have to make the same mistakes I did.

What you'll learn:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

Early bird pricing ends in 72 hours.

Link in bio to enroll.

Tag someone who needs to see this.`,
    hashtags: [
      "musicproduction", "producerlife", "learnmusic", "musiccourse",
      "producereducation", "beatmaking", "studiolife", "producertips",
      "musicproductiontips", "learntoproduce", "musicproducer", "producer"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "carousel",
  },

  twitter: {
    tweet: `{{courseName}} is officially live.

{{moduleCount}} modules covering everything I know about {{topic}}.

Early bird: {{discountPercent}}% off for 72 hours.

{{courseUrl}}`,
    hashtags: ["producer", "musicproduction"],
  },

  facebook: {
    post: `After months of work, I'm excited to announce that {{courseName}} is officially live.

This is the comprehensive course I wish existed when I was starting out. I've packed everything I know about {{topic}} into {{moduleCount}} modules.

What you'll learn:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

Early bird pricing is available for the next 72 hours - save {{discountPercent}}%.

Are you ready to level up your production skills?

{{courseUrl}}`,
    callToAction: "Enroll Now",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Thrilled to announce the launch of my comprehensive course: {{courseName}}

After years in the music production industry, I've distilled my knowledge into {{moduleCount}} structured modules covering {{topic}}.

Key learning outcomes:
• {{benefit1}}
• {{benefit2}}
• {{benefit3}}

For the next 72 hours, I'm offering an early bird discount of {{discountPercent}}% to those ready to invest in their production skills.

Whether you're looking to break into the industry or level up your existing skills, this course provides the foundation you need.

{{courseUrl}}`,
    hashtags: ["MusicEducation", "OnlineLearning", "MusicProduction", "ProfessionalDevelopment"],
    professionalAngle: "Frame as career investment and professional development",
  },

  tiktok: {
    caption: `My course is finally live. {{moduleCount}} modules on {{topic}}. Early bird discount in bio.`,
    hashtags: ["producertok", "musicproductiontips", "learnmusic", "producerlife", "musiccourse", "fyp"],
    hookLine: "I just launched my first course and here's what's inside",
  },

  variables: [
    { key: "{{courseName}}", label: "Course Name", type: "text", required: true, placeholder: "e.g., Mixing Masterclass" },
    { key: "{{courseUrl}}", label: "Course URL", type: "url", required: true, placeholder: "https://yourstore.com/course" },
    { key: "{{moduleCount}}", label: "Number of Modules", type: "number", required: true, defaultValue: "8" },
    { key: "{{topic}}", label: "Main Topic", type: "text", required: true, defaultValue: "mixing and mastering" },
    { key: "{{benefit1}}", label: "Key Benefit 1", type: "text", required: true, placeholder: "e.g., Master EQ and compression" },
    { key: "{{benefit2}}", label: "Key Benefit 2", type: "text", required: true, placeholder: "e.g., Create radio-ready mixes" },
    { key: "{{benefit3}}", label: "Key Benefit 3", type: "text", required: true, placeholder: "e.g., Develop your signature sound" },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: false, defaultValue: "30" },
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
  ],

  recommendedTiming: {
    email: "Day 1, 10:00 AM",
    social: "Day 1, 1:00 PM",
    urgency: "Send reminder 24 hours before early bird ends",
  },
};

// Preset Pack Launch Template
export const presetPackLaunchTemplate: MarketingCampaignTemplate = {
  id: "preset-pack-launch",
  name: "Preset Pack Launch",
  description: "Launch campaign for synth presets, effect chains, or DAW templates",
  campaignType: "product_launch",
  productTypes: ["preset_pack"],
  icon: "Sliders",
  estimatedReach: "medium",

  email: {
    subject: "{{presetCount}} new {{synthName}} presets just dropped",
    previewText: "Instant sound design - no programming required",
    body: `<p>Hey {{firstName}},</p>

<p>Tired of spending hours tweaking knobs?</p>

<p>I just released <strong>{{productName}}</strong> - {{presetCount}} carefully crafted {{synthName}} presets designed for {{genre}} producers.</p>

<p><strong>What's included:</strong></p>
<ul>
  <li>{{presetCount}} presets ready to use</li>
  <li>{{category1}} sounds</li>
  <li>{{category2}} sounds</li>
  <li>Macro controls for easy tweaking</li>
</ul>

<p>Just load, play, and create.</p>

<p><strong>Launch price:</strong> {{discountPercent}}% off for the first 48 hours.</p>

<p style="margin: 24px 0;">
  <a href="{{productUrl}}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get the Presets</a>
</p>

<p>Happy producing,<br>{{creatorName}}</p>`,
    ctaText: "Get the Presets",
    ctaUrl: "{{productUrl}}",
  },

  instagram: {
    caption: `NEW: {{productName}} for {{synthName}}

{{presetCount}} presets. Zero sound design required.

Every preset is:
• Production-ready
• Macro-mapped for easy tweaking
• Designed for {{genre}} producers

Stop spending hours on sound design. Start making music.

Launch price: {{discountPercent}}% off for 48 hours.

Link in bio.

What synth do you use the most? Comment below.`,
    hashtags: [
      "synthpresets", "serum", "massivepresets", "vitalpresets",
      "sounddesign", "musicproducer", "producerlife", "synth",
      "electronicmusic", "producertips", "beatmaker", "studiolife"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "carousel",
  },

  twitter: {
    tweet: `{{presetCount}} new {{synthName}} presets just dropped

{{productName}} - designed for {{genre}} producers

{{discountPercent}}% off for 48 hours

{{productUrl}}`,
    hashtags: ["presets", "sounddesign"],
  },

  facebook: {
    post: `Just released {{productName}} - {{presetCount}} {{synthName}} presets for {{genre}} producers.

Every preset is production-ready with macro controls for easy customization. No more spending hours on sound design when you could be making music.

What's inside:
• {{category1}} sounds
• {{category2}} sounds
• All presets macro-mapped

Launch special: {{discountPercent}}% off for the first 48 hours.

What sounds are you looking for in a preset pack?

{{productUrl}}`,
    callToAction: "Get the Presets",
    suggestedImageStyle: "carousel",
  },

  linkedin: {
    post: `Announcing the release of {{productName}} - a collection of {{presetCount}} professional {{synthName}} presets.

Designed for producers who want to spend less time on sound design and more time creating music.

Key features:
• Production-ready sounds
• Macro-mapped controls
• Optimized for {{genre}} productions

Available at an introductory price with {{discountPercent}}% off for 48 hours.

{{productUrl}}`,
    hashtags: ["SoundDesign", "MusicProduction", "AudioTools", "CreativeTools"],
    professionalAngle: "Position as time-saving professional tool",
  },

  tiktok: {
    caption: `{{presetCount}} {{synthName}} presets just dropped. {{discountPercent}}% off in bio.`,
    hashtags: ["synthpresets", "sounddesign", "producertok", "musicproducer", "serum", "vital"],
    hookLine: "I just made sound design 10x faster with these presets",
  },

  variables: [
    { key: "{{productName}}", label: "Product Name", type: "text", required: true, placeholder: "e.g., Future Bass Essentials" },
    { key: "{{productUrl}}", label: "Product URL", type: "url", required: true },
    { key: "{{synthName}}", label: "Synth Name", type: "text", required: true, defaultValue: "Serum" },
    { key: "{{presetCount}}", label: "Number of Presets", type: "number", required: true, defaultValue: "50" },
    { key: "{{genre}}", label: "Target Genre", type: "text", required: true, defaultValue: "electronic" },
    { key: "{{category1}}", label: "Sound Category 1", type: "text", required: true, defaultValue: "Leads and pads" },
    { key: "{{category2}}", label: "Sound Category 2", type: "text", required: true, defaultValue: "Basses and plucks" },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: false, defaultValue: "20" },
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
  ],

  recommendedTiming: {
    email: "Day 1, 11:00 AM",
    social: "Day 1, 2:00 PM",
  },
};

// Bundle Launch Template
export const bundleLaunchTemplate: MarketingCampaignTemplate = {
  id: "bundle-launch",
  name: "Bundle Launch",
  description: "Launch campaign for product bundles or masterclass packages",
  campaignType: "product_launch",
  productTypes: ["bundle", "masterclass"],
  icon: "Package",
  estimatedReach: "high",

  email: {
    subject: "The {{bundleName}} is here (save {{savingsAmount}})",
    previewText: "Everything you need in one package",
    body: `<p>Hey {{firstName}},</p>

<p>I've bundled together my best resources into one massive package.</p>

<p><strong>Introducing the {{bundleName}}</strong></p>

<p>What's included:</p>
<ul>
  <li>{{item1}}</li>
  <li>{{item2}}</li>
  <li>{{item3}}</li>
  <li>{{item4}}</li>
</ul>

<p><strong>Total value:</strong> {{totalValue}}<br>
<strong>Bundle price:</strong> {{bundlePrice}} (save {{savingsAmount}})</p>

<p>This is everything you need to {{mainBenefit}}.</p>

<p style="margin: 24px 0;">
  <a href="{{productUrl}}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get the Bundle</a>
</p>

<p>Let's level up together,<br>{{creatorName}}</p>`,
    ctaText: "Get the Bundle",
    ctaUrl: "{{productUrl}}",
  },

  instagram: {
    caption: `THE {{bundleName}} IS HERE.

Everything you need in one package:

✓ {{item1}}
✓ {{item2}}
✓ {{item3}}
✓ {{item4}}

Total value: {{totalValue}}
Your price: {{bundlePrice}}

That's {{savingsAmount}} in savings.

This bundle has everything you need to {{mainBenefit}}.

Link in bio. Limited time offer.

Tag a producer friend who needs this.`,
    hashtags: [
      "musicproducer", "beatmaker", "producerlife", "studioessentials",
      "producertools", "musicproduction", "makingbeats", "studiolife",
      "producer", "beats", "producerslife", "beatmaking"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "carousel",
  },

  twitter: {
    tweet: `The {{bundleName}} just dropped

{{item1}} + {{item2}} + more

Worth {{totalValue}} → Get it for {{bundlePrice}}

{{productUrl}}`,
    hashtags: ["producer", "bundle"],
  },

  facebook: {
    post: `I've put together the ultimate bundle for producers.

The {{bundleName}} includes:
• {{item1}}
• {{item2}}
• {{item3}}
• {{item4}}

Total value: {{totalValue}}
Bundle price: {{bundlePrice}} (save {{savingsAmount}})

This is everything you need to {{mainBenefit}}.

Who's ready to level up?

{{productUrl}}`,
    callToAction: "Get the Bundle",
    suggestedImageStyle: "carousel",
  },

  linkedin: {
    post: `Announcing the {{bundleName}} - a comprehensive package for serious music producers.

This bundle brings together:
• {{item1}}
• {{item2}}
• {{item3}}
• {{item4}}

Combined value of {{totalValue}}, available at {{bundlePrice}}.

For producers looking to {{mainBenefit}}, this bundle provides everything needed in one package.

{{productUrl}}`,
    hashtags: ["MusicProduction", "ProducerTools", "AudioProduction", "CreativeBundle"],
    professionalAngle: "Frame as comprehensive professional toolkit",
  },

  tiktok: {
    caption: `The {{bundleName}} is live. {{totalValue}} worth of content for {{bundlePrice}}. Link in bio.`,
    hashtags: ["producertok", "musicproducer", "bundle", "producerlife", "studioessentials"],
    hookLine: "I just bundled everything you need to level up as a producer",
  },

  variables: [
    { key: "{{bundleName}}", label: "Bundle Name", type: "text", required: true, placeholder: "e.g., Producer Starter Bundle" },
    { key: "{{productUrl}}", label: "Product URL", type: "url", required: true },
    { key: "{{item1}}", label: "Bundle Item 1", type: "text", required: true, placeholder: "e.g., Complete Drum Kit (500+ sounds)" },
    { key: "{{item2}}", label: "Bundle Item 2", type: "text", required: true, placeholder: "e.g., Mixing Course (8 modules)" },
    { key: "{{item3}}", label: "Bundle Item 3", type: "text", required: true, placeholder: "e.g., 50 Serum Presets" },
    { key: "{{item4}}", label: "Bundle Item 4", type: "text", required: true, placeholder: "e.g., Project File Templates" },
    { key: "{{totalValue}}", label: "Total Value", type: "price", required: true, placeholder: "e.g., $297" },
    { key: "{{bundlePrice}}", label: "Bundle Price", type: "price", required: true, placeholder: "e.g., $97" },
    { key: "{{savingsAmount}}", label: "Savings Amount", type: "price", required: true, placeholder: "e.g., $200" },
    { key: "{{mainBenefit}}", label: "Main Benefit", type: "text", required: true, defaultValue: "take your production to the next level" },
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
  ],

  recommendedTiming: {
    email: "Day 1, 9:00 AM",
    social: "Day 1, 12:00 PM",
    urgency: "Bundle pricing available for limited time",
  },
};

// Export all product launch templates
export const productLaunchTemplates: MarketingCampaignTemplate[] = [
  samplePackLaunchTemplate,
  courseLaunchTemplate,
  presetPackLaunchTemplate,
  bundleLaunchTemplate,
];
