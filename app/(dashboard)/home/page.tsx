"use client";

import { CreatorDashboardContent } from "@/components/dashboard/creator-dashboard-content";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardHome() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <CreatorDashboardContent />
    </div>
  );
}