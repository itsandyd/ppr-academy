"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Info, Lightbulb, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldWithHelpProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "textarea" | "number" | "email" | "url";
  placeholder?: string;
  required?: boolean;
  help?: {
    description: string;
    examples: string[];
    tips?: string[];
    bestPractices?: string[];
  };
  error?: string;
  className?: string;
  rows?: number;
}

export function FormFieldWithHelp({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  help,
  error,
  className,
  rows = 4
}: FormFieldWithHelpProps) {
  const hasContent = value && value.toString().length > 0;
  const showError = error && !hasContent;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label with Help Icon */}
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="flex items-center gap-2">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>

        {help && (
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>Help</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent 
              className="w-96 bg-white dark:bg-black p-0 overflow-hidden"
              side="left"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                <h4 className="font-semibold text-sm">{label} - Tips & Examples</h4>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Description */}
                <div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {help.description}
                  </p>
                </div>

                {/* Examples */}
                {help.examples && help.examples.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-600" />
                      Examples
                    </div>
                    <div className="space-y-2">
                      {help.examples.map((example, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800"
                        >
                          <p className="text-sm">{example}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Best Practices */}
                {help.bestPractices && help.bestPractices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      Best Practices
                    </div>
                    <ul className="space-y-1.5">
                      {help.bestPractices.map((practice, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tips */}
                {help.tips && help.tips.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-medium mb-2">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      Pro Tips
                    </div>
                    <ul className="space-y-1.5">
                      {help.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>

      {/* Input Field */}
      {type === "textarea" ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "transition-all",
            showError && "border-red-500 focus-visible:ring-red-500",
            hasContent && "border-green-500 focus-visible:ring-green-500"
          )}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "transition-all",
            showError && "border-red-500 focus-visible:ring-red-500",
            hasContent && "border-green-500 focus-visible:ring-green-500"
          )}
        />
      )}

      {/* Error Message */}
      {showError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Character Count for Textarea */}
      {type === "textarea" && value && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{value.toString().length} characters</span>
          {help && (
            <Badge variant="secondary" className="text-xs">
              Recommended: 150-300 chars
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Preset help content for common course fields
export const courseFieldHelp = {
  title: {
    description: "Your course title should be clear, descriptive, and include your main topic. It's the first thing students see!",
    examples: [
      "Mastering Ableton Live: From Beginner to Pro",
      "Electronic Music Production in FL Studio",
      "Mixing & Mastering for Hip-Hop Beats"
    ],
    bestPractices: [
      "Include the main topic and skill level",
      "Keep it under 60 characters for SEO",
      "Use action words like 'Master', 'Learn', 'Create'",
      "Mention specific tools (DAW, plugins) if relevant"
    ],
    tips: [
      "Check what successful courses in your niche are titled",
      "Test your title with friends - can they understand what they'll learn?",
      "Avoid ALL CAPS or excessive punctuation"
    ]
  },
  description: {
    description: "Your description should explain what students will learn, who it's for, and what makes your course unique. This appears on the course landing page.",
    examples: [
      "Learn professional mixing techniques used by Grammy-winning engineers. Perfect for producers with basic DAW knowledge who want to take their tracks to the next level.",
      "A complete beginner's guide to music theory for electronic producers. No prior experience needed - start making better melodies today!",
      "Master advanced sound design in Serum. Create bass sounds that shake clubs and leads that cut through any mix."
    ],
    bestPractices: [
      "Start with the main benefit students will get",
      "Specify who the course is for (skill level)",
      "Mention what tools/software are needed",
      "Keep it between 150-300 characters",
      "Use short paragraphs for easy scanning"
    ],
    tips: [
      "Focus on outcomes, not just content (e.g., 'You'll be able to mix professional-sounding tracks' vs 'This course covers EQ and compression')",
      "Include a brief instructor bio if you have credentials",
      "Mention any bonus materials or community access"
    ]
  },
  price: {
    description: "Price your course based on its length, depth, and your experience. Research similar courses in your niche.",
    examples: [
      "$29 - Short course (1-2 hours)",
      "$79 - Medium course (3-5 hours)",
      "$197 - Comprehensive course (10+ hours)"
    ],
    bestPractices: [
      "Start lower to build reviews, then increase",
      "Offer early-bird discounts",
      "Consider a free introductory module",
      "Bundle related courses for higher value"
    ],
    tips: [
      "Students expect $10-20 per hour of content",
      "Your first course? Price competitively to get reviews",
      "Premium courses ($150+) should include community access or coaching"
    ]
  },
  moduleTitle: {
    description: "Module titles organize your course content. They should clearly describe what topic each section covers.",
    examples: [
      "Module 1: Introduction to Sound Design",
      "Module 2: Synthesis Basics - Oscillators & Filters",
      "Module 3: Creating Your First Bass Sound"
    ],
    bestPractices: [
      "Number your modules for clear progression",
      "Use descriptive titles, not just 'Part 1, Part 2'",
      "Keep modules focused on one main topic",
      "Aim for 3-7 lessons per module"
    ]
  },
  lessonTitle: {
    description: "Lesson titles should clearly state what skill or concept students will learn. Be specific!",
    examples: [
      "How to Use EQ to Remove Muddiness",
      "Setting Up Your MIDI Controller",
      "Creating a Sidechain Compression Effect"
    ],
    bestPractices: [
      "Start with action words: 'How to', 'Creating', 'Mastering'",
      "Be specific about what you're teaching",
      "Keep lesson titles under 50 characters",
      "Make each lesson feel achievable"
    ],
    tips: [
      "Students prefer short, focused lessons (5-15 min)",
      "Each lesson should teach ONE clear concept",
      "End lessons with a clear takeaway or action item"
    ]
  }
};

