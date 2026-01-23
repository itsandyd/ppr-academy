import { NavLink } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  Compass,
  Library,
  Download,
  Heart,
  Settings,
  Coins,
  Upload,
  History,
  Keyboard
} from 'lucide-react'
import { useDownloadStore } from '../stores/downloadStore'
import { modKey } from './KeyboardShortcuts'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  countKey?: 'library' | 'downloads' | 'favorites' | 'history'
}

const navItems: NavItem[] = [
  { path: '/explore', label: 'Explore', icon: Compass },
  { path: '/library', label: 'My Library', icon: Library, countKey: 'library' },
  { path: '/downloads', label: 'Downloads', icon: Download, countKey: 'downloads' },
  { path: '/favorites', label: 'Favorites', icon: Heart, countKey: 'favorites' },
  { path: '/history', label: 'History', icon: History, countKey: 'history' },
  { path: '/upload', label: 'Upload', icon: Upload },
]

interface SidebarProps {
  onShowShortcuts?: () => void
}

export function Sidebar({ onShowShortcuts }: SidebarProps) {
  const { user } = useUser()
  const credits = useQuery(api.credits.getUserCredits)

  // Fetch counts for sidebar badges
  const library = useQuery(api.samples.getUserLibrary) as unknown[] | undefined
  const favorites = useQuery(api.samples.getFavoriteSamples) as unknown[] | undefined
  const { downloads } = useDownloadStore()

  // Get recently played count from localStorage (we'll add this to playerStore)
  const recentlyPlayedCount = (() => {
    try {
      const stored = localStorage.getItem('recentlyPlayed')
      return stored ? JSON.parse(stored).length : 0
    } catch {
      return 0
    }
  })()

  const counts: Record<string, number> = {
    library: library?.length ?? 0,
    downloads: downloads.filter(d => d.status === 'completed').length,
    favorites: favorites?.length ?? 0,
    history: recentlyPlayedCount,
  }

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card">
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ path, label, icon: Icon, countKey }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {countKey && counts[countKey] > 0 && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                {counts[countKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Credits display */}
      <div className="border-t border-border p-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Credits</span>
          </div>
          <div className="mt-1 text-2xl font-bold">
            {credits?.balance ?? 0}
          </div>
          <button
            onClick={() => {
              window.electron.openExternal(
                'https://academy.pauseplayrepeat.com/credits/purchase'
              )
            }}
            className="mt-2 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Buy Credits
          </button>
        </div>
      </div>

      {/* User profile & settings */}
      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`
          }
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>

        {/* Keyboard shortcuts button */}
        <button
          onClick={onShowShortcuts}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title={`Keyboard shortcuts (${modKey}+/)`}
        >
          <Keyboard className="h-4 w-4" />
          <span className="flex-1 text-left">Shortcuts</span>
          <span className="text-xs opacity-60">{modKey}+/</span>
        </button>

        {user && (
          <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <img
              src={user.imageUrl}
              alt={user.fullName || 'User'}
              className="h-8 w-8 rounded-full"
            />
            <div className="flex-1 truncate">
              <div className="truncate text-sm font-medium">
                {user.fullName || user.username}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
