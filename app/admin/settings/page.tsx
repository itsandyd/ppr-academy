"use client";

import { AdminCategoryPage } from "../components/AdminCategoryPage";
import { Settings, Shield, Bell, Database, Globe, CreditCard } from "lucide-react";

const settingsCards = [
  {
    title: "General",
    description: "Platform name, branding, and general configuration",
    href: "/admin/settings/general",
    icon: Globe,
    color: "bg-blue-500",
  },
  {
    title: "Security",
    description: "Authentication, permissions, and access control",
    href: "/admin/settings/security",
    icon: Shield,
    color: "bg-red-500",
  },
  {
    title: "Notifications",
    description: "Email templates and notification preferences",
    href: "/admin/settings/notifications",
    icon: Bell,
    color: "bg-orange-500",
  },
  {
    title: "Database",
    description: "Data management and backup settings",
    href: "/admin/settings/database",
    icon: Database,
    color: "bg-purple-500",
  },
  {
    title: "Billing",
    description: "Stripe configuration and payment settings",
    href: "/admin/settings/billing",
    icon: CreditCard,
    color: "bg-green-500",
  },
];

export default function AdminSettingsPage() {
  return (
    <AdminCategoryPage
      title="Settings"
      description="Configure platform settings and preferences"
      icon={Settings}
      iconColor="bg-slate-500"
      cards={settingsCards}
    />
  );
}
