/**
 * Universal Product Creation - Type Definitions
 */

export type ProductType = 
  | "digital"
  | "playlistCuration"
  | "abletonRack"
  | "abletonPreset"
  | "coaching"
  | "urlMedia";

export type ProductCategory = 
  // Music Production
  | "sample-pack"
  | "preset-pack"
  | "midi-pack"
  | "bundle" // NEW: Bundle multiple products together
  | "ableton-rack"
  | "beat-lease"
  | "project-files"
  | "mixing-template"
  // Services
  | "coaching"
  | "mixing-service"
  | "mastering-service"
  // Curation
  | "playlist-curation"
  // Education
  | "course"
  | "workshop"
  | "masterclass"
  // Digital Content
  | "pdf-guide"
  | "cheat-sheet"
  | "template"
  | "blog-post"
  // Community
  | "community"
  // Support
  | "tip-jar"
  | "donation";

export type PricingModel = "free_with_gate" | "paid";

export interface FollowGateConfig {
  requireEmail: boolean;
  requireInstagram: boolean;
  requireTiktok: boolean;
  requireYoutube: boolean;
  requireSpotify: boolean;
  minFollowsRequired: number;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  customMessage?: string;
}

export interface PlaylistConfig {
  linkedPlaylistId?: string;
  reviewTurnaroundDays: number;
  genresAccepted: string[];
  submissionGuidelines?: string;
  maxSubmissionsPerMonth?: number;
}

export interface AbletonRackConfig {
  abletonVersion: string;
  rackType: "audioEffect" | "instrument" | "midiEffect" | "drumRack";
  genre?: string[];
  bpm?: number;
}

export interface CoachingConfig {
  duration?: number;
  sessionType?: string;
  availabilityNotes?: string;
}

export interface FileItem {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface BundleConfig {
  includedProductIds: string[]; // Array of product IDs to bundle
  bundleDiscount?: number; // Percentage discount vs buying individually
  bundleDescription?: string; // What's included
}

export interface ProductFormData {
  // Step 1: Type Selection
  productType: ProductType;
  productCategory: ProductCategory;
  
  // Step 2: Pricing
  pricingModel: PricingModel;
  price: number;
  
  // Step 3: Details
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  tags: string[];
  
  // Course-specific fields (optional, only for courses)
  category?: string;
  subcategory?: string;
  skillLevel?: string;
  modules?: Array<{
    title: string;
    description: string;
    orderIndex: number;
    lessons: Array<{
      title: string;
      description: string;
      orderIndex: number;
      chapters: Array<{
        title: string;
        content: string;
        videoUrl: string;
        duration: number;
        orderIndex: number;
      }>;
    }>;
  }>;
  
  // Step 4: Follow Gate (if free)
  followGateConfig?: FollowGateConfig;
  
  // Step 5: Type-Specific
  playlistConfig?: PlaylistConfig;
  abletonRackConfig?: AbletonRackConfig;
  coachingConfig?: CoachingConfig;
  bundleConfig?: BundleConfig;
  files?: FileItem[];
  
  // Meta
  storeId: string;
  userId: string;
  currentStep: number;
}

export const PRODUCT_TYPE_INFO = [
  // Music Production
  {
    id: "sample-pack",
    label: "Sample Pack",
    description: "Audio samples & loops",
    category: "Music Production",
    productType: "digital" as ProductType,
    icon: "🎵",
  },
  {
    id: "preset-pack",
    label: "Preset Pack",
    description: "Synth presets (Serum, Vital, etc.)",
    category: "Music Production",
    productType: "digital" as ProductType,
    icon: "🎛️",
  },
  {
    id: "midi-pack",
    label: "MIDI Pack",
    description: "MIDI files & melodies",
    category: "Music Production",
    productType: "digital" as ProductType,
    icon: "🎹",
  },
  {
    id: "ableton-rack",
    label: "Ableton Rack",
    description: "Audio effect racks",
    category: "Music Production",
    productType: "abletonRack" as ProductType,
    icon: "🔊",
  },
  {
    id: "beat-lease",
    label: "Beat Lease",
    description: "Exclusive/non-exclusive beats",
    category: "Music Production",
    productType: "digital" as ProductType,
    icon: "🎹",
  },
  {
    id: "project-files",
    label: "Project Files",
    description: "DAW project templates",
    category: "Music Production",
    productType: "digital" as ProductType,
    icon: "📁",
  },
  {
    id: "mixing-template",
    label: "Mixing Template",
    description: "Processing chains & templates",
    category: "Music Production",
    productType: "digital" as ProductType,
    icon: "🎚️",
  },
  
  // Digital Content
  {
    id: "pdf-guide",
    label: "PDF Guide",
    description: "Educational PDFs & guides",
    category: "Digital Content",
    productType: "digital" as ProductType,
    icon: "📄",
  },
  {
    id: "cheat-sheet",
    label: "Cheat Sheet",
    description: "Quick reference guides",
    category: "Digital Content",
    productType: "digital" as ProductType,
    icon: "📋",
  },
  {
    id: "template",
    label: "Template",
    description: "Design templates & assets",
    category: "Digital Content",
    productType: "digital" as ProductType,
    icon: "🎨",
  },
  {
    id: "blog-post",
    label: "Blog Post",
    description: "Articles & written content",
    category: "Digital Content",
    productType: "urlMedia" as ProductType,
    icon: "📝",
  },
  
  // Community
  {
    id: "community",
    label: "Community",
    description: "Discord server or exclusive community access",
    category: "Community",
    productType: "digital" as ProductType,
    icon: "👥",
  },
  
  // Services
  {
    id: "playlist-curation",
    label: "Playlist Curation",
    description: "Review & feature tracks on your playlist",
    category: "Services",
    productType: "playlistCuration" as ProductType,
    icon: "🎼",
  },
  {
    id: "coaching",
    label: "Coaching Session",
    description: "1:1 coaching calls",
    category: "Services",
    productType: "coaching" as ProductType,
    icon: "💬",
  },
  {
    id: "mixing-service",
    label: "Mixing Service",
    description: "Professional mixing",
    category: "Services",
    productType: "coaching" as ProductType,
    icon: "🎚️",
  },
  {
    id: "mastering-service",
    label: "Mastering Service",
    description: "Professional mastering",
    category: "Services",
    productType: "coaching" as ProductType,
    icon: "💿",
  },
  
  // Education
  {
    id: "course",
    label: "Online Course",
    description: "Educational courses with lessons",
    category: "Education",
    productType: "digital" as ProductType,
    icon: "🎓",
  },
  {
    id: "workshop",
    label: "Workshop",
    description: "Live group workshops",
    category: "Education",
    productType: "coaching" as ProductType,
    icon: "👥",
  },
  {
    id: "masterclass",
    label: "Masterclass",
    description: "Premium masterclass content",
    category: "Education",
    productType: "digital" as ProductType,
    icon: "⭐",
  },
  
  // Support & Donations
  {
    id: "tip-jar",
    label: "Tip Jar",
    description: "Accept tips & donations (pay what you want)",
    category: "Support",
    productType: "digital" as ProductType,
    icon: "☕",
  },
  {
    id: "donation",
    label: "Donation",
    description: "One-time or recurring donations",
    category: "Support",
    productType: "digital" as ProductType,
    icon: "💝",
  },
  
  // Bundles
  {
    id: "bundle",
    label: "Bundle",
    description: "Combine any products together (courses, packs, coaching, etc.)",
    category: "Bundles",
    productType: "digital" as ProductType,
    icon: "📦",
  },
] as const;

