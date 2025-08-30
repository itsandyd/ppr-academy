'use client'

import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

if (!process.env.NEXT_PUBLIC_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL.includes('dummy')) {
  console.warn('⚠️  Convex not configured properly. Please run "npx convex dev" to set up.')
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || 'https://dummy-convex-url.convex.cloud')

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
} 