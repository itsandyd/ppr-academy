import { SidebarWrapper } from "./components/sidebar-wrapper";

// Force dynamic rendering for all dashboard routes
export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <SidebarWrapper>{children}</SidebarWrapper>;
} 