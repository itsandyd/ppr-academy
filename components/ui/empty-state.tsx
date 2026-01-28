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
        compact ? "py-8" : "py-12",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted/50 flex items-center justify-center",
          compact ? "h-10 w-10" : "h-14 w-14"
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground/50",
            compact ? "h-5 w-5" : "h-7 w-7"
          )}
        />
      </div>
      <h3
        className={cn(
          "font-medium text-foreground",
          compact ? "mt-3 text-sm" : "mt-4 text-lg"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-sm",
            compact ? "mt-1 text-xs" : "mt-2 text-sm"
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className={compact ? "mt-3" : "mt-4"}>
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
  title = "No contacts yet",
  description = "Add contacts to your list to start building your audience",
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Users}
      title={title}
      description={description}
      action={action || { label: "Add Contact", href: "/dashboard/contacts/new" }}
      {...props}
    />
  );
}

export function NoEmailsEmptyState({
  title = "No emails sent",
  description = "Your sent emails and their status will appear here",
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Mail}
      title={title}
      description={description}
      action={action || { label: "Send Email", href: "/dashboard/emails/compose" }}
      {...props}
    />
  );
}

export function NoCoursesEmptyState({
  title = "No courses yet",
  description = "Create your first course to start teaching",
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={FileText}
      title={title}
      description={description}
      action={action || { label: "Create Course", href: "/dashboard/courses/create" }}
      {...props}
    />
  );
}

export function NoProductsEmptyState({
  title = "No products yet",
  description = "Create your first digital product to start selling",
  action,
  ...props
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon={Package}
      title={title}
      description={description}
      action={action || { label: "Create Product", href: "/dashboard/products/create" }}
      {...props}
    />
  );
}

export default EmptyState;
