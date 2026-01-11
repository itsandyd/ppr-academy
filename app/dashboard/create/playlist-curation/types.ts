export interface PlaylistCurationData {
  // Basic info
  name?: string;
  description?: string;
  coverUrl?: string;
  genres?: string[];
  customSlug?: string;

  // Visibility
  isPublic?: boolean;

  // Submission Settings
  acceptsSubmissions?: boolean;
  submissionRules?: {
    allowedGenres?: string[];
    maxLengthSeconds?: number;
    requiresMessage?: boolean;
    guidelines?: string;
  };
  submissionSLA?: number; // Days to review

  // Pricing
  pricingModel?: "free" | "paid";
  submissionFee?: number;
  currency?: string;

  // Integration
  spotifyPlaylistUrl?: string;
  applePlaylistUrl?: string;
  soundcloudPlaylistUrl?: string;
}

export interface StepCompletion {
  basics: boolean;
  submissionSettings: boolean;
  pricing: boolean;
}

export const GENRE_OPTIONS = [
  "Electronic",
  "Hip-Hop",
  "House",
  "Techno",
  "Trap",
  "Lo-Fi",
  "Ambient",
  "Experimental",
  "Pop",
  "R&B",
  "Jazz",
  "Rock",
  "Indie",
  "EDM",
  "Dubstep",
  "Drum & Bass",
  "Future Bass",
];
