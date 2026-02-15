"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon, Sparkles, ArrowRight, BookOpen, Video, FileText } from "lucide-react";
import Link from "next/link";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  icon?: LucideIcon;
}

export interface EmptyStateTip {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export interface EmptyStateExample {
  title: string;
  description: string;
  badge?: string;
}

interface EmptyStateEnhancedProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  tips?: EmptyStateTip[];
  examples?: EmptyStateExample[];
  showSuccessMetric?: {
    label: string;
    value: string;
  };
  variant?: "default" | "compact";
  className?: string;
}

export function EmptyStateEnhanced({
  icon: Icon,
  title,
  description,
  actions = [],
  tips = [],
  examples = [],
  showSuccessMetric,
  variant = "default",
  className
}: EmptyStateEnhancedProps) {
  const isCompact = variant === "compact";

  return (
    <Card className={cn("bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-900/50 dark:to-purple-900/10 border-dashed", className)}>
      <CardContent className={cn("text-center", isCompact ? "p-8" : "p-12")}>
        {/* Icon */}
        <div className={cn(
          "mx-auto rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center mb-6",
          isCompact ? "w-16 h-16" : "w-24 h-24"
        )}>
          <Icon className={cn(
            "text-purple-600 dark:text-purple-400",
            isCompact ? "w-8 h-8" : "w-12 h-12"
          )} />
        </div>

        {/* Title & Description */}
        <div className="max-w-md mx-auto mb-6">
          <h3 className={cn(
            "font-bold text-foreground mb-2",
            isCompact ? "text-lg" : "text-2xl"
          )}>
            {title}
          </h3>
          <p className={cn(
            "text-muted-foreground",
            isCompact ? "text-sm" : "text-base"
          )}>
            {description}
          </p>
        </div>

        {/* Success Metric */}
        {showSuccessMetric && (
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>{showSuccessMetric.label}: <strong>{showSuccessMetric.value}</strong></span>
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            {actions.map((action, i) => {
              const ActionIcon = action.icon;
              const button = (
                <Button
                  key={i}
                  variant={action.variant || (i === 0 ? "default" : "outline")}
                  size={isCompact ? "default" : "lg"}
                  onClick={action.onClick}
                  className="gap-2"
                >
                  {ActionIcon && <ActionIcon className="w-4 h-4" />}
                  {action.label}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              );

              return action.href ? (
                <Link key={i} href={action.href}>
                  {button}
                </Link>
              ) : (
                button
              );
            })}
          </div>
        )}

        {/* Tips */}
        {tips.length > 0 && !isCompact && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-2 justify-center mb-4">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h4 className="font-semibold text-sm text-foreground">Getting Started Tips</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tips.map((tip, i) => {
                const TipIcon = tip.icon || Sparkles;
                return (
                  <div
                    key={i}
                    className="bg-card rounded-lg p-4 text-left border border-border hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-3">
                      <TipIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h5 className="font-medium text-sm mb-1">{tip.title}</h5>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Examples */}
        {examples.length > 0 && !isCompact && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 justify-center mb-4">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-sm text-foreground">Popular Examples</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map((example, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-black rounded-lg p-4 text-left border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-sm">{example.title}</h5>
                    {example.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {example.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{example.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Preset Empty States for Common Scenarios
export function NoProductsEmptyState({ storeId }: { storeId?: string }) {
  return (
    <EmptyStateEnhanced
      icon={BookOpen}
      title="No products yet"
      description="Start earning by creating your first digital product. Choose from sample packs, presets, courses, and more."
      showSuccessMetric={{
        label: "Average creator's first month",
        value: "$247"
      }}
      actions={[
        {
          label: "Create Product",
          href: storeId ? `/store/${storeId}/products` : '/dashboard',
          icon: Sparkles
        },
        {
          label: "Create Course",
          href: storeId ? `/store/${storeId}/course/create` : '/dashboard',
          variant: "outline",
          icon: Video
        }
      ]}
      tips={[
        {
          icon: BookOpen,
          title: "Start Small",
          description: "Your first product doesn't need to be perfect. Start with a simple sample pack or preset collection."
        },
        {
          icon: Video,
          title: "Show Your Process",
          description: "Record your screen while making music. Turn that into a course or tutorial series."
        },
        {
          icon: FileText,
          title: "Package Your Knowledge",
          description: "Share techniques you use daily. Your unique workflow has value to others."
        }
      ]}
      examples={[
        {
          title: "808 Drum Kit - 50 Samples",
          description: "High-quality kick drums, snares, and hi-hats",
          badge: "$29"
        },
        {
          title: "Serum Bass Presets - 30 Pack",
          description: "Heavy bass sounds for trap and dubstep",
          badge: "$19"
        },
        {
          title: "Mixing Masterclass Course",
          description: "10 video lessons on professional mixing",
          badge: "$97"
        },
        {
          title: "1-Hour Coaching Session",
          description: "Personalized feedback on your tracks",
          badge: "$75"
        }
      ]}
    />
  );
}

export function NoCoursesEmptyState() {
  return (
    <EmptyStateEnhanced
      icon={BookOpen}
      title="No courses yet"
      description="Start your learning journey by purchasing your first course from our marketplace."
      actions={[
        {
          label: "Browse Courses",
          href: "/courses",
          icon: BookOpen
        },
        {
          label: "View All Products",
          href: "/",
          variant: "outline"
        }
      ]}
      tips={[
        {
          icon: BookOpen,
          title: "Filter by Level",
          description: "Find courses matching your skill level from beginner to advanced."
        },
        {
          icon: Video,
          title: "Preview Lessons",
          description: "Watch free preview videos before committing to a course."
        },
        {
          icon: FileText,
          title: "Earn Certificates",
          description: "Complete courses to earn certificates you can showcase."
        }
      ]}
    />
  );
}

export function NoSamplesEmptyState({ storeId }: { storeId?: string }) {
  return (
    <EmptyStateEnhanced
      icon={Video}
      title="No samples yet"
      description="Upload your first audio samples to start building your library and earning revenue."
      showSuccessMetric={{
        label: "Top sample packs earn",
        value: "$500+/month"
      }}
      actions={[
        {
          label: "Upload Samples",
          href: storeId ? `/store/${storeId}/samples/upload` : '/dashboard',
          icon: Sparkles
        }
      ]}
      tips={[
        {
          title: "Organize by Type",
          description: "Group samples into kicks, snares, hi-hats, loops, etc."
        },
        {
          title: "Clear Naming",
          description: "Name files clearly: 'kick_808_hard_01.wav'"
        },
        {
          title: "Include Demo",
          description: "Create a beat showcasing your samples in action."
        }
      ]}
    />
  );
}

