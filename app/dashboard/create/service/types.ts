export type ServiceType = "mixing" | "mastering" | "mix-and-master" | "stem-mixing" | "curation";

export type DeliveryFormat = "wav-24bit" | "wav-16bit" | "mp3-320" | "stems" | "all";

export interface PricingTier {
  id: string;
  name: string;
  stemCount: string;
  price: number;
  turnaroundDays: number;
  revisions: number;
  description?: string;
}

export interface RequirementsConfig {
  acceptedFormats: string[];
  minStemCount?: number;
  maxStemCount?: number;
  requireDryVocals: boolean;
  requireReferenceTrack: boolean;
  requireProjectNotes: boolean;
  maxFileSize: number;
  customRequirements?: string;
}

export interface DeliveryConfig {
  formats: DeliveryFormat[];
  includeProjectFile: boolean;
  includeStemBounces: boolean;
  deliveryMethod: "download" | "wetransfer" | "dropbox" | "google-drive";
  standardTurnaround: number;
  rushTurnaround?: number;
  rushMultiplier?: number;
}

export interface ServiceData {
  title?: string;
  description?: string;
  serviceType?: ServiceType;
  thumbnail?: string;
  tags?: string[];

  pricingTiers?: PricingTier[];
  rushAvailable?: boolean;
  rushMultiplier?: number;

  requirements?: RequirementsConfig;
  delivery?: DeliveryConfig;

  portfolio?: {
    beforeAfterSamples?: Array<{
      title: string;
      beforeUrl: string;
      afterUrl: string;
      genre?: string;
    }>;
    testimonials?: Array<{
      name: string;
      quote: string;
      project?: string;
    }>;
  };

  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface StepCompletion {
  basics: boolean;
  pricing: boolean;
  requirements: boolean;
  delivery: boolean;
}

export const SERVICE_TYPES = [
  {
    id: "mixing" as ServiceType,
    label: "Mixing",
    description: "Balance, EQ, compression, and spatial placement",
    icon: "🎚️",
  },
  {
    id: "mastering" as ServiceType,
    label: "Mastering",
    description: "Final polish, loudness, and format preparation",
    icon: "💿",
  },
  {
    id: "mix-and-master" as ServiceType,
    label: "Mix & Master",
    description: "Complete mixing and mastering package",
    icon: "🎛️",
  },
  {
    id: "stem-mixing" as ServiceType,
    label: "Stem Mixing",
    description: "Mix from grouped stems (drums, bass, vocals, etc.)",
    icon: "🔊",
  },
  {
    id: "curation" as ServiceType,
    label: "Playlist Curation",
    description: "Get your music on playlists and increase streams",
    icon: "📋",
  },
] as const;

export const ACCEPTED_FORMATS = [
  { id: "wav", label: "WAV", description: "Uncompressed audio" },
  { id: "aiff", label: "AIFF", description: "Apple uncompressed" },
  { id: "flac", label: "FLAC", description: "Lossless compressed" },
  { id: "mp3", label: "MP3", description: "Lossy (not recommended)" },
] as const;

export const DELIVERY_FORMATS = [
  { id: "wav-24bit" as DeliveryFormat, label: "WAV 24-bit", description: "Studio quality" },
  { id: "wav-16bit" as DeliveryFormat, label: "WAV 16-bit", description: "CD quality" },
  { id: "mp3-320" as DeliveryFormat, label: "MP3 320kbps", description: "Streaming quality" },
  { id: "stems" as DeliveryFormat, label: "Stem Bounces", description: "Grouped audio stems" },
  { id: "all" as DeliveryFormat, label: "All Formats", description: "Complete package" },
] as const;

export const DEFAULT_PRICING_TIERS: PricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    stemCount: "1-8 stems",
    price: 75,
    turnaroundDays: 7,
    revisions: 1,
    description: "Perfect for simple arrangements",
  },
  {
    id: "standard",
    name: "Standard",
    stemCount: "9-24 stems",
    price: 150,
    turnaroundDays: 7,
    revisions: 2,
    description: "Most popular for full productions",
  },
  {
    id: "premium",
    name: "Premium",
    stemCount: "25+ stems",
    price: 250,
    turnaroundDays: 7,
    revisions: 3,
    description: "Complex arrangements with unlimited stems",
  },
];
