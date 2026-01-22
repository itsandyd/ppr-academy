"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ProductSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * ProductSection - A section wrapper for grouping products by type
 * Displays a header with icon, title, and description
 */
export function ProductSection({
  title,
  description,
  icon: IconComponent,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  children,
  className,
}: ProductSectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconBgColor)}>
          <IconComponent className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>

      {/* Section content */}
      {children}
    </section>
  );
}
