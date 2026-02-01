import { MarketingCampaignTemplate, musicProducerHashtags } from "../types";

// Win-Back Inactive Subscriber Template
export const winBackInactiveTemplate: MarketingCampaignTemplate = {
  id: "win-back-inactive",
  name: "Win-Back Inactive Subscriber",
  description: "Re-engage subscribers who haven't opened emails recently",
  campaignType: "reengagement",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "UserX",
  estimatedReach: "medium",

  email: {
    subject: "Still interested in making music?",
    previewText: "It's been a while - let's catch up",
    body: `<p>Hey {{firstName}},</p>

<p>It's been a while since we connected.</p>

<p>I noticed you haven't opened my emails recently, and I wanted to check in - are you still making music?</p>

<p>If things have gotten busy, I totally get it. Life happens.</p>

<p>But if you're still working on your production skills, I've got some new stuff I think you'd love:</p>

<ul>
  <li>{{update1}}</li>
  <li>{{update2}}</li>
  <li>{{update3}}</li>
</ul>

<p>As a "welcome back" gift, here's <strong>{{discountPercent}}% off</strong> anything in my store. Use code: <strong>{{discountCode}}</strong></p>

<p style="margin: 24px 0;">
  <a href="{{storeUrl}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Check What's New</a>
</p>

<p>If you're not interested in production anymore, no worries - just hit unsubscribe below. No hard feelings.</p>

<p>Hope to hear from you,<br>{{creatorName}}</p>`,
    ctaText: "Check What's New",
    ctaUrl: "{{storeUrl}}",
  },

  instagram: {
    caption: `Haven't heard from some of you in a while.

If you've been MIA from production, this is your sign to get back in the studio.

No judgment. Life gets busy. But those beats aren't going to make themselves.

What's stopping you from making music right now? Drop it in the comments and let's problem-solve together.`,
    hashtags: [
      "producerlife", "beatmaker", "musicproducer", "studiotime",
      "makingbeats", "producermotivation", "getbacktowork", "musicproduction",
      "producer", "beats", "motivation", "letsgo"
    ],
    callToAction: "Comment what's holding you back",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `Been quiet lately?

No judgment. But if you've been away from production, this is your sign to get back in the studio today.

Even 15 minutes counts.

What's one thing you're going to work on?`,
    hashtags: ["producerlife", "motivation"],
  },

  facebook: {
    post: `Hey everyone - I know some of you have been away from production for a while.

Life gets busy. I get it.

But if you've been wanting to get back into making music, now's the time. Don't wait for the "perfect" moment.

What's one thing you could work on today - even just for 15 minutes?

Drop it in the comments. Let's hold each other accountable.`,
    callToAction: "Share your plan",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `A message to any music producers who've stepped away from their craft:

It's never too late to get back in the studio.

The skills you've built don't disappear. The passion that drove you to start is still there.

Sometimes we need a break. But when you're ready, your DAW will be waiting.

What's bringing you back to music production?`,
    hashtags: ["MusicProduction", "Creativity", "Comeback"],
    professionalAngle: "Motivation and creative renewal",
  },

  tiktok: {
    caption: `This is for everyone who hasn't opened their DAW in months. It's time to come back.`,
    hashtags: ["producertok", "musicproducer", "motivation", "fyp", "comeback"],
    hookLine: "If you haven't made music in months, this video is for you",
  },

  variables: [
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{update1}}", label: "What's New 1", type: "text", required: true, placeholder: "New sample pack released" },
    { key: "{{update2}}", label: "What's New 2", type: "text", required: true, placeholder: "Free tutorial series started" },
    { key: "{{update3}}", label: "What's New 3", type: "text", required: true, placeholder: "Exclusive community launched" },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "20" },
    { key: "{{discountCode}}", label: "Discount Code", type: "text", required: true, defaultValue: "WELCOMEBACK" },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: true },
  ],

  recommendedTiming: {
    email: "Send to subscribers inactive 30+ days",
    social: "General motivation post",
  },
};

// "We Miss You" + Discount Template
export const weMissYouTemplate: MarketingCampaignTemplate = {
  id: "we-miss-you",
  name: "We Miss You + Discount",
  description: "Friendly reconnection with incentive to return",
  campaignType: "reengagement",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "Heart",
  estimatedReach: "medium",

  email: {
    subject: "We miss you (+ a gift inside)",
    previewText: "It's been too long",
    body: `<p>Hey {{firstName}},</p>

<p>I'll keep this short:</p>

<p><strong>I miss having you around.</strong></p>

<p>It's been {{daysSinceActive}} days since you last engaged with my content, and I wanted to reach out.</p>

<p>I've been working on some new stuff that I think you'd really enjoy:</p>

<p><strong>{{newProductName}}</strong> - {{newProductDescription}}</p>

<p>To welcome you back, I'm giving you <strong>{{discountPercent}}% off</strong> your next purchase. No strings attached.</p>

<p style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
  <strong>Use code: {{discountCode}}</strong><br>
  Valid for the next 7 days
</p>

<p style="margin: 24px 0;">
  <a href="{{storeUrl}}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Come Back & Save</a>
</p>

<p>Hope to see you soon,<br>{{creatorName}}</p>

<p style="color: #6b7280; font-size: 12px;">P.S. If production isn't your thing anymore, that's totally cool - just let me know and I'll stop emailing.</p>`,
    ctaText: "Come Back & Save",
    ctaUrl: "{{storeUrl}}",
  },

  instagram: {
    caption: `To everyone who's been following for a while:

Thank you. Seriously.

Whether you're active every day or just lurking in the background, I appreciate you being here.

For the lurkers - drop an emoji if you're still with me. Let me know you're out there.

{{discountPercent}}% off everything this week as a thank you. Link in bio.`,
    hashtags: [
      "thankyou", "community", "musicproducer", "producerlife",
      "appreciation", "producer", "beatmaker", "supportlocal",
      "musiccommunity", "grateful"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `Quick appreciation post for everyone who follows me:

Thank you for being here.

Whether you engage every day or just lurk - I see you.

{{discountPercent}}% off everything this week: {{storeUrl}}`,
    hashtags: ["thankyou", "producer"],
  },

  facebook: {
    post: `A quick note to this community:

Thank you for being here.

Some of you have been following since the beginning. Some of you just found me. Either way, I appreciate you.

As a thank you, take {{discountPercent}}% off anything in my store this week. Use code {{discountCode}}.

{{storeUrl}}

What would you like to see more of from me? Let me know in the comments.`,
    callToAction: "Visit Store",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Grateful for this community of music producers and audio professionals.

Whether you've been following my work for years or just connected recently, thank you for being here.

For those looking to expand their production toolkit, I'm offering {{discountPercent}}% off my resources this week.

{{storeUrl}}`,
    hashtags: ["Community", "MusicProduction", "Gratitude"],
    professionalAngle: "Community appreciation",
  },

  tiktok: {
    caption: `Thank you to everyone who's been rocking with me. {{discountPercent}}% off this week. Link in bio.`,
    hashtags: ["thankyou", "producertok", "fyp", "appreciation"],
    hookLine: "This is a thank you to everyone who's been following me",
  },

  variables: [
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{daysSinceActive}}", label: "Days Since Active", type: "text", required: false, defaultValue: "30" },
    { key: "{{newProductName}}", label: "New Product Name", type: "text", required: true },
    { key: "{{newProductDescription}}", label: "Product Description (1 line)", type: "text", required: true },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "25" },
    { key: "{{discountCode}}", label: "Discount Code", type: "text", required: true, defaultValue: "MISSYOU" },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: true },
  ],

  recommendedTiming: {
    email: "Send to subscribers inactive 60+ days",
    social: "General appreciation post",
  },
};

// Export all reengagement templates
export const reengagementTemplates: MarketingCampaignTemplate[] = [
  winBackInactiveTemplate,
  weMissYouTemplate,
];
