/**
 * Beat Lease - Type Definitions
 */

export type LeaseType = 
  | "basic"      // Basic license (limited uses)
  | "premium"    // Premium license (more uses)
  | "exclusive"  // Exclusive rights (unlimited, only one buyer)
  | "free"       // Free download with attribution

export type BeatGenre = 
  | "trap"
  | "drill" 
  | "hip-hop"
  | "rnb"
  | "pop"
  | "afrobeat"
  | "reggaeton"
  | "boom-bap"
  | "lo-fi"
  | "experimental"
  | "other";

export interface LeaseOption {
  type: LeaseType;
  enabled: boolean;
  price: number;
  description: string;
  // License terms
  mp3Included: boolean;
  wavIncluded: boolean;
  stemsIncluded: boolean;
  trackoutsIncluded: boolean;
  commercialUse: boolean;
  distributionLimit?: number;  // Max copies sold
  exclusivityPeriod?: number;  // Days until beat can be sold again
}

export interface BeatMetadata {
  bpm: number;
  key: string;  // e.g., "C minor", "A# major"
  genre: BeatGenre;
  mood?: string[];  // e.g., ["dark", "aggressive", "melodic"]
  instruments?: string[];  // e.g., ["808", "piano", "strings"]
  tagged: boolean;  // Producer tag included
  duration: number;  // in seconds
}

export interface BeatFiles {
  mp3Url?: string;      // Preview/basic lease
  wavUrl?: string;      // High quality
  stemsUrl?: string;    // Individual stems
  trackoutsUrl?: string; // Full project files
  zipUrl?: string;      // All files combined
}

export interface BeatLeaseData {
  // Basic info
  title?: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  
  // Beat metadata
  metadata?: BeatMetadata;
  
  // Files
  files?: BeatFiles;
  
  // Lease options (multiple pricing tiers)
  leaseOptions?: LeaseOption[];
  
  // Follow gate (for free beats)
  followGateConfig?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
    socialLinks?: {
      instagram?: string;
      tiktok?: string;
      youtube?: string;
      spotify?: string;
    };
    customMessage?: string;
  };
  
  // Producer info
  producerTag?: string;  // "Prod. by YourName"
  credits?: string;      // Additional credits
  
  // Legal/Contract
  contractTerms?: string;  // Generated contract text
  customLegalTerms?: string;  // Additional legal terms
}

export interface StepCompletion {
  basics: boolean;
  metadata: boolean;
  files: boolean;
  licensing: boolean;
}

// Default lease options
export const DEFAULT_LEASE_OPTIONS: LeaseOption[] = [
  {
    type: "free",
    enabled: true,
    price: 0,
    description: "Free download with producer tag",
    mp3Included: true,
    wavIncluded: false,
    stemsIncluded: false,
    trackoutsIncluded: false,
    commercialUse: false,
  },
  {
    type: "basic",
    enabled: true,
    price: 25,
    description: "Basic lease for independent artists",
    mp3Included: true,
    wavIncluded: true,
    stemsIncluded: false,
    trackoutsIncluded: false,
    commercialUse: true,
    distributionLimit: 5000,
  },
  {
    type: "premium",
    enabled: true,
    price: 75,
    description: "Premium lease with stems",
    mp3Included: true,
    wavIncluded: true,
    stemsIncluded: true,
    trackoutsIncluded: false,
    commercialUse: true,
    distributionLimit: 50000,
  },
  {
    type: "exclusive",
    enabled: true,
    price: 500,
    description: "Exclusive rights - unlimited use",
    mp3Included: true,
    wavIncluded: true,
    stemsIncluded: true,
    trackoutsIncluded: true,
    commercialUse: true,
    // No limits for exclusive
  },
];

export const BEAT_GENRES: { id: BeatGenre; label: string; emoji: string }[] = [
  { id: "trap", label: "Trap", emoji: "🔥" },
  { id: "drill", label: "Drill", emoji: "⚡" },
  { id: "hip-hop", label: "Hip Hop", emoji: "🎤" },
  { id: "rnb", label: "R&B", emoji: "💫" },
  { id: "pop", label: "Pop", emoji: "🌟" },
  { id: "afrobeat", label: "Afrobeat", emoji: "🌍" },
  { id: "reggaeton", label: "Reggaeton", emoji: "🌴" },
  { id: "boom-bap", label: "Boom Bap", emoji: "📻" },
  { id: "lo-fi", label: "Lo-Fi", emoji: "🌙" },
  { id: "experimental", label: "Experimental", emoji: "🧪" },
  { id: "other", label: "Other", emoji: "🎵" },
];

export const MUSICAL_KEYS = [
  "C major", "C minor", "C# major", "C# minor",
  "D major", "D minor", "D# major", "D# minor", 
  "E major", "E minor",
  "F major", "F minor", "F# major", "F# minor",
  "G major", "G minor", "G# major", "G# minor",
  "A major", "A minor", "A# major", "A# minor",
  "B major", "B minor"
];
