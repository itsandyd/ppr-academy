"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Banknote,
  Bell,
  CreditCard,
  Globe,
  Palette,
  Plug,
  Store,
  User,
  Lock,
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

const sections: SettingsSection[] = [
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

export default function SettingsPage() {
  const { user } = useUser();
  const store = useQuery(
    api.stores.getUserStore,
    user?.id ? { userId: user.id } : "skip"
  );

  const currentPlan = store?.plan || "free";

  const isPlanRestricted = (card: SettingsCard): boolean => {
    if (!card.requiresPlan) return false;
    return !card.requiresPlan.includes(currentPlan);
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-10 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, storefront, and payment preferences
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
    </div>
  );
}
