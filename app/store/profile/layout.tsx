import { SidebarWrapper } from "@/app/(dashboard)/components/sidebar-wrapper";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarWrapper>{children}</SidebarWrapper>;
}
