import { Keyboard, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ShortcutGroup {
  title: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const isMac = navigator.platform.toLowerCase().includes('mac')
const modKey = isMac ? 'Cmd' : 'Ctrl'

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Playback',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause' },
      { keys: ['↑'], description: 'Previous track' },
      { keys: ['↓'], description: 'Next track' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: [modKey, '1'], description: 'Go to Explore' },
      { keys: [modKey, '2'], description: 'Go to Library' },
      { keys: [modKey, '3'], description: 'Go to Downloads' },
      { keys: [modKey, '4'], description: 'Go to Favorites' },
      { keys: [modKey, ','], description: 'Go to Settings' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: [modKey, 'F'], description: 'Focus search' },
      { keys: ['Esc'], description: 'Close modal / Clear selection' },
    ],
  },
]

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
      // Open with Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Keyboard className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-6">
          {SHORTCUTS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i}>
                          <kbd className="rounded bg-secondary px-2 py-1 text-xs font-medium">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Press <kbd className="rounded bg-secondary px-1.5 py-0.5 text-xs">{modKey}</kbd>
          <span className="mx-1">+</span>
          <kbd className="rounded bg-secondary px-1.5 py-0.5 text-xs">/</kbd>
          {' '}to toggle this dialog
        </div>
      </div>
    </div>
  )
}

// Hook to show/hide the shortcuts modal
export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Toggle with Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  }
}

// Inline shortcut display component for tooltips/hints
export function ShortcutHint({ keys }: { keys: string[] }) {
  return (
    <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      {keys.map((key, i) => (
        <span key={i}>
          <kbd className="rounded bg-secondary/50 px-1 py-0.5 text-[10px]">{key}</kbd>
          {i < keys.length - 1 && <span className="mx-0.5">+</span>}
        </span>
      ))}
    </span>
  )
}

// Export constants for use in other components
export { SHORTCUTS, modKey }
