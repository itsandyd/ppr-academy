/**
 * Platform Knowledge - PPR Academy Feature Awareness
 * 
 * This file contains knowledge about PPR Academy's built-in features
 * so the AI can recommend relevant platform capabilities when appropriate.
 */

export interface PlatformFeature {
  name: string;
  description: string;
  keywords: string[]; // Topics that should trigger mentions of this feature
  howToAccess: string;
  benefits: string[];
}

export const PPR_ACADEMY_FEATURES: PlatformFeature[] = [
  // ==================== DM AUTOMATION ====================
  {
    name: "DM Automation",
    description: "Automated Instagram DM responses with AI-powered Smart AI that can engage with followers, answer questions, and guide them to your content based on keywords and triggers.",
    keywords: [
      "dm automation", "instagram automation", "auto reply", "automated messages",
      "social media automation", "instagram dm", "direct messages", "dm strategy",
      "follower engagement", "instagram marketing", "dm funnel", "automated responses",
      "chatbot", "instagram chatbot", "comment automation", "story replies"
    ],
    howToAccess: "Go to Dashboard → Automations to set up your DM automation flows",
    benefits: [
      "Respond to followers 24/7 automatically",
      "Use Smart AI to have natural conversations",
      "Set up keyword triggers to send specific content",
      "Convert followers into leads and customers while you sleep"
    ]
  },

  // ==================== COURSES ====================
  {
    name: "Course Creation",
    description: "Create and sell online courses with modules, lessons, chapters, video content, and AI-generated audio narration. Includes progress tracking, certificates, and Q&A features.",
    keywords: [
      "create course", "online course", "sell course", "course platform",
      "teach online", "course creator", "educational content", "lessons",
      "modules", "curriculum", "course outline", "video course"
    ],
    howToAccess: "Go to Dashboard → Store → Courses to create your course",
    benefits: [
      "AI-powered course content generation",
      "Built-in video and audio hosting",
      "Student progress tracking and analytics",
      "Certificates of completion",
      "Q&A section for student engagement"
    ]
  },

  // ==================== DIGITAL PRODUCTS ====================
  {
    name: "Digital Products",
    description: "Sell sample packs, preset packs, MIDI packs, Ableton racks, templates, PDF guides, and other digital downloads with instant delivery.",
    keywords: [
      "sell samples", "sample pack", "preset pack", "midi pack", "ableton rack",
      "templates", "digital download", "sell beats", "sound design presets",
      "drum kit", "project files", "mixing template"
    ],
    howToAccess: "Go to Dashboard → Store → Products to create digital products",
    benefits: [
      "Instant delivery after purchase",
      "Secure download links",
      "Order bump options for upsells",
      "Follow-gate for free products (require social follows)"
    ]
  },

  // ==================== FOLLOW GATES ====================
  {
    name: "Follow Gates",
    description: "Gate free content behind social follows - users must follow your Instagram, YouTube, Spotify, or TikTok to access free downloads.",
    keywords: [
      "grow followers", "get followers", "instagram followers", "follow gate",
      "free download", "lead magnet", "social proof", "grow audience",
      "spotify followers", "youtube subscribers", "tiktok followers"
    ],
    howToAccess: "Enable Follow Gate in any product or course settings",
    benefits: [
      "Grow your social following with every download",
      "Build your audience while giving value",
      "Collect emails while requiring follows",
      "Multi-platform support (Instagram, YouTube, Spotify, TikTok)"
    ]
  },

  // ==================== EMAIL CAMPAIGNS ====================
  {
    name: "Email Campaigns",
    description: "Send email campaigns to your customers and leads. Segment by purchase history, engagement, and custom tags.",
    keywords: [
      "email marketing", "email campaign", "newsletter", "email list",
      "email automation", "drip campaign", "email sequence", "broadcast",
      "email subscribers", "mailing list"
    ],
    howToAccess: "Go to Dashboard → Store → Fans → Campaigns",
    benefits: [
      "Segment your audience by behavior",
      "Track opens, clicks, and conversions",
      "Import contacts from CSV",
      "Beautiful email templates"
    ]
  },

  // ==================== CUSTOMER DATABASE ====================
  {
    name: "Fan/Customer Database",
    description: "Manage your fans and customers in one place. Track purchases, tags, engagement, and lifetime value.",
    keywords: [
      "customer management", "fan database", "crm", "customer list",
      "leads", "contacts", "customer data", "audience management"
    ],
    howToAccess: "Go to Dashboard → Store → Fans",
    benefits: [
      "See all customers and their purchase history",
      "Tag and segment your audience",
      "Track customer lifetime value",
      "Export customer data"
    ]
  },

  // ==================== ANALYTICS ====================
  {
    name: "Analytics Dashboard",
    description: "Track your revenue, sales, course enrollments, student progress, and marketing performance all in one place.",
    keywords: [
      "analytics", "track sales", "revenue", "metrics", "performance",
      "conversion rate", "student progress", "course analytics"
    ],
    howToAccess: "Go to Dashboard → Home for your analytics overview",
    benefits: [
      "Real-time revenue tracking",
      "Course completion rates",
      "Student engagement metrics",
      "Marketing funnel analytics"
    ]
  },

  // ==================== STOREFRONT ====================
  {
    name: "Custom Storefront",
    description: "Your own branded storefront with custom domain support. Showcase all your courses and products in one professional page.",
    keywords: [
      "storefront", "website", "landing page", "sales page",
      "custom domain", "branding", "online store", "shop"
    ],
    howToAccess: "Go to Dashboard → Store → Settings to customize your storefront",
    benefits: [
      "Custom domain support",
      "Mobile-optimized design",
      "Showcase all products in one place",
      "Social links integration"
    ]
  },

  // ==================== SOCIAL MEDIA SCHEDULING ====================
  {
    name: "Social Media Scheduling",
    description: "Schedule posts to Instagram, Facebook, and other platforms. Plan your content calendar in advance.",
    keywords: [
      "schedule posts", "content calendar", "social media scheduling",
      "instagram posts", "content planning", "post scheduler"
    ],
    howToAccess: "Go to Dashboard → Store → Social to schedule posts",
    benefits: [
      "Plan content weeks in advance",
      "Multi-platform posting",
      "Content templates",
      "Analytics on post performance"
    ]
  },

  // ==================== NOTES SYSTEM ====================
  {
    name: "Notes & Knowledge Base",
    description: "Create and organize notes, import from PDFs, YouTube videos, and websites. Build your personal knowledge base.",
    keywords: [
      "notes", "knowledge base", "documentation", "note taking",
      "research", "organize content", "second brain"
    ],
    howToAccess: "Go to Dashboard → Notes",
    benefits: [
      "Import from PDF, YouTube, websites",
      "Organize with folders and tags",
      "AI-powered summaries",
      "Search across all your notes"
    ]
  },

  // ==================== CERTIFICATES ====================
  {
    name: "Course Certificates",
    description: "Automatically issue certificates when students complete your courses. Shareable and verifiable.",
    keywords: [
      "certificate", "certification", "completion certificate",
      "credential", "badge", "course completion"
    ],
    howToAccess: "Certificates are automatically generated when students complete courses",
    benefits: [
      "Professional PDF certificates",
      "Unique verification codes",
      "Students can share on LinkedIn",
      "Branded with your logo"
    ]
  },

  // ==================== AFFILIATE SYSTEM ====================
  {
    name: "Affiliate Program",
    description: "Let others promote your products and courses for a commission. Track referrals and payouts automatically.",
    keywords: [
      "affiliate", "referral program", "commission", "affiliate marketing",
      "partner program", "referral links", "affiliate sales"
    ],
    howToAccess: "Go to Dashboard → Store → Affiliates to set up your program",
    benefits: [
      "Automatic commission tracking",
      "Custom commission rates",
      "Affiliate dashboard for partners",
      "Automated payouts"
    ]
  },

  // ==================== COACHING ====================
  {
    name: "Coaching Sessions",
    description: "Sell one-on-one or group coaching sessions. Includes calendar integration and session management.",
    keywords: [
      "coaching", "mentoring", "one on one", "1:1 sessions",
      "consulting", "private lessons", "tutoring"
    ],
    howToAccess: "Create a coaching product in Dashboard → Store → Products",
    benefits: [
      "Built-in scheduling",
      "Session reminders",
      "Integration with Discord for delivery",
      "Track client sessions"
    ]
  }
];

/**
 * Get relevant platform features based on the question/topic
 */
export function getRelevantPlatformFeatures(
  question: string,
  limit: number = 3
): PlatformFeature[] {
  const questionLower = question.toLowerCase();
  
  // Score each feature based on keyword matches
  const scoredFeatures = PPR_ACADEMY_FEATURES.map(feature => {
    let score = 0;
    
    // Check keyword matches
    for (const keyword of feature.keywords) {
      if (questionLower.includes(keyword.toLowerCase())) {
        score += 10; // Strong match
      }
    }
    
    // Check feature name match
    if (questionLower.includes(feature.name.toLowerCase())) {
      score += 20;
    }
    
    // Partial word matching
    const words = questionLower.split(/\s+/);
    for (const word of words) {
      if (word.length > 3) {
        for (const keyword of feature.keywords) {
          if (keyword.includes(word) || word.includes(keyword.split(' ')[0])) {
            score += 2;
          }
        }
      }
    }
    
    return { feature, score };
  });
  
  // Return top features with non-zero scores
  return scoredFeatures
    .filter(sf => sf.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(sf => sf.feature);
}

/**
 * Format platform features for inclusion in AI prompts
 */
export function formatPlatformKnowledgeForPrompt(features: PlatformFeature[]): string {
  if (features.length === 0) {
    return "";
  }
  
  const formatted = features.map(f => {
    return `**${f.name}**: ${f.description}
   How to access: ${f.howToAccess}
   Benefits: ${f.benefits.slice(0, 2).join(", ")}`;
  }).join("\n\n");
  
  return `
RELEVANT PPR ACADEMY FEATURES (mention these naturally when appropriate):
${formatted}

When discussing topics related to these features, naturally mention that PPR Academy has built-in tools for this. For example:
- If discussing DM automation → mention the built-in Automation feature
- If discussing course creation → mention the course builder
- If discussing selling products → mention the digital products system
Don't force it, but weave it in when genuinely relevant.
`;
}

