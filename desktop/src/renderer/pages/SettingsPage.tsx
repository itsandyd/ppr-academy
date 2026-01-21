import { useState, useEffect } from 'react'
import { useClerk, useUser } from '@clerk/clerk-react'
import { FolderOpen, LogOut, Monitor, Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export function SettingsPage() {
  const { signOut } = useClerk()
  const { user } = useUser()

  const [downloadPath, setDownloadPath] = useState<string>('')
  const [theme, setTheme] = useState<Theme>('dark')
  const [launchOnStartup, setLaunchOnStartup] = useState(false)
  const [minimizeToTray, setMinimizeToTray] = useState(true)
  const [appVersion, setAppVersion] = useState<string>('')

  useEffect(() => {
    // Load settings
    window.electron.getDownloadPath().then(setDownloadPath)
    window.electron.getAppVersion().then(setAppVersion)
    window.electron.storeGet('theme').then((t) => t && setTheme(t as Theme))
    window.electron.storeGet('launchOnStartup').then((v) => v !== undefined && setLaunchOnStartup(!!v))
    window.electron.storeGet('minimizeToTray').then((v) => v !== undefined && setMinimizeToTray(!!v))
  }, [])

  const handleChangeDownloadPath = async () => {
    const newPath = await window.electron.setDownloadPath()
    if (newPath) {
      setDownloadPath(newPath)
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    window.electron.storeSet('theme', newTheme)
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark')
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light')
    } else {
      document.documentElement.classList.add(newTheme)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your PPR Samples experience
        </p>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Account */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Account</h2>
            <div className="rounded-lg border border-border bg-card p-4">
              {user && (
                <div className="flex items-center gap-4">
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || 'User'}
                    className="h-16 w-16 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{user.fullName || user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg border border-destructive px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Storage */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Storage</h2>
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="text-sm font-medium">Download Location</label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 truncate rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {downloadPath || 'Not set'}
                </div>
                <button
                  onClick={handleChangeDownloadPath}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-secondary"
                >
                  Change
                </button>
                <button
                  onClick={() => window.electron.openFolder(downloadPath)}
                  className="rounded-lg border border-input bg-background p-2 transition-colors hover:bg-secondary"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Appearance</h2>
            <div className="rounded-lg border border-border bg-card p-4">
              <label className="text-sm font-medium">Theme</label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    theme === 'light'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:bg-secondary'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:bg-secondary'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    theme === 'system'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:bg-secondary'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  System
                </button>
              </div>
            </div>
          </section>

          {/* Behavior */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Behavior</h2>
            <div className="space-y-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Launch on startup</div>
                  <div className="text-xs text-muted-foreground">
                    Start PPR Samples when you log in
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLaunchOnStartup(!launchOnStartup)
                    window.electron.storeSet('launchOnStartup', !launchOnStartup)
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    launchOnStartup ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      launchOnStartup ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Minimize to tray</div>
                  <div className="text-xs text-muted-foreground">
                    Keep running in the background when closed
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMinimizeToTray(!minimizeToTray)
                    window.electron.storeSet('minimizeToTray', !minimizeToTray)
                  }}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    minimizeToTray ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      minimizeToTray ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* About */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">About</h2>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">PPR Samples</div>
                  <div className="text-xs text-muted-foreground">
                    Version {appVersion || '1.0.0'}
                  </div>
                </div>
                <button
                  onClick={() => window.electron.openExternal('https://ppr-academy.com')}
                  className="rounded-lg border border-input px-3 py-2 text-sm transition-colors hover:bg-secondary"
                >
                  Visit Website
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
