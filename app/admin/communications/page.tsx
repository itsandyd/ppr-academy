"use client";

import { AdminCategoryPage } from "../components/AdminCategoryPage";
import { MessageSquare, Mail, Server, Bell, GitCommit } from "lucide-react";

const communicationsCards = [
  {
    title: "Email Marketing",
    description: "Create and manage email campaigns for user engagement",
    href: "/admin/emails",
    icon: Mail,
    color: "bg-blue-500",
  },
  {
    title: "Email Monitor",
    description: "Track email deliverability, bounces, and performance",
    href: "/admin/email-monitoring",
    icon: Server,
    color: "bg-purple-500",
  },
  {
    title: "Notifications",
    description: "Manage push notifications and in-app alerts",
    href: "/admin/notifications",
    icon: Bell,
    color: "bg-orange-500",
  },
  {
    title: "Changelog",
    description: "Publish release notes and platform updates",
    href: "/admin/changelog",
    icon: GitCommit,
    color: "bg-green-500",
    badge: "NEW",
  },
];

export default function CommunicationsPage() {
  return (
    <AdminCategoryPage
      title="Communications"
      description="Manage emails, notifications, and platform announcements"
      icon={MessageSquare}
      iconColor="bg-orange-500"
      cards={communicationsCards}
    />
  );
}
