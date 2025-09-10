"use client";

import { CreatorDashboardContent } from "@/components/dashboard/creator-dashboard-content";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardHome() {
  return <CreatorDashboardContent />;
}