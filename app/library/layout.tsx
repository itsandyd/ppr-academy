import { LibrarySidebarWrapper } from "./components/library-sidebar-wrapper";

// Force dynamic rendering for all library routes
export const dynamic = 'force-dynamic';

interface LibraryLayoutProps {
  children: React.ReactNode;
}

export default function LibraryLayout({ children }: LibraryLayoutProps) {
  return <LibrarySidebarWrapper>{children}</LibrarySidebarWrapper>;
}
