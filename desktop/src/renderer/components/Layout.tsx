import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TitleBar } from './TitleBar'
import { AudioPlayer } from './AudioPlayer'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <div className="flex h-screen flex-col">
      {/* Custom title bar for frameless window */}
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>

      {/* Persistent audio player */}
      <AudioPlayer />
    </div>
  )
}
