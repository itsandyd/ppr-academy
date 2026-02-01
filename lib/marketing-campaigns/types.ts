// Marketing Campaign Types
// Multi-platform campaign templates for music producers

export type CampaignType =
  | "product_launch"
  | "welcome_onboarding"
  | "flash_sale"
  | "reengagement"
  | "course_milestone"
  | "seasonal_holiday";

export type Platform =
  | "email"
  | "instagram"
  | "twitter"
  | "facebook"
  | "linkedin"
  | "tiktok";

export type ProductType =
  | "sample_pack"
  | "course"
  | "preset_pack"
  | "bundle"
  | "masterclass";

// Individual platform content types
export interface EmailContent {
  subject: string;
  previewText: string;
  body: string; // HTML content
  ctaText: string;
  ctaUrl?: string;
}

export interface InstagramContent {
  caption: string; // Max 2200 chars
  hashtags: string[]; // 15-30 hashtags
  callToAction: string;
  suggestedImageStyle: "carousel" | "single" | "reel" | "story";
}

export interface TwitterContent {
  tweet: string; // Max 280 chars
  threadPosts?: string[]; // Optional thread
  hashtags: string[]; // 1-3 hashtags max
}

export interface FacebookContent {
  post: string; // Max 63206 chars
  callToAction: string;
  suggestedImageStyle: "single" | "carousel" | "video";
}

export interface LinkedInContent {
  post: string; // Max 3000 chars
  hashtags: string[]; // 3-5 hashtags
  professionalAngle: string; // How to frame for business audience
}

export interface TikTokContent {
  caption: string; // Max 2200 chars
  hashtags: string[];
  trendingSounds?: string;
  hookLine: string; // First 3 seconds hook
}

// Template variable definition
export interface TemplateVariable {
  key: string; // e.g., "{{productName}}"
  label: string; // "Product Name"
  type: "text" | "url" | "price" | "date" | "discount" | "number";
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
}

// Multi-platform campaign template
export interface MarketingCampaignTemplate {
  id: string;
  name: string;
  description: string;
  campaignType: CampaignType;
  productTypes: ProductType[]; // Which product types this works for
  icon: string; // Lucide icon name
  estimatedReach: "high" | "medium" | "low";

  // Platform-specific content
  email: EmailContent;
  instagram: InstagramContent;
  twitter: TwitterContent;
  facebook: FacebookContent;
  linkedin: LinkedInContent;
  tiktok: TikTokContent;

  // Template variables
  variables: TemplateVariable[];

  // Timing recommendations
  recommendedTiming: {
    email: string; // "Day 1, 9am"
    social: string; // "Day 1, 12pm"
    urgency?: string; // "Send 24h before sale ends"
  };
}

// Campaign instance (when user creates from template)
export interface MarketingCampaign {
  id: string;
  templateId: string;
  storeId: string;
  userId: string;
  name: string;
  status: "draft" | "scheduled" | "active" | "completed" | "paused";
  campaignType: CampaignType;

  // Product reference (if applicable)
  productId?: string;
  courseId?: string;

  // Variable values filled in by user
  variableValues: Record<string, string>;

  // Customized content per platform (overrides template defaults)
  platformContent: {
    email?: Partial<EmailContent>;
    instagram?: Partial<InstagramContent>;
    twitter?: Partial<TwitterContent>;
    facebook?: Partial<FacebookContent>;
    linkedin?: Partial<LinkedInContent>;
    tiktok?: Partial<TikTokContent>;
  };

  // Platform scheduling
  scheduledPlatforms: {
    platform: Platform;
    enabled: boolean;
    scheduledAt?: number;
    status: "pending" | "sent" | "failed" | "skipped";
    postId?: string; // Reference to actual post/email
    error?: string;
  }[];

  // Analytics
  analytics?: {
    emailOpens?: number;
    emailClicks?: number;
    socialImpressions?: number;
    socialEngagement?: number;
    conversions?: number;
    revenue?: number;
  };

  createdAt: number;
  updatedAt: number;
}

// Campaign category for UI grouping
export interface CampaignCategory {
  type: CampaignType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const campaignCategories: CampaignCategory[] = [
  {
    type: "product_launch",
    label: "Product Launch",
    description: "Announce new sample packs, courses, and presets",
    icon: "Rocket",
    color: "blue",
  },
  {
    type: "flash_sale",
    label: "Flash Sale",
    description: "Time-limited promotions and discounts",
    icon: "Zap",
    color: "orange",
  },
  {
    type: "welcome_onboarding",
    label: "Welcome & Onboarding",
    description: "Welcome new subscribers and deliver lead magnets",
    icon: "Heart",
    color: "pink",
  },
  {
    type: "reengagement",
    label: "Re-engagement",
    description: "Win back inactive subscribers",
    icon: "RotateCcw",
    color: "purple",
  },
  {
    type: "course_milestone",
    label: "Course Milestones",
    description: "Celebrate student progress and completions",
    icon: "Trophy",
    color: "yellow",
  },
  {
    type: "seasonal_holiday",
    label: "Seasonal & Holiday",
    description: "Black Friday, New Year, and seasonal campaigns",
    icon: "Calendar",
    color: "green",
  },
];

// Platform metadata for UI
export interface PlatformMeta {
  id: Platform;
  label: string;
  icon: string;
  color: string;
  characterLimit?: number;
  hashtagLimit?: number;
}

export const platformMeta: PlatformMeta[] = [
  { id: "email", label: "Email", icon: "Mail", color: "blue", characterLimit: undefined },
  { id: "instagram", label: "Instagram", icon: "Instagram", color: "pink", characterLimit: 2200, hashtagLimit: 30 },
  { id: "twitter", label: "Twitter/X", icon: "Twitter", color: "sky", characterLimit: 280, hashtagLimit: 3 },
  { id: "facebook", label: "Facebook", icon: "Facebook", color: "blue", characterLimit: 63206 },
  { id: "linkedin", label: "LinkedIn", icon: "Linkedin", color: "blue", characterLimit: 3000, hashtagLimit: 5 },
  { id: "tiktok", label: "TikTok", icon: "Music", color: "black", characterLimit: 2200 },
];

// Common variables available in all templates
export const commonVariables: TemplateVariable[] = [
  { key: "{{firstName}}", label: "First Name", type: "text", required: false, defaultValue: "there", placeholder: "Subscriber's first name" },
  { key: "{{creatorName}}", label: "Creator Name", type: "text", required: true, placeholder: "Your name or brand" },
  { key: "{{storeUrl}}", label: "Store URL", type: "url", required: false, placeholder: "Your store homepage" },
];

// Music producer specific hashtags by genre
export const musicProducerHashtags = {
  general: [
    "musicproducer", "beatmaker", "producerlife", "studiolife",
    "makingbeats", "musicproduction", "producer", "beats",
    "producerslife", "beatmaking", "musicstudio", "homerecording"
  ],
  hiphop: [
    "hiphopbeats", "trapbeats", "rapbeats", "hiphopproducer",
    "trapproducer", "808s", "trapmusic", "boombap"
  ],
  electronic: [
    "edm", "electronicmusic", "housemusic", "techno",
    "synthwave", "futurebeats", "bassmusic", "dubstep"
  ],
  rnb: [
    "rnbbeats", "rnbproducer", "soulbeats", "rnbmusic",
    "smoothbeats", "neosoul"
  ],
  pop: [
    "popbeats", "popproducer", "popmusic", "toplines",
    "songwriting", "vocoder"
  ],
  daw: [
    "flstudio", "ableton", "logicpro", "protools",
    "cubase", "studioone", "maschine", "mpc"
  ],
};
