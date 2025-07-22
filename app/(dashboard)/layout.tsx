import { SidebarLayout } from "./components/sidebar-layout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <SidebarLayout>{children}</SidebarLayout>;
} 