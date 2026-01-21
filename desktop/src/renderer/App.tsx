import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { ClerkProvider, useAuth, SignedIn, SignedOut } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { Layout } from './components/Layout'
import { Onboarding, useOnboarding } from './components/Onboarding'
import { ExplorePage } from './pages/ExplorePage'
import { LibraryPage } from './pages/LibraryPage'
import { DownloadsPage } from './pages/DownloadsPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'

// Initialize Convex client
const convexUrl = import.meta.env.VITE_CONVEX_URL
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL environment variable')
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable')
}

const convex = new ConvexReactClient(convexUrl)

// Navigation listener for tray menu navigation
function NavigationListener() {
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = window.electron.onNavigate((path) => {
      navigate(path)
    })
    return unsubscribe
  }, [navigate])

  return null
}

// Onboarding wrapper for signed in users
function SignedInContent() {
  const { showOnboarding, isLoading, completeOnboarding } = useOnboarding()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <Layout>
        <Routes>
          <Route path="/" element={<ExplorePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </>
  )
}

// Main router component
function AppRouter() {
  return (
    <BrowserRouter>
      <NavigationListener />
      <SignedIn>
        <SignedInContent />
      </SignedIn>
      <SignedOut>
        <LoginPage />
      </SignedOut>
    </BrowserRouter>
  )
}

// Root App component
export function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <div className="h-screen w-screen overflow-hidden bg-background">
          <AppRouter />
        </div>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
