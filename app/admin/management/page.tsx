"use client";

import { AdminCategoryPage } from "../components/AdminCategoryPage";
import { Users, Package, TrendingUp, Shield, Flag } from "lucide-react";

const managementCards = [
  {
    title: "Users",
    description: "View and manage all platform users, permissions, and account details",
    href: "/admin/users",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    title: "Products",
    description: "Browse and moderate all products listed on the platform",
    href: "/admin/products",
    icon: Package,
    color: "bg-purple-500",
  },
  {
    title: "Creators",
    description: "Track creator performance, earnings, and success metrics",
    href: "/admin/creators",
    icon: TrendingUp,
    color: "bg-green-500",
    badge: "NEW",
  },
  {
    title: "Moderation",
    description: "Review flagged content and enforce community guidelines",
    href: "/admin/moderation",
    icon: Shield,
    color: "bg-red-500",
    badge: "3",
    badgeVariant: "destructive" as const,
  },
  {
    title: "Reports",
    description: "Handle user-submitted reports and complaints",
    href: "/admin/reports",
    icon: Flag,
    color: "bg-orange-500",
  },
];

export default function ManagementPage() {
  return (
    <AdminCategoryPage
      title="Management"
      description="Manage users, products, creators, and platform moderation"
      icon={Users}
      iconColor="bg-purple-500"
      cards={managementCards}
    />
  );
}
