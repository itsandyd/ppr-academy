'use client';

import { ReactNode, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { DashboardShell } from './components/DashboardShell';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Get mode from URL, default to 'create' for creation pages
  const mode = searchParams.get('mode') as 'learn' | 'create' | null;
  const isCreationPage = pathname.startsWith('/dashboard/create');
  
  // If on creation page and no mode specified, use 'create'
  const effectiveMode = mode || (isCreationPage ? 'create' : 'learn');

  // Main dashboard page handles its own shell, others use this layout
  if (pathname === '/dashboard') {
    return <>{children}</>;
  }

  // Wrap other pages in DashboardShell
  return (
    <DashboardShell mode={effectiveMode}>
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    }>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}

