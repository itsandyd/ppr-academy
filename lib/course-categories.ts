/**
 * Hierarchical Course Category System
 * Category → Subcategory → Tags
 */

export interface CategoryDefinition {
  id: string;
  label: string;
  subcategories: string[];
}

export const COURSE_CATEGORIES: CategoryDefinition[] = [
  {
    id: "daw",
    label: "DAW",
    subcategories: [
      "Ableton Live",
      "FL Studio",
      "Logic Pro",
      "Pro Tools",
      "Cubase",
      "Studio One",
      "Reason",
      "Bitwig",
      "Reaper",
    ],
  },
  {
    id: "genre",
    label: "Genre Production",
    subcategories: [
      "Hip-Hop & Trap",
      "Lo-Fi & Chill Beats",
      "R&B & Soul",
      "Pop & Top 40",
      "Electronic & EDM",
      "House & Deep House",
      "Techno & Minimal",
      "Drum & Bass",
      "Dubstep & Bass Music",
      "Afrobeats & Amapiano",
      "Latin & Reggaeton",
      "Rock & Alternative",
      "Jazz & Neo-Soul",
      "Ambient & Downtempo",
      "Film & Game Scoring",
    ],
  },
  {
    id: "skills",
    label: "Production Skills",
    subcategories: [
      "Mixing",
      "Mastering",
      "Sound Design",
      "Synthesis",
      "Sampling & Chopping",
      "Drum Programming",
      "Melody & Chord Writing",
      "Arrangement & Structure",
      "Vocal Recording & Editing",
      "Vocal Mixing & Effects",
    ],
  },
  {
    id: "fundamentals",
    label: "Music Fundamentals",
    subcategories: [
      "Music Theory",
      "Ear Training",
      "Rhythm & Timing",
      "Scales & Modes",
      "Chord Progressions",
      "Harmony & Counterpoint",
    ],
  },
  {
    id: "tools",
    label: "Specific Tools & Plugins",
    subcategories: [
      "Serum",
      "Vital",
      "Omnisphere",
      "Kontakt & Sampling",
      "Native Instruments",
      "Waves Plugins",
      "FabFilter",
      "iZotope",
      "Auto-Tune & Melodyne",
    ],
  },
  {
    id: "business",
    label: "Business & Career",
    subcategories: [
      "Email Marketing & Funnels",
      "Marketing & Social Media",
      "Fanbase & Community Building",
      "Release Strategy & Distribution",
      "Playlist Pitching & Promotion",
      "Artist Branding & Identity",
      "Music Business Fundamentals",
      "Monetization & Revenue Streams",
      "Copyright & Licensing",
      "Sync Licensing & Publishing",
    ],
  },
  {
    id: "performance",
    label: "Performance & Live",
    subcategories: [
      "Live Performance Setup",
      "DJing & Mixing",
      "Ableton Live Performance",
      "Hardware Controllers & MIDI",
      "Stage Presence & Performance",
    ],
  },
  {
    id: "recording",
    label: "Recording & Engineering",
    subcategories: [
      "Home Studio Setup",
      "Recording Techniques",
      "Microphone Techniques",
      "Audio Engineering",
      "Acoustics & Treatment",
    ],
  },
  {
    id: "workflow",
    label: "Workflow & Productivity",
    subcategories: [
      "Creative Workflow",
      "Project Organization",
      "Time Management for Producers",
      "Collaboration & File Management",
    ],
  },
  {
    id: "coaching",
    label: "Coaching & Education",
    subcategories: [
      "Teaching Music Production",
      "1-on-1 Coaching",
      "Course Creation for Producers",
    ],
  },
  {
    id: "general",
    label: "General Production",
    subcategories: [
      "Getting Started with Production",
      "Complete Production Course",
      "Producer Mindset & Creativity",
    ],
  },
  {
    id: "other",
    label: "Other",
    subcategories: [
      "Other",
    ],
  },
];

/**
 * Common tags for auto-suggestion
 */
export const SUGGESTED_TAGS: Record<string, string[]> = {
  // Marketing & Funnels
  "email": ["email marketing", "funnels", "automation", "list building"],
  "funnel": ["funnels", "email marketing", "conversion", "sales"],
  "pixel": ["pixel tracking", "facebook ads", "retargeting"],
  "fanbase": ["fanbase", "community", "audience growth", "engagement"],
  
  // DAWs
  "ableton": ["ableton live", "session view", "clips", "warping"],
  "fl studio": ["fl studio", "piano roll", "mixer", "patterns"],
  "logic": ["logic pro", "smart controls", "flex time"],
  
  // Production
  "mixing": ["mixing", "eq", "compression", "levels", "balance"],
  "mastering": ["mastering", "loudness", "limiting", "final mix"],
  "drums": ["drums", "808", "drum programming", "rhythm"],
  "melody": ["melody", "chords", "harmony", "songwriting"],
  "vocal": ["vocals", "auto-tune", "vocal mixing", "recording"],
  
  // Business
  "spotify": ["spotify", "playlists", "distribution", "streaming"],
  "marketing": ["marketing", "social media", "promotion", "growth"],
  "monetize": ["monetization", "income", "revenue", "selling"],
  "brand": ["branding", "identity", "artist brand", "visual"],
  
  // Genre
  "trap": ["trap", "808", "hi-hats", "southern rap"],
  "lofi": ["lo-fi", "chill beats", "vinyl", "jazz chords"],
  "edm": ["edm", "drops", "build-ups", "festival"],
  "house": ["house music", "four on the floor", "basslines"],
};

/**
 * Get subcategories for a given category
 */
export function getSubcategories(categoryId: string): string[] {
  const category = COURSE_CATEGORIES.find(c => c.id === categoryId);
  return category?.subcategories || [];
}

/**
 * Get category by ID
 */
export function getCategory(categoryId: string): CategoryDefinition | undefined {
  return COURSE_CATEGORIES.find(c => c.id === categoryId);
}

/**
 * Suggest tags based on title and description
 */
export function suggestTags(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const suggestedTags: Set<string> = new Set();
  
  Object.entries(SUGGESTED_TAGS).forEach(([keyword, tags]) => {
    if (text.includes(keyword)) {
      tags.forEach(tag => suggestedTags.add(tag));
    }
  });
  
  return Array.from(suggestedTags).slice(0, 10); // Top 10 suggestions
}

/**
 * Migrate old category to new system
 */
export function migrateLegacyCategory(oldCategory: string): {
  category: string;
  subcategory: string;
} {
  // DAWs
  if (oldCategory.includes("Ableton")) return { category: "daw", subcategory: "Ableton Live" };
  if (oldCategory.includes("FL Studio")) return { category: "daw", subcategory: "FL Studio" };
  if (oldCategory.includes("Logic")) return { category: "daw", subcategory: "Logic Pro" };
  if (oldCategory.includes("Pro Tools")) return { category: "daw", subcategory: "Pro Tools" };
  
  // Business
  if (oldCategory.includes("Email") || oldCategory.includes("Funnel")) 
    return { category: "business", subcategory: "Email Marketing & Funnels" };
  if (oldCategory.includes("Marketing")) 
    return { category: "business", subcategory: "Marketing & Social Media" };
  if (oldCategory.includes("Fanbase") || oldCategory.includes("Community")) 
    return { category: "business", subcategory: "Fanbase & Community Building" };
  if (oldCategory.includes("Playlist")) 
    return { category: "business", subcategory: "Playlist Pitching & Promotion" };
  
  // Production Skills
  if (oldCategory === "Mixing") return { category: "skills", subcategory: "Mixing" };
  if (oldCategory === "Mastering") return { category: "skills", subcategory: "Mastering" };
  if (oldCategory.includes("Sound Design")) return { category: "skills", subcategory: "Sound Design" };
  if (oldCategory.includes("Synthesis")) return { category: "skills", subcategory: "Synthesis" };
  
  // Genre
  if (oldCategory.includes("Hip-Hop") || oldCategory.includes("Trap")) 
    return { category: "genre", subcategory: "Hip-Hop & Trap" };
  if (oldCategory.includes("Lo-Fi")) 
    return { category: "genre", subcategory: "Lo-Fi & Chill Beats" };
  if (oldCategory.includes("House")) 
    return { category: "genre", subcategory: "House & Deep House" };
  
  // Default
  return { category: "general", subcategory: "General Production" };
}

