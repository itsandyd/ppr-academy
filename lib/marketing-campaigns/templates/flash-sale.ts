import { MarketingCampaignTemplate, musicProducerHashtags } from "../types";

// 24-Hour Flash Sale Template
export const flashSale24HourTemplate: MarketingCampaignTemplate = {
  id: "flash-sale-24hr",
  name: "24-Hour Flash Sale",
  description: "Urgent limited-time promotion for maximum conversions",
  campaignType: "flash_sale",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "Zap",
  estimatedReach: "high",

  email: {
    subject: "{{discountPercent}}% OFF - 24 hours only",
    previewText: "This deal disappears at midnight",
    body: `<p>Hey {{firstName}},</p>

<p><strong>24 HOURS ONLY.</strong></p>

<p>I'm running a flash sale on {{productName}} - and it ends at midnight.</p>

<p style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
  <strong>{{discountPercent}}% OFF</strong><br>
  Regular price: <s>{{originalPrice}}</s><br>
  Flash sale price: <strong>{{salePrice}}</strong>
</p>

<p>This is the lowest price I've ever offered on this. No code needed - the discount is applied automatically.</p>

<p style="margin: 24px 0;">
  <a href="{{productUrl}}" style="display: inline-block; background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Grab the Deal</a>
</p>

<p>Sale ends: {{saleEndTime}}</p>

<p>Don't sleep on this one,<br>{{creatorName}}</p>`,
    ctaText: "Grab the Deal",
    ctaUrl: "{{productUrl}}",
  },

  instagram: {
    caption: `FLASH SALE - 24 HOURS ONLY

{{discountPercent}}% OFF {{productName}}

Regular: {{originalPrice}}
Today: {{salePrice}}

This is the biggest discount I've ever offered. No code needed.

Sale ends at midnight.

Link in bio. Don't miss this one.`,
    hashtags: [
      "flashsale", "limitedtime", "musicproducer", "beatmaker",
      "producerlife", "salealert", "musicproduction", "studiolife",
      "producer", "beats", "dealoftheday", "producersale"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `FLASH SALE - 24 HOURS

{{discountPercent}}% off {{productName}}

{{originalPrice}} → {{salePrice}}

Ends at midnight. No code needed.

{{productUrl}}`,
    hashtags: ["flashsale"],
  },

  facebook: {
    post: `24-HOUR FLASH SALE

{{discountPercent}}% off {{productName}}

Regular price: {{originalPrice}}
Flash sale price: {{salePrice}}

This is the lowest price I've ever offered. The discount is applied automatically - no code needed.

Sale ends at midnight. Don't miss it.

{{productUrl}}`,
    callToAction: "Grab the Deal",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Limited-time offer for music producers:

{{productName}} is {{discountPercent}}% off for the next 24 hours.

Regular: {{originalPrice}} → Sale: {{salePrice}}

This is a rare opportunity to access professional-grade resources at a significant discount.

{{productUrl}}`,
    hashtags: ["MusicProduction", "FlashSale", "ProducerTools"],
    professionalAngle: "Frame as professional investment opportunity",
  },

  tiktok: {
    caption: `24 HOUR FLASH SALE. {{discountPercent}}% off everything. Link in bio. Ends at midnight.`,
    hashtags: ["flashsale", "producertok", "musicproducer", "salealert"],
    hookLine: "I'm running the biggest sale I've ever done and it ends in 24 hours",
  },

  variables: [
    { key: "{{productName}}", label: "Product Name", type: "text", required: true },
    { key: "{{productUrl}}", label: "Product URL", type: "url", required: true },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "50" },
    { key: "{{originalPrice}}", label: "Original Price", type: "price", required: true, placeholder: "$49" },
    { key: "{{salePrice}}", label: "Sale Price", type: "price", required: true, placeholder: "$24" },
    { key: "{{saleEndTime}}", label: "Sale End Time", type: "text", required: true, defaultValue: "Midnight EST" },
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
  ],

  recommendedTiming: {
    email: "Morning of sale day, 9:00 AM",
    social: "Throughout the day - post 3x",
    urgency: "Send final reminder 3 hours before sale ends",
  },
};

// Weekend Sale Template
export const weekendSaleTemplate: MarketingCampaignTemplate = {
  id: "weekend-sale",
  name: "Weekend Sale",
  description: "Friday-Sunday promotion for weekend shoppers",
  campaignType: "flash_sale",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "Calendar",
  estimatedReach: "medium",

  email: {
    subject: "Weekend sale: {{discountPercent}}% off (ends Sunday)",
    previewText: "Your weekend just got better",
    body: `<p>Hey {{firstName}},</p>

<p>It's the weekend - time to make some music.</p>

<p>To help you out, I'm running a <strong>weekend sale</strong> on {{productName}}.</p>

<p><strong>{{discountPercent}}% OFF</strong> through Sunday at midnight.</p>

<p>Use code: <strong>{{discountCode}}</strong></p>

<p style="margin: 24px 0;">
  <a href="{{productUrl}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Shop the Sale</a>
</p>

<p>Have a creative weekend,<br>{{creatorName}}</p>`,
    ctaText: "Shop the Sale",
    ctaUrl: "{{productUrl}}",
  },

  instagram: {
    caption: `WEEKEND SALE

{{discountPercent}}% off {{productName}} through Sunday.

Code: {{discountCode}}

Perfect time to grab those sounds you've been eyeing.

Link in bio.

What are you working on this weekend? Drop a comment.`,
    hashtags: [
      "weekendsale", "musicproducer", "beatmaker", "producerlife",
      "weekendvibes", "studioweekend", "musicproduction", "producer",
      "makingbeats", "studiolife", "sale", "discount"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `Weekend sale

{{discountPercent}}% off {{productName}}

Code: {{discountCode}}

Ends Sunday midnight

{{productUrl}}`,
    hashtags: ["weekendsale", "producer"],
  },

  facebook: {
    post: `WEEKEND SALE

{{discountPercent}}% off {{productName}} through Sunday at midnight.

Use code: {{discountCode}}

What are you producing this weekend?

{{productUrl}}`,
    callToAction: "Shop the Sale",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Weekend offer: {{discountPercent}}% off {{productName}}

Use code {{discountCode}} at checkout. Valid through Sunday.

A great opportunity for producers looking to expand their toolkit.

{{productUrl}}`,
    hashtags: ["MusicProduction", "WeekendDeal"],
    professionalAngle: "Brief and professional",
  },

  tiktok: {
    caption: `Weekend sale. {{discountPercent}}% off. Code: {{discountCode}}. Ends Sunday. Link in bio.`,
    hashtags: ["weekendsale", "producertok", "musicproducer", "fyp"],
    hookLine: "Weekend sale on everything in my store",
  },

  variables: [
    { key: "{{productName}}", label: "Product/Store Name", type: "text", required: true },
    { key: "{{productUrl}}", label: "Product URL", type: "url", required: true },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true, defaultValue: "25" },
    { key: "{{discountCode}}", label: "Discount Code", type: "text", required: true, defaultValue: "WEEKEND25" },
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
  ],

  recommendedTiming: {
    email: "Friday morning, 10:00 AM",
    social: "Friday afternoon + Saturday reminder",
    urgency: "Sunday morning final reminder",
  },
};

// Last Chance Reminder Template
export const lastChanceTemplate: MarketingCampaignTemplate = {
  id: "last-chance",
  name: "Last Chance Reminder",
  description: "Final hours reminder for ending sales or promotions",
  campaignType: "flash_sale",
  productTypes: ["sample_pack", "course", "preset_pack", "bundle"],
  icon: "Clock",
  estimatedReach: "high",

  email: {
    subject: "FINAL HOURS: {{discountPercent}}% off ends tonight",
    previewText: "Last chance to save",
    body: `<p>Hey {{firstName}},</p>

<p><strong>This is it.</strong></p>

<p>The {{discountPercent}}% off sale on {{productName}} ends in a few hours.</p>

<p>After midnight, the price goes back to {{originalPrice}}.</p>

<p>If you've been thinking about it, now's the time.</p>

<p style="margin: 24px 0;">
  <a href="{{productUrl}}" style="display: inline-block; background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get It Before It's Gone</a>
</p>

<p>Last call,<br>{{creatorName}}</p>

<p style="color: #6b7280; font-size: 12px;">P.S. This is the last email about this sale. Promise.</p>`,
    ctaText: "Get It Before It's Gone",
    ctaUrl: "{{productUrl}}",
  },

  instagram: {
    caption: `FINAL HOURS

The {{discountPercent}}% off sale ends TONIGHT.

After midnight, {{productName}} goes back to full price.

If you've been on the fence, this is your sign.

Link in bio. Last chance.`,
    hashtags: [
      "lastchance", "finalchance", "endstonight", "musicproducer",
      "beatmaker", "producerlife", "sale", "limitedtime"
    ],
    callToAction: "Link in bio",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `FINAL HOURS

{{discountPercent}}% off {{productName}} ends at midnight.

Don't miss it.

{{productUrl}}`,
    hashtags: ["lastchance"],
  },

  facebook: {
    post: `FINAL HOURS

The {{discountPercent}}% off sale on {{productName}} ends tonight at midnight.

This is your last chance to grab it at this price.

{{productUrl}}`,
    callToAction: "Get It Now",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Final reminder: The {{discountPercent}}% discount on {{productName}} ends tonight.

{{productUrl}}`,
    hashtags: ["LastChance", "MusicProduction"],
    professionalAngle: "Brief urgency message",
  },

  tiktok: {
    caption: `LAST CHANCE. Sale ends tonight. {{discountPercent}}% off. Link in bio.`,
    hashtags: ["lastchance", "salealert", "producertok", "fyp"],
    hookLine: "This sale ends in a few hours and I don't want you to miss it",
  },

  variables: [
    { key: "{{productName}}", label: "Product Name", type: "text", required: true },
    { key: "{{productUrl}}", label: "Product URL", type: "url", required: true },
    { key: "{{discountPercent}}", label: "Discount Percentage", type: "discount", required: true },
    { key: "{{originalPrice}}", label: "Original Price", type: "price", required: true },
    { key: "{{firstName}}", label: "Recipient First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
  ],

  recommendedTiming: {
    email: "3-4 hours before sale ends",
    social: "Same day, evening",
    urgency: "This IS the urgency message",
  },
};

// Export all flash sale templates
export const flashSaleTemplates: MarketingCampaignTemplate[] = [
  flashSale24HourTemplate,
  weekendSaleTemplate,
  lastChanceTemplate,
];
