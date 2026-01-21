import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'

export function TitleBar() {
  const [platform, setPlatform] = useState<string>('darwin')

  useEffect(() => {
    window.electron.getPlatform().then((info) => {
      setPlatform(info.platform)
    })
  }, [])

  // On macOS, the native traffic lights handle window controls
  // We just need a draggable area
  if (platform === 'darwin') {
    return (
      <div className="draggable h-8 shrink-0 bg-card border-b border-border">
        {/* Traffic light spacer on macOS */}
        <div className="h-full w-20" />
      </div>
    )
  }

  // On Windows/Linux, we need custom window controls
  return (
    <div className="draggable flex h-8 shrink-0 items-center justify-between bg-card border-b border-border">
      {/* App title */}
      <div className="flex items-center gap-2 px-3">
        <span className="text-sm font-medium text-foreground">PPR Samples</span>
      </div>

      {/* Window controls */}
      <div className="non-draggable flex h-full">
        <button
          onClick={() => window.electron.windowMinimize()}
          className="flex h-full w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary"
          aria-label="Minimize"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => window.electron.windowMaximize()}
          className="flex h-full w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary"
          aria-label="Maximize"
        >
          <Square className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => window.electron.windowClose()}
          className="flex h-full w-12 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
