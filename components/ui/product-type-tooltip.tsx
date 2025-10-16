"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  Package, 
  Headphones, 
  Play, 
  DollarSign,
  Gift,
  Calendar,
  Layers,
  Info,
  Clock,
  TrendingUp,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductTypeInfo {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  examples: string[];
  typicalPrice: string;
  timeToCreate: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  bestFor: string;
  tips: string[];
}

export const productTypes: Record<string, ProductTypeInfo> = {
  samplePack: {
    id: "sample-pack",
    name: "Sample Pack",
    icon: Music,
    description: "Collections of audio files like drums, loops, one-shots, and vocal samples that producers can use in their music.",
    examples: ["808 Drum Kit", "Lo-Fi Piano Loops", "Vocal Chops Pack", "Synth Presets Collection"],
    typicalPrice: "$15 - $50",
    timeToCreate: "2-5 hours",
    difficulty: "Easy",
    bestFor: "Producers with a library of original sounds",
    tips: [
      "Include at least 50-100 samples for good value",
      "Organize in folders by type (kicks, snares, loops)",
      "Name files clearly (e.g., 'kick_808_hard_01.wav')",
      "Include a demo track showing samples in action"
    ]
  },
  presetPack: {
    id: "preset-pack",
    name: "Preset Pack",
    icon: Package,
    description: "Saved settings for synthesizers and effects plugins that create specific sounds instantly.",
    examples: ["Serum Bass Presets", "Massive X Leads", "Reverb Settings Pack", "FL Studio Channel Presets"],
    typicalPrice: "$10 - $40",
    timeToCreate: "3-6 hours",
    difficulty: "Medium",
    bestFor: "Sound designers with unique signature sounds",
    tips: [
      "Create 30-50 presets minimum",
      "Test presets in different musical contexts",
      "Include preset bank file + installation guide",
      "Name presets descriptively (e.g., 'Aggressive_Reese_Bass')"
    ]
  },
  coachingCall: {
    id: "coaching-call",
    name: "Coaching Call",
    icon: Headphones,
    description: "One-on-one mentoring sessions where you provide personalized feedback, training, or consultation.",
    examples: ["Mix Feedback Session", "Beat Making Masterclass", "Career Advice Call", "Plugin Tutorial"],
    typicalPrice: "$50 - $300/hour",
    timeToCreate: "1 hour per session",
    difficulty: "Easy",
    bestFor: "Experienced producers who enjoy teaching",
    tips: [
      "Set clear expectations for session duration",
      "Use Zoom/Discord for screen sharing",
      "Record session (with permission) for student reference",
      "Prepare agenda but allow flexibility"
    ]
  },
  musicCourse: {
    id: "music-course",
    name: "Music Course",
    icon: Play,
    description: "Structured series of video lessons teaching a specific skill or technique in music production.",
    examples: ["Mixing 101", "FL Studio for Beginners", "Mastering Hip-Hop Beats", "Music Theory Essentials"],
    typicalPrice: "$50 - $200",
    timeToCreate: "20-40 hours",
    difficulty: "Advanced",
    bestFor: "Educators with proven teaching ability",
    tips: [
      "Start with 10-20 lessons minimum",
      "Each lesson should be 5-15 minutes",
      "Include project files and resources",
      "Add quizzes to test understanding",
      "Offer completion certificate"
    ]
  },
  beatLease: {
    id: "beat-lease",
    name: "Beat Lease",
    icon: DollarSign,
    description: "License your instrumental tracks to artists for use in their songs with specific usage rights.",
    examples: ["Trap Beat - 'Midnight'", "R&B Beat - 'Vibes'", "Drill Beat - 'City Lights'"],
    typicalPrice: "$20 - $100 per lease",
    timeToCreate: "2-4 hours per beat",
    difficulty: "Medium",
    bestFor: "Beat makers and producers",
    tips: [
      "Offer multiple license tiers (basic, premium, exclusive)",
      "Include tagged preview + untagged files after purchase",
      "Provide stems for higher-tier licenses",
      "State BPM, key, and genre clearly"
    ]
  },
  workshop: {
    id: "workshop",
    name: "Workshop",
    icon: Calendar,
    description: "Live or recorded group sessions teaching specific techniques or hosting Q&A.",
    examples: ["Live Sound Design Workshop", "Mixing Q&A Session", "Genre Deconstruction", "Plugin Deep Dive"],
    typicalPrice: "$15 - $75 per attendee",
    timeToCreate: "2-3 hours prep + session",
    difficulty: "Medium",
    bestFor: "Teachers comfortable with live presentations",
    tips: [
      "Limit to 10-30 attendees for interactivity",
      "Have backup plan for technical issues",
      "Record for replay value",
      "Provide downloadable resources"
    ]
  },
  leadMagnet: {
    id: "lead-magnet",
    name: "Lead Magnet",
    icon: Gift,
    description: "Free content offered in exchange for email addresses to build your audience.",
    examples: ["Free Drum Kit", "Mixing Cheatsheet PDF", "Sample Project File", "Email Course"],
    typicalPrice: "Free",
    timeToCreate: "1-3 hours",
    difficulty: "Easy",
    bestFor: "Anyone building an email list",
    tips: [
      "Make it genuinely valuable, not throwaway content",
      "Deliver instantly via automated email",
      "Follow up with welcome sequence",
      "Promote your paid products after building trust"
    ]
  },
  bundle: {
    id: "bundle",
    name: "Product Bundle",
    icon: Layers,
    description: "Combine multiple products at a discounted price for increased value.",
    examples: ["Complete Production Pack", "Beginner's Bundle", "Genre Starter Kit", "Master Collection"],
    typicalPrice: "20-30% off individual prices",
    timeToCreate: "1 hour to package",
    difficulty: "Easy",
    bestFor: "Creators with multiple existing products",
    tips: [
      "Bundle complementary products",
      "Clearly show savings compared to buying separately",
      "Create unique bundle artwork",
      "Offer time-limited bundle deals"
    ]
  }
};

interface ProductTypeTooltipProps {
  productTypeId: keyof typeof productTypes;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function ProductTypeTooltip({ 
  productTypeId, 
  children, 
  side = "right",
  className 
}: ProductTypeTooltipProps) {
  const productType = productTypes[productTypeId];
  
  if (!productType) return children || null;

  const Icon = productType.icon;

  const difficultyColors = {
    Easy: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    Advanced: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  };

  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>
        {children || (
          <button className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors group",
            className
          )}>
            <Icon className="w-4 h-4" />
            {productType.name}
            <Info className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
          </button>
        )}
      </HoverCardTrigger>
      <HoverCardContent 
        side={side}
        className="w-96 bg-white dark:bg-black p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{productType.name}</h4>
              <Badge className={cn("mt-1", difficultyColors[productType.difficulty])}>
                {productType.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {productType.description}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-green-600" />
              <div>
                <div className="text-muted-foreground">Typical Price</div>
                <div className="font-medium">{productType.typicalPrice}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <div>
                <div className="text-muted-foreground">Time to Create</div>
                <div className="font-medium">{productType.timeToCreate}</div>
              </div>
            </div>
          </div>

          {/* Best For */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              Best For
            </div>
            <p className="text-sm text-muted-foreground bg-purple-50 dark:bg-purple-900/10 rounded-lg p-2">
              {productType.bestFor}
            </p>
          </div>

          {/* Examples */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium mb-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-600" />
              Examples
            </div>
            <div className="flex flex-wrap gap-1.5">
              {productType.examples.map((example, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Pro Tips
            </div>
            <ul className="space-y-1.5">
              {productType.tips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Quick Reference Component
export function ProductTypeGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {Object.entries(productTypes).map(([id, type]) => {
        const Icon = type.icon;
        return (
          <ProductTypeTooltip key={id} productTypeId={id as keyof typeof productTypes}>
            <div className="group cursor-help p-4 border rounded-lg hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{type.name}</div>
                  <div className="text-xs text-muted-foreground">{type.typicalPrice}</div>
                </div>
                <Info className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </ProductTypeTooltip>
        );
      })}
    </div>
  );
}

