"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface AdminNavCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "secondary";
  color: string;
}

interface AdminCategoryPageProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  cards: AdminNavCard[];
}

export function AdminCategoryPage({
  title,
  description,
  icon: Icon,
  iconColor,
  cards,
}: AdminCategoryPageProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", iconColor)}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="group h-full cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="flex h-full items-start gap-4 p-6">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", card.color)}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold group-hover:text-primary">{card.title}</h3>
                    {card.badge && (
                      <Badge variant={card.badgeVariant || "secondary"} className="text-xs">
                        {card.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
