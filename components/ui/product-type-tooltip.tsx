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
  Zap,
  Disc3,
  FileAudio,
  Mic2,
  Radio,
  BookOpen
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
  },
  projectFile: {
    id: "project-file",
    name: "DAW Project File",
    icon: FileAudio,
    description: "Full production sessions from your DAW (Ableton, FL Studio, Logic) for students to learn from.",
    examples: ["Trap Beat Breakdown", "Deep House Project", "Mix Template", "Sound Design Session"],
    typicalPrice: "$20 - $100",
    timeToCreate: "1-2 hours to organize",
    difficulty: "Easy",
    bestFor: "Producers willing to share their workflow",
    tips: [
      "Clean up project file before sharing",
      "Include all samples and presets used",
      "Add notes explaining your process",
      "Specify DAW version compatibility",
      "Consider offering multi-DAW versions"
    ]
  },
  midiPack: {
    id: "midi-pack",
    name: "MIDI Pack",
    icon: Disc3,
    description: "Collections of MIDI files with melodies, chord progressions, and patterns ready to use.",
    examples: ["Trap Melody Pack", "Chord Progressions Bundle", "Piano MIDI Collection", "Guitar Patterns"],
    typicalPrice: "$10 - $35",
    timeToCreate: "2-4 hours",
    difficulty: "Easy",
    bestFor: "Melody makers and music theory enthusiasts",
    tips: [
      "Include 30-50 MIDI files minimum",
      "Organize by key and BPM",
      "Provide both loops and one-shots",
      "Include MIDI to audio demo previews"
    ]
  },
  mixingTemplate: {
    id: "mixing-template",
    name: "Mixing Template",
    icon: Radio,
    description: "Pre-configured mixing sessions with effect chains, routing, and professional settings.",
    examples: ["Vocal Chain Template", "Mastering Chain", "Drum Bus Processing", "Mix Bus Setup"],
    typicalPrice: "$15 - $60",
    timeToCreate: "3-5 hours",
    difficulty: "Medium",
    bestFor: "Mixing engineers with signature sound",
    tips: [
      "Include preset files for all plugins used",
      "Document each processing step",
      "Provide before/after audio examples",
      "List required plugins clearly"
    ]
  },
  masterclass: {
    id: "masterclass",
    name: "Masterclass",
    icon: Mic2,
    description: "Premium in-depth workshop or webinar covering advanced techniques over multiple sessions.",
    examples: ["Sound Design Masterclass", "Mixing & Mastering Intensive", "Genre Production Series"],
    typicalPrice: "$100 - $500",
    timeToCreate: "15-30 hours",
    difficulty: "Advanced",
    bestFor: "Expert producers with proven track record",
    tips: [
      "Include 4-8 hours of content minimum",
      "Provide downloadable project files",
      "Offer live Q&A sessions",
      "Create private community for attendees",
      "Issue completion certificate"
    ]
  },
  membership: {
    id: "membership",
    name: "Membership",
    icon: BookOpen,
    description: "Monthly subscription giving ongoing access to exclusive content, samples, and community.",
    examples: ["Sample of the Month Club", "Production Tips Membership", "VIP Discord Access"],
    typicalPrice: "$10 - $50/month",
    timeToCreate: "Ongoing content creation",
    difficulty: "Advanced",
    bestFor: "Creators who can produce regular content",
    tips: [
      "Provide consistent monthly value",
      "Create exclusive member-only content",
      "Build community engagement",
      "Offer annual discount (2-3 months free)",
      "Have content calendar planned"
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
        align="center"
        className="w-[90vw] max-w-sm md:w-96 bg-white dark:bg-black p-0 overflow-hidden border-2 z-50"
        sideOffset={5}
        alignOffset={0}
        avoidCollisions={true}
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
        <div className="p-3 md:p-4 space-y-3 md:space-y-4 max-h-[60vh] md:max-h-none overflow-y-auto">
          {/* Description */}
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            {productType.description}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-1.5 md:gap-2">
              <DollarSign className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] md:text-xs">
                <div className="text-muted-foreground">Typical Price</div>
                <div className="font-medium text-foreground">{productType.typicalPrice}</div>
              </div>
            </div>
            <div className="flex items-start gap-1.5 md:gap-2">
              <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] md:text-xs">
                <div className="text-muted-foreground">Time to Create</div>
                <div className="font-medium text-foreground">{productType.timeToCreate}</div>
              </div>
            </div>
          </div>

          {/* Best For */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium mb-1.5">
              <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600" />
              Best For
            </div>
            <p className="text-xs md:text-sm text-muted-foreground bg-purple-50 dark:bg-purple-900/10 rounded-lg p-2">
              {productType.bestFor}
            </p>
          </div>

          {/* Examples */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium mb-1.5">
              <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-600" />
              Examples
            </div>
            <div className="flex flex-wrap gap-1">
              {productType.examples.map((example, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] md:text-xs">
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-medium mb-2">
              <Info className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" />
              Pro Tips
            </div>
            <ul className="space-y-1 md:space-y-1.5">
              {productType.tips.slice(0, 3).map((tip, i) => (
                <li key={i} className="text-[10px] md:text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
              {productType.tips.length > 3 && (
                <li className="text-[10px] md:text-xs text-muted-foreground italic">
                  +{productType.tips.length - 3} more tips...
                </li>
              )}
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

