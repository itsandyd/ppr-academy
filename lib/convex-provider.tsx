'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  // If no Convex URL is available, render children without Convex provider
  if (!convexUrl || convexUrl.includes('dummy')) {
    console.warn('⚠️  Convex not configured properly. Please run "npx convex dev" to set up.')
    return <>{children}</>;
  }

  const convex = new ConvexReactClient(convexUrl);
  
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
} 