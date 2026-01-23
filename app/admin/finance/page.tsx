"use client";

import { AdminCategoryPage } from "../components/AdminCategoryPage";
import { DollarSign, Activity, TrendingUp } from "lucide-react";

const financeCards = [
  {
    title: "Revenue",
    description: "Track platform revenue, payouts, and financial performance",
    href: "/admin/revenue",
    icon: DollarSign,
    color: "bg-green-500",
  },
  {
    title: "Activity Log",
    description: "View admin actions and audit trail for accountability",
    href: "/admin/activity",
    icon: Activity,
    color: "bg-blue-500",
    badge: "NEW",
  },
  {
    title: "Conversions",
    description: "Analyze funnel performance and conversion optimization",
    href: "/admin/conversions",
    icon: TrendingUp,
    color: "bg-purple-500",
    badge: "NEW",
  },
];

export default function FinancePage() {
  return (
    <AdminCategoryPage
      title="Finance"
      description="Monitor revenue, track activity, and optimize conversions"
      icon={DollarSign}
      iconColor="bg-green-500"
      cards={financeCards}
    />
  );
}
