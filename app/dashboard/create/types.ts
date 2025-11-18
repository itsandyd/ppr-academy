/**
 * Unified Product Creation - Type Definitions
 * Consolidates all product types into a clean, maintainable system
 */

export type ProductType = 
  | "digital"
  | "playlistCuration"
  | "effectChain"  // Renamed from abletonRack
  | "coaching"
  | "urlMedia";

export type DAWType = 
  | "ableton"
  | "fl-studio"
  | "logic"
  | "bitwig"
  | "studio-one"
  | "reason"
  | "cubase"
  | "multi-daw";

export type PDFType =
  | "cheat-sheet"  // 1-5 pages, quick reference
  | "guide"        // 10-50 pages, educational
  | "ebook"        // 50+ pages, comprehensive
  | "workbook"     // Interactive exercises
  | "template"     // Fillable templates
  | "other";

export type ProductCategory = 
  // Music Production
  | "sample-pack"
  | "preset-pack"
  | "midi-pack"
  | "bundle"
  | "effect-chain"  // Renamed from ableton-rack
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
  | "pdf"  // Consolidated: PDF guides, cheat sheets, ebooks, workbooks
  | "blog-post"
  // Community
  | "community"
  // Support
  | "tip-jar"
  | "donation";

export type PricingModel = "free_with_gate" | "paid";

export type CreationFlow = "digital" | "course" | "service" | "bundle" | "chain";

// Map product categories to their creation flow
export const CATEGORY_TO_FLOW: Record<ProductCategory, CreationFlow> = {
  // Digital products (most common)
  "sample-pack": "digital",
  "preset-pack": "digital",
  "midi-pack": "digital",
  "beat-lease": "digital",
  "project-files": "digital",
  "mixing-template": "digital",
  "pdf": "digital",  // Consolidated PDF category
  "blog-post": "digital",
  "community": "digital",
  "tip-jar": "digital",
  "donation": "digital",
  "effect-chain": "chain",  // New dedicated flow
  "masterclass": "digital",
  
  // Course (unique lesson builder)
  "course": "course",
  
  // Services (all need scheduling)
  "coaching": "service",
  "mixing-service": "service",
  "mastering-service": "service",
  "workshop": "service",
  "playlist-curation": "service",
  
  // Bundle (unique product selector)
  "bundle": "bundle",
};

// Product info for type selector
export const PRODUCT_CATEGORIES = [
  // Music Production
  {
    id: "sample-pack",
    label: "Sample Pack",
    description: "Audio samples & loops",
    category: "Music Production",
    icon: "🎵",
    flow: "digital" as CreationFlow,
  },
  {
    id: "preset-pack",
    label: "Preset Pack",
    description: "Synth presets (Serum, Vital, etc.)",
    category: "Music Production",
    icon: "🎛️",
    flow: "digital" as CreationFlow,
  },
  {
    id: "midi-pack",
    label: "MIDI Pack",
    description: "MIDI files & melodies",
    category: "Music Production",
    icon: "🎹",
    flow: "digital" as CreationFlow,
  },
  {
    id: "effect-chain",
    label: "Effect Chain",
    description: "Audio effect chains for Ableton, FL Studio, Logic, and more",
    category: "Music Production",
    icon: "🔊",
    flow: "chain" as CreationFlow,
  },
  {
    id: "beat-lease",
    label: "Beat Lease",
    description: "Exclusive/non-exclusive beats",
    category: "Music Production",
    icon: "🎹",
    flow: "digital" as CreationFlow,
  },
  {
    id: "project-files",
    label: "Project Files",
    description: "DAW project templates",
    category: "Music Production",
    icon: "📁",
    flow: "digital" as CreationFlow,
  },
  {
    id: "mixing-template",
    label: "Mixing Template",
    description: "Processing chains & templates",
    category: "Music Production",
    icon: "🎚️",
    flow: "digital" as CreationFlow,
  },
  {
    id: "bundle",
    label: "Bundle",
    description: "Combine multiple products",
    category: "Music Production",
    icon: "📦",
    flow: "bundle" as CreationFlow,
  },
  
  // Education
  {
    id: "course",
    label: "Online Course",
    description: "Educational courses with lessons",
    category: "Education",
    icon: "🎓",
    flow: "course" as CreationFlow,
  },
  {
    id: "workshop",
    label: "Workshop",
    description: "Live group workshops",
    category: "Education",
    icon: "👥",
    flow: "service" as CreationFlow,
  },
  {
    id: "masterclass",
    label: "Masterclass",
    description: "Premium masterclass content",
    category: "Education",
    icon: "⭐",
    flow: "digital" as CreationFlow,
  },
  {
    id: "pdf",
    label: "PDF",
    description: "Educational PDFs, cheat sheets, guides, and ebooks",
    category: "Digital Content",
    icon: "📄",
    flow: "digital" as CreationFlow,
  },
  
  // Services
  {
    id: "coaching",
    label: "Coaching Session",
    description: "1:1 coaching calls",
    category: "Services",
    icon: "💬",
    flow: "service" as CreationFlow,
  },
  {
    id: "mixing-service",
    label: "Mixing Service",
    description: "Professional mixing",
    category: "Services",
    icon: "🎚️",
    flow: "service" as CreationFlow,
  },
  {
    id: "mastering-service",
    label: "Mastering Service",
    description: "Professional mastering",
    category: "Services",
    icon: "💿",
    flow: "service" as CreationFlow,
  },
  {
    id: "playlist-curation",
    label: "Playlist Curation",
    description: "Review & feature tracks",
    category: "Services",
    icon: "🎼",
    flow: "service" as CreationFlow,
  },
  
  // Digital Content
  {
    id: "cheat-sheet",
    label: "Cheat Sheet",
    description: "Quick reference guides",
    category: "Digital Content",
    icon: "📋",
    flow: "digital" as CreationFlow,
  },
  {
    id: "template",
    label: "Template",
    description: "Design templates & assets",
    category: "Digital Content",
    icon: "🎨",
    flow: "digital" as CreationFlow,
  },
  {
    id: "blog-post",
    label: "Blog Post",
    description: "Articles & written content",
    category: "Digital Content",
    icon: "📝",
    flow: "digital" as CreationFlow,
  },
  
  // Community
  {
    id: "community",
    label: "Community Access",
    description: "Discord or exclusive community",
    category: "Community",
    icon: "👥",
    flow: "digital" as CreationFlow,
  },
  
  // Support
  {
    id: "tip-jar",
    label: "Tip Jar",
    description: "Pay what you want",
    category: "Support",
    icon: "☕",
    flow: "digital" as CreationFlow,
  },
  {
    id: "donation",
    label: "Donation",
    description: "One-time or recurring",
    category: "Support",
    icon: "💝",
    flow: "digital" as CreationFlow,
  },
] as const;

// Helper to get flow from category
export function getFlowForCategory(category: ProductCategory): CreationFlow {
  return CATEGORY_TO_FLOW[category];
}

// Helper to get product info
export function getProductInfo(categoryId: ProductCategory) {
  return PRODUCT_CATEGORIES.find(p => p.id === categoryId);
}

// Step configuration interface
export interface StepConfig {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  component: React.ComponentType<any>;
  conditional?: 'paid' | 'free' | boolean;
  estimatedTime?: string;
}

// Common form data structure
export interface BaseProductFormData {
  // Identity
  productCategory: ProductCategory;
  productType: ProductType;
  
  // Core fields
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  
  // Pricing
  pricingModel: PricingModel;
  price: number;
  
  // DAW-specific (for effect chains)
  dawType?: DAWType;
  dawVersion?: string;
  
  // PDF-specific (for pdf category)
  pdfType?: PDFType;
  pageCount?: number;
  fileSize?: number;  // in bytes
  
  // Meta
  storeId: string;
  userId: string;
  currentStep: number;
}

// DAW information for effect chains
export const DAW_TYPES = [
  {
    id: "ableton" as DAWType,
    label: "Ableton Live",
    extensions: [".adg", ".adv", ".alp"],
    icon: "🔊",
    description: "Effect Racks, Instrument Racks, Audio Effects"
  },
  {
    id: "fl-studio" as DAWType,
    label: "FL Studio",
    extensions: [".fnp", ".flp", ".fst"],
    icon: "🎚️",
    description: "Patcher presets, Mixer presets"
  },
  {
    id: "logic" as DAWType,
    label: "Logic Pro",
    extensions: [".cst", ".logicx"],
    icon: "🎹",
    description: "Channel Strip Settings, Smart Controls"
  },
  {
    id: "bitwig" as DAWType,
    label: "Bitwig Studio",
    extensions: [".bwpreset"],
    icon: "⚡",
    description: "Device Chains, FX Chains"
  },
  {
    id: "studio-one" as DAWType,
    label: "Studio One",
    extensions: [".fxchain", ".multipreset"],
    icon: "🎼",
    description: "FX Chains, Multi-Instruments"
  },
  {
    id: "reason" as DAWType,
    label: "Reason",
    extensions: [".cmb", ".rcmb"],
    icon: "🔌",
    description: "Combinator patches, Rack Extensions"
  },
  {
    id: "cubase" as DAWType,
    label: "Cubase",
    extensions: [".vstpreset", ".trackpreset"],
    icon: "🎛️",
    description: "Track Presets, VST Presets"
  },
  {
    id: "multi-daw" as DAWType,
    label: "Multi-DAW",
    extensions: [".wav", ".mp3", ".pdf"],
    icon: "🔗",
    description: "Works in any DAW (frozen audio or instructions)"
  },
] as const;

