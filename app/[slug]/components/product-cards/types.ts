import { LucideIcon } from "lucide-react";

export interface BaseProduct {
  _id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  buttonLabel?: string;
  downloadUrl?: string;
  url?: string;
  slug?: string;
  category?: string;
  productType?: string;
  productCategory?: string;
  _creationTime: number;
  isPublished?: boolean;
  style?: string;

  // Follow gate properties
  followGateEnabled?: boolean;
  followGateRequirements?: {
    requireEmail?: boolean;
    requireInstagram?: boolean;
    requireTiktok?: boolean;
    requireYoutube?: boolean;
    requireSpotify?: boolean;
    minFollowsRequired?: number;
  };
  followGateSocialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    spotify?: string;
  };
  followGateMessage?: string;

  // Beat lease specific
  beatLeaseConfig?: {
    tiers?: Array<{
      type: "basic" | "premium" | "exclusive" | "unlimited";
      enabled: boolean;
      price: number;
      name: string;
    }>;
    bpm?: number;
    key?: string;
    genre?: string;
  };
  bpm?: number;
  musicalKey?: string;
  genre?: string[];
  demoAudioUrl?: string;

  // Membership specific
  tierName?: string;
  priceMonthly?: number;
  priceYearly?: number;
  benefits?: string[];
  trialDays?: number;

  // Playlist curation specific
  acceptsSubmissions?: boolean;
  submissionFee?: number;
  genres?: string[];

  // Course specific
  skillLevel?: string;
  duration?: string;
  lessonsCount?: number;

  // URL/Media specific
  mediaType?: "youtube" | "spotify" | "link";

  // Bundle specific
  originalPrice?: number;
  discountPercentage?: number;
}

export interface ProductCardProps {
  product: BaseProduct;
  onClick?: (product: BaseProduct) => void;
  displayName?: string;
  showBadge?: boolean;
  badgeText?: string;
  badgeColor?: string;
  icon?: LucideIcon;
}
