"use client";

import { LucideIcon, Inbox, FileText, Users, Mail, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-14 px-6",
        className
      )}
    >
      <div
        className={cn(
          "relative rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-zinc-100 via-zinc-50 to-stone-100",
          "dark:from-zinc-800/60 dark:via-zinc-800/40 dark:to-zinc-900/60",
          "shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]",
          "ring-1 ring-zinc-200/60 dark:ring-zinc-700/40",
          compact ? "h-11 w-11 rounded-xl" : "h-16 w-16"
        )}
      >
        <Icon
          className={cn(
            "text-zinc-500 dark:text-zinc-400",
            compact ? "h-5 w-5" : "h-7 w-7"
          )}
          strokeWidth={1.5}
        />
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground tracking-tight",
          compact ? "mt-3 text-sm" : "mt-5 text-lg"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-[340px] leading-relaxed",
            compact ? "mt-1 text-xs" : "mt-2 text-[13px]"
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className={compact ? "mt-3" : "mt-5"}>
          {action.href ? (
            <Button asChild size={compact ? "sm" : "default"}>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size={compact ? "sm" : "default"} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function NoDataEmptyState({
  title = "No data yet",
  description = "Data will appear here once available",
  ...props
}: Partial<EmptyStateProps>) {
  return <EmptyState icon={Inbox} title={title} description={description} {...props} />;
}

export function NoContactsEmptyState({
  title = "Build your audience",
  description = "Import your email list or embed a signup form on your store. Every subscriber is a potential customer.",
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Users}
      title={title}
      description={description}
      action={action || { label: "Import Contacts", href: "/dashboard/emails/setup" }}
      {...props}
    />
  );
}

export function NoEmailsEmptyState({
  title = "Send your first email campaign",
  description = "Reach your fans directly. Announce releases, share updates, and drive sales with targeted email campaigns.",
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Mail}
      title={title}
      description={description}
      action={action || { label: "Create Campaign", href: "/dashboard/emails/campaigns" }}
      {...props}
    />
  );
}

export function NoCoursesEmptyState({
  title = "Teach what you know",
  description = "Turn your production skills into a course. Add video lessons, quizzes, and earn from every enrollment.",
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={FileText}
      title={title}
      description={description}
      action={action || { label: "Create Course", href: "/dashboard/create/course?category=course" }}
      {...props}
    />
  );
}

export function NoProductsEmptyState({
  title = "List your first product",
  description = "Sell beats, sample packs, presets, courses, coaching, and more. Your first product can be live in minutes.",
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Package}
      title={title}
      description={description}
      action={action || { label: "Create Product", href: "/dashboard/create" }}
      {...props}
    />
  );
}

export default EmptyState;
