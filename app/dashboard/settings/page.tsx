"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffectiveUserId } from "@/lib/impersonation-context";
import {
  Banknote,
  Bell,
  CreditCard,
  Globe,
  Package,
  Palette,
  Plug,
  Rocket,
  Store,
  User,
  Lock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SettingsCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  requiresPlan?: string[];
}

interface SettingsSection {
  title: string;
  cards: SettingsCard[];
}

const creatorSections: SettingsSection[] = [
  {
    title: "Payment Settings",
    cards: [
      {
        title: "Payments & Payouts",
        description: "Connect Stripe, view earnings, and request payouts",
        href: "/dashboard/settings/payouts",
        icon: Banknote,
        iconBg: "bg-green-100 dark:bg-green-900/20",
        iconColor: "text-green-600",
      },
    ],
  },
  {
    title: "Storefront Settings",
    cards: [
      {
        title: "Store Profile",
        description: "Edit your store name, bio, avatar, and banner",
        href: "/dashboard/profile",
        icon: Store,
        iconBg: "bg-indigo-100 dark:bg-indigo-900/20",
        iconColor: "text-indigo-600",
      },
      {
        title: "Branding",
        description: "Accent color, logo, and visual identity",
        href: "/dashboard/profile?tab=branding",
        icon: Palette,
        iconBg: "bg-pink-100 dark:bg-pink-900/20",
        iconColor: "text-pink-600",
      },
      {
        title: "Domains",
        description: "Custom domain for your storefront and email",
        href: "/dashboard/settings/domains",
        icon: Globe,
        iconBg: "bg-blue-100 dark:bg-blue-900/20",
        iconColor: "text-blue-600",
        requiresPlan: ["creator", "creator_pro", "business", "early_access"],
      },
      {
        title: "Integrations",
        description: "Connect Slack, Discord, and other services",
        href: "/dashboard/settings/integrations",
        icon: Plug,
        iconBg: "bg-purple-100 dark:bg-purple-900/20",
        iconColor: "text-purple-600",
      },
    ],
  },
  {
    title: "Account Settings",
    cards: [
      {
        title: "Plan & Billing",
        description: "Current plan, upgrade, and payment method",
        href: "/dashboard/pricing",
        icon: CreditCard,
        iconBg: "bg-amber-100 dark:bg-amber-900/20",
        iconColor: "text-amber-600",
      },
      {
        title: "Account",
        description: "Display name, email, and personal info",
        href: "/dashboard/settings/account",
        icon: User,
        iconBg: "bg-sky-100 dark:bg-sky-900/20",
        iconColor: "text-sky-600",
      },
      {
        title: "Notifications",
        description: "Email preferences and alert settings",
        href: "/dashboard/settings/notifications",
        icon: Bell,
        iconBg: "bg-orange-100 dark:bg-orange-900/20",
        iconColor: "text-orange-600",
      },
    ],
  },
];

const learnerSections: SettingsSection[] = [
  {
    title: "Account",
    cards: [
      {
        title: "Account",
        description: "Display name, email, and personal info",
        href: "/dashboard/settings/account",
        icon: User,
        iconBg: "bg-sky-100 dark:bg-sky-900/20",
        iconColor: "text-sky-600",
      },
      {
        title: "Notifications",
        description: "Email preferences and alert settings",
        href: "/dashboard/settings/notifications",
        icon: Bell,
        iconBg: "bg-orange-100 dark:bg-orange-900/20",
        iconColor: "text-orange-600",
      },
    ],
  },
  {
    title: "Purchases",
    cards: [
      {
        title: "My Orders",
        description: "View your orders and track their status",
        href: "/dashboard/my-orders",
        icon: Package,
        iconBg: "bg-violet-100 dark:bg-violet-900/20",
        iconColor: "text-violet-600",
      },
    ],
  },
];

const MODE_STORAGE_KEY = "dashboard-mode";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const effectiveUserId = useEffectiveUserId(user?.id);
  const store = useQuery(
    api.stores.getUserStore,
    effectiveUserId ? { userId: effectiveUserId } : "skip"
  );

  // Read the current dashboard mode — same logic as layout.tsx
  const [mode, setMode] = useState<"learn" | "create" | null>(null);

  useEffect(() => {
    const urlMode = searchParams.get("mode") as "learn" | "create" | null;
    if (urlMode) {
      setMode(urlMode);
    } else {
      const stored = localStorage.getItem(MODE_STORAGE_KEY);
      setMode(stored === "create" ? "create" : "learn");
    }
  }, [searchParams]);

  // A user is in creator-settings view if they're in create mode AND have a store.
  // Pure learners (no store) always see learner settings regardless of mode.
  const hasStore = !!store;
  const showCreatorSettings = mode === "create" && hasStore;
  const currentPlan = store?.plan || "free";
  const sections = showCreatorSettings ? creatorSections : learnerSections;

  const isPlanRestricted = (card: SettingsCard): boolean => {
    if (!card.requiresPlan) return false;
    return !card.requiresPlan.includes(currentPlan);
  };

  // Don't render until mode is resolved to prevent flash
  if (mode === null) return null;

  return (
    <div className="container mx-auto max-w-5xl space-y-10 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          {showCreatorSettings
            ? "Manage your account, storefront, and payment preferences"
            : "Manage your account and preferences"}
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {section.title}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.cards.map((card) => {
              const restricted = isPlanRestricted(card);

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className={cn(
                    "group relative rounded-lg border bg-card p-5 transition-all",
                    "hover:border-primary/30 hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    restricted && "opacity-75"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        card.iconBg
                      )}
                    >
                      <card.icon className={cn("h-5 w-5", card.iconColor)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {card.title}
                        </h3>
                        {restricted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Lock className="h-2.5 w-2.5" />
                            Pro
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-snug">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Become a Creator CTA — shown to learners who don't have a store */}
      {!hasStore && (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <Rocket className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Want to sell your own courses, beats, or presets?
                </p>
                <p className="text-sm text-muted-foreground">
                  Start your creator store for free and earn 90% revenue share
                </p>
              </div>
            </div>
            <Link
              href="/dashboard?mode=create"
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              Become a Creator
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
