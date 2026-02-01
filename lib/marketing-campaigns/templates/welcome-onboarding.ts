import { MarketingCampaignTemplate, musicProducerHashtags } from "../types";

// New Subscriber Welcome Template
export const newSubscriberWelcomeTemplate: MarketingCampaignTemplate = {
  id: "new-subscriber-welcome",
  name: "New Subscriber Welcome",
  description: "First touchpoint for new email subscribers",
  campaignType: "welcome_onboarding",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "Heart",
  estimatedReach: "high",

  email: {
    subject: "Welcome to the fam",
    previewText: "Let's make some music together",
    body: `<p>Hey {{firstName}},</p>

<p>Welcome! I'm {{creatorName}}, and I'm stoked you're here.</p>

<p>A little about me: {{aboutMe}}</p>

<p>Here's what you can expect from me:</p>
<ul>
  <li>{{benefit1}}</li>
  <li>{{benefit2}}</li>
  <li>{{benefit3}}</li>
</ul>

<p>To get you started, here's a quick tip: {{quickTip}}</p>

<p>Reply to this email and tell me - what are you working on right now?</p>

<p>Let's make some heat,<br>{{creatorName}}</p>

<p>P.S. Follow me on <a href="{{instagramUrl}}">Instagram</a> for daily tips and behind-the-scenes content.</p>`,
    ctaText: "Check out my store",
    ctaUrl: "{{storeUrl}}",
  },

  instagram: {
    caption: `New subscribers joining every day. Welcome to the fam!

If you're new here:
• I share production tips and tutorials
• I release sample packs and presets
• I'm here to help you level up

Drop a wave in the comments if you're new.

What genre do you produce?`,
    hashtags: [...musicProducerHashtags.general.slice(0, 10), "welcome", "newhere"],
    callToAction: "Follow for more",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `New to my community? Welcome!

Here's what I'm about:
- Production tips
- Free resources
- Sample packs & courses

What are you working on?`,
    hashtags: ["producer", "welcome"],
  },

  facebook: {
    post: `Welcome to everyone who just joined!

I'm {{creatorName}}, and I share production tips, tutorials, and resources for music producers.

Drop a comment and introduce yourself - what genre do you produce?`,
    callToAction: "Say hi",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Growing this community of music producers every day.

If you're new here, welcome! I share insights on music production, sound design, and building a career in audio.

What brings you to music production?`,
    hashtags: ["MusicProduction", "Community", "Welcome"],
    professionalAngle: "Community building focus",
  },

  tiktok: {
    caption: `Welcome to everyone new here! What genre do you produce? Comment below.`,
    hashtags: ["producertok", "musicproducer", "welcome", "fyp"],
    hookLine: "If you're new here let me tell you what this channel is about",
  },

  variables: [
    { key: "{{firstName}}", label: "Subscriber First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{aboutMe}}", label: "About You (1 sentence)", type: "text", required: true, placeholder: "I'm a producer and sound designer with 10 years of experience" },
    { key: "{{benefit1}}", label: "What They'll Get 1", type: "text", required: true, defaultValue: "Weekly production tips" },
    { key: "{{benefit2}}", label: "What They'll Get 2", type: "text", required: true, defaultValue: "Exclusive discounts" },
    { key: "{{benefit3}}", label: "What They'll Get 3", type: "text", required: true, defaultValue: "Free sample packs" },
    { key: "{{quickTip}}", label: "Quick Production Tip", type: "text", required: true },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: false },
    { key: "{{instagramUrl}}", label: "Instagram URL", type: "url", required: false },
  ],

  recommendedTiming: {
    email: "Immediately after signup",
    social: "General welcome post (not individual)",
  },
};

// Free Download Delivery Template
export const freeDownloadDeliveryTemplate: MarketingCampaignTemplate = {
  id: "free-download-delivery",
  name: "Free Download Delivery",
  description: "Deliver lead magnet and start relationship",
  campaignType: "welcome_onboarding",
  productTypes: ["sample_pack", "preset_pack"],
  icon: "Download",
  estimatedReach: "high",

  email: {
    subject: "Your free {{freebieName}} is ready",
    previewText: "Download link inside",
    body: `<p>Hey {{firstName}},</p>

<p>Thanks for grabbing the <strong>{{freebieName}}</strong>!</p>

<p style="margin: 24px 0;">
  <a href="{{downloadUrl}}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Download Now</a>
</p>

<p><strong>What's inside:</strong></p>
<ul>
  <li>{{item1}}</li>
  <li>{{item2}}</li>
  <li>{{item3}}</li>
</ul>

<p>If you like this, you'll love my full packs. Check them out at {{storeUrl}}.</p>

<p>Happy producing,<br>{{creatorName}}</p>

<p style="color: #6b7280; font-size: 12px;">P.S. If you have any issues downloading, just reply to this email.</p>`,
    ctaText: "Download Now",
    ctaUrl: "{{downloadUrl}}",
  },

  instagram: {
    caption: `FREE {{freebieName}} just dropped.

What's inside:
• {{item1}}
• {{item2}}
• {{item3}}

Link in bio to grab it. No strings attached.

Save this post so you don't forget.`,
    hashtags: ["freesounds", "freesamples", "musicproducer", "beatmaker", "producerlife", "freebie", "samples", "drums", "sounds", "producer"],
    callToAction: "Link in bio",
    suggestedImageStyle: "carousel",
  },

  twitter: {
    tweet: `FREE: {{freebieName}}

• {{item1}}
• {{item2}}
• {{item3}}

Grab it here: {{downloadUrl}}`,
    hashtags: ["free", "producer"],
  },

  facebook: {
    post: `Just dropped a FREE {{freebieName}} for you all.

What's inside:
• {{item1}}
• {{item2}}
• {{item3}}

No catch. Just grab it and make some music.

{{downloadUrl}}`,
    callToAction: "Download Free",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Sharing a free resource for producers: {{freebieName}}

Includes {{item1}}, {{item2}}, and {{item3}}.

Download at {{downloadUrl}}`,
    hashtags: ["FreeResources", "MusicProduction"],
    professionalAngle: "Free professional resource",
  },

  tiktok: {
    caption: `Free {{freebieName}}. Link in bio. You're welcome.`,
    hashtags: ["free", "freesamples", "producertok", "fyp"],
    hookLine: "Here's a free pack I just made for you",
  },

  variables: [
    { key: "{{freebieName}}", label: "Freebie Name", type: "text", required: true, placeholder: "Drum Kit" },
    { key: "{{downloadUrl}}", label: "Download URL", type: "url", required: true },
    { key: "{{item1}}", label: "What's Included 1", type: "text", required: true },
    { key: "{{item2}}", label: "What's Included 2", type: "text", required: true },
    { key: "{{item3}}", label: "What's Included 3", type: "text", required: true },
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: false },
  ],

  recommendedTiming: {
    email: "Immediately after opt-in",
    social: "When promoting the freebie",
  },
};

// Get to Know You Template
export const getToKnowYouTemplate: MarketingCampaignTemplate = {
  id: "get-to-know-you",
  name: "Get to Know You",
  description: "Personal story to build connection",
  campaignType: "welcome_onboarding",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "User",
  estimatedReach: "medium",

  email: {
    subject: "My story (and why I do this)",
    previewText: "The real reason I started making music",
    body: `<p>Hey {{firstName}},</p>

<p>I wanted to share my story with you.</p>

<p>{{storyPart1}}</p>

<p>{{storyPart2}}</p>

<p>{{storyPart3}}</p>

<p>That's why I create these resources - to help producers like you avoid the struggles I went through.</p>

<p>What's your story? I'd love to hear it. Just hit reply.</p>

<p>{{creatorName}}</p>`,
    ctaText: "Reply and share",
    ctaUrl: "",
  },

  instagram: {
    caption: `Story time.

{{shortStory}}

This is why I do what I do. Making music saved me, and now I want to help other producers on their journey.

What's your story? Drop it in the comments.`,
    hashtags: ["mystory", "producerlife", "musicproducer", "behindthescenes", "journey", "motivation", "producerstory"],
    callToAction: "Comment your story",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `How I started making beats:

{{shortStory}}

What's your origin story?`,
    hashtags: ["producerstory"],
  },

  facebook: {
    post: `I don't usually get personal, but I wanted to share my story with you.

{{storyPart1}}

{{storyPart2}}

{{storyPart3}}

That's why I create resources for producers - to help you avoid the struggles I went through.

What's your production journey been like?`,
    callToAction: "Share your story",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `My journey in music production:

{{storyPart1}}

{{storyPart2}}

This experience shaped my mission to help other producers succeed.

What brought you to music production?`,
    hashtags: ["MyStory", "MusicProduction", "Journey"],
    professionalAngle: "Professional journey narrative",
  },

  tiktok: {
    caption: `How I started making music. What's your story?`,
    hashtags: ["storytime", "producertok", "mystory", "fyp"],
    hookLine: "Let me tell you how I started making beats",
  },

  variables: [
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{storyPart1}}", label: "Story Beginning", type: "text", required: true, placeholder: "I started making beats in my bedroom when I was 16..." },
    { key: "{{storyPart2}}", label: "Story Middle", type: "text", required: true, placeholder: "For years I struggled with..." },
    { key: "{{storyPart3}}", label: "Story End", type: "text", required: true, placeholder: "Now I've produced for... and learned..." },
    { key: "{{shortStory}}", label: "Short Story (for social)", type: "text", required: true, placeholder: "Started in my bedroom with a cracked DAW. Now I..." },
  ],

  recommendedTiming: {
    email: "Day 3-5 after signup",
    social: "Any time - great for engagement",
  },
};

// Export all welcome/onboarding templates
export const welcomeOnboardingTemplates: MarketingCampaignTemplate[] = [
  newSubscriberWelcomeTemplate,
  freeDownloadDeliveryTemplate,
  getToKnowYouTemplate,
];
