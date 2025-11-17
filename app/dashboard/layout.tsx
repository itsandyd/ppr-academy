import { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // No wrapper needed - DashboardShell handles all layout
  return <>{children}</>;
}

