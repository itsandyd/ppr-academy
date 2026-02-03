import { BaseProduct } from "./types";
import {
  BookOpen,
  Music,
  Package,
  ExternalLink,
  Users,
  Heart,
  Crown,
  ListMusic,
  Waves,
  FileAudio,
  Layers,
  LucideIcon,
} from "lucide-react";

export interface ProductCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  products: BaseProduct[];
}

/**
 * Categorizes products by their type for section-based display
 */
export function categorizeProducts(products: BaseProduct[]): ProductCategory[] {
  const categories: Record<string, ProductCategory> = {
    "beat-lease": {
      id: "beat-lease",
      title: "Beats",
      description: "Professional beats with flexible licensing options",
      icon: Music,
      iconColor: "text-purple-500",
      iconBgColor: "bg-purple-500/10",
      products: [],
    },
    membership: {
      id: "membership",
      title: "Memberships",
      description: "Premium subscriptions with exclusive benefits",
      icon: Crown,
      iconColor: "text-amber-500",
      iconBgColor: "bg-amber-500/10",
      products: [],
    },
    course: {
      id: "course",
      title: "Courses",
      description: "In-depth video courses and tutorials",
      icon: BookOpen,
      iconColor: "text-blue-500",
      iconBgColor: "bg-blue-500/10",
      products: [],
    },
    "tip-jar": {
      id: "tip-jar",
      title: "Support",
      description: "Show your appreciation with a tip",
      icon: Heart,
      iconColor: "text-rose-500",
      iconBgColor: "bg-rose-500/10",
      products: [],
    },
    "playlist-curation": {
      id: "playlist-curation",
      title: "Playlists",
      description: "Submit your music for playlist consideration",
      icon: ListMusic,
      iconColor: "text-emerald-500",
      iconBgColor: "bg-emerald-500/10",
      products: [],
    },
    coaching: {
      id: "coaching",
      title: "Coaching",
      description: "One-on-one sessions and personalized guidance",
      icon: Users,
      iconColor: "text-indigo-500",
      iconBgColor: "bg-indigo-500/10",
      products: [],
    },
    abletonRack: {
      id: "abletonRack",
      title: "Ableton Racks",
      description: "Professional audio effect racks and presets",
      icon: Waves,
      iconColor: "text-orange-500",
      iconBgColor: "bg-orange-500/10",
      products: [],
    },
    urlMedia: {
      id: "urlMedia",
      title: "Links & Media",
      description: "External resources and curated content",
      icon: ExternalLink,
      iconColor: "text-slate-500",
      iconBgColor: "bg-slate-500/10",
      products: [],
    },
    digitalProduct: {
      id: "digitalProduct",
      title: "Digital Products",
      description: "Sample packs, templates, and downloadable content",
      icon: Package,
      iconColor: "text-cyan-500",
      iconBgColor: "bg-cyan-500/10",
      products: [],
    },
    bundle: {
      id: "bundle",
      title: "Bundles",
      description: "Discounted product bundles with multiple items",
      icon: Layers,
      iconColor: "text-orange-500",
      iconBgColor: "bg-orange-500/10",
      products: [],
    },
  };

  // Sort products into categories
  products.forEach((product) => {
    const type = product.productType || "";
    const category = product.productCategory || "";

    // Determine the category
    if (type === "beat-lease" || category === "beat-lease" || product.beatLeaseConfig) {
      categories["beat-lease"].products.push(product);
    } else if (type === "membership" || category === "membership" || product.tierName) {
      categories.membership.products.push(product);
    } else if (type === "course") {
      categories.course.products.push(product);
    } else if (type === "tip-jar" || category === "tip-jar") {
      categories["tip-jar"].products.push(product);
    } else if (type === "playlist-curation" || category === "playlist-curation") {
      categories["playlist-curation"].products.push(product);
    } else if (type === "coaching" || category === "coaching") {
      categories.coaching.products.push(product);
    } else if (type === "abletonRack" || type === "abletonPreset") {
      categories.abletonRack.products.push(product);
    } else if (type === "urlMedia" || product.mediaType) {
      categories.urlMedia.products.push(product);
    } else if (type === "bundle" || category === "bundle") {
      categories.bundle.products.push(product);
    } else {
      // Default to digital products
      categories.digitalProduct.products.push(product);
    }
  });

  // Sort products within each category by isPinned (pinned first)
  Object.values(categories).forEach((cat) => {
    cat.products.sort((a, b) => {
      const aIsPinned = (a as any).isPinned ? 1 : 0;
      const bIsPinned = (b as any).isPinned ? 1 : 0;
      if (aIsPinned !== bIsPinned) {
        return bIsPinned - aIsPinned;
      }
      // Secondary sort by pinnedAt (most recently pinned first)
      if (aIsPinned && bIsPinned) {
        const aPinnedAt = (a as any).pinnedAt || 0;
        const bPinnedAt = (b as any).pinnedAt || 0;
        return bPinnedAt - aPinnedAt;
      }
      // Then by creation time (newest first)
      return b._creationTime - a._creationTime;
    });
  });

  // Return only non-empty categories in preferred order
  const order = [
    "bundle",
    "membership",
    "beat-lease",
    "course",
    "abletonRack",
    "digitalProduct",
    "coaching",
    "playlist-curation",
    "urlMedia",
    "tip-jar",
  ];

  return order
    .map((id) => categories[id])
    .filter((cat) => cat.products.length > 0);
}

/**
 * Gets product counts by category for filter dropdown
 */
export function getProductCounts(products: BaseProduct[]): Record<string, number> {
  const counts: Record<string, number> = {};

  products.forEach((product) => {
    const type = product.productType || product.productCategory || "digital";
    counts[type] = (counts[type] || 0) + 1;
  });

  return counts;
}

/**
 * Gets category label for display
 */
export function getCategoryLabel(categoryId: string): string {
  const labels: Record<string, string> = {
    "beat-lease": "Beat",
    membership: "Membership",
    course: "Course",
    "tip-jar": "Tip Jar",
    "playlist-curation": "Playlist",
    coaching: "Coaching",
    abletonRack: "Ableton Rack",
    abletonPreset: "Ableton Preset",
    urlMedia: "Link",
    digitalProduct: "Digital Product",
    digital: "Digital Product",
    bundle: "Bundle",
  };

  return labels[categoryId] || categoryId;
}
