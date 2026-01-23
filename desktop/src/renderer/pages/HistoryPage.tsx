import { useState } from 'react'
import { History, Play, Pause, Trash2, Clock, Search } from 'lucide-react'
import { usePlayerStore, RecentlyPlayedItem } from '../stores/playerStore'

export function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const {
    recentlyPlayed,
    currentSample,
    isPlaying,
    playSample,
    setIsPlaying,
    clearRecentlyPlayed,
    removeFromHistory,
    setQueue
  } = usePlayerStore()

  // Filter by search query
  const filteredHistory = recentlyPlayed.filter(item =>
    item.sample.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sample.genre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sample.key?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.playedAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let label: string
    if (date.toDateString() === today.toDateString()) {
      label = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday'
    } else {
      label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    }

    if (!groups[label]) {
      groups[label] = []
    }
    groups[label].push(item)
    return groups
  }, {} as Record<string, RecentlyPlayedItem[]>)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handlePlay = (item: RecentlyPlayedItem) => {
    if (currentSample?.id === item.sample.id && isPlaying) {
      setIsPlaying(false)
    } else {
      playSample(item.sample)
    }
  }

  const handlePlayAll = () => {
    if (filteredHistory.length === 0) return
    const samples = filteredHistory.map(item => item.sample)
    setQueue(samples, 0)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Recently Played</h1>
            <p className="text-sm text-muted-foreground">
              Your listening history ({recentlyPlayed.length} samples)
            </p>
          </div>

          {recentlyPlayed.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Play className="h-4 w-4" />
                Play All
              </button>
              <button
                onClick={clearRecentlyPlayed}
                className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        {recentlyPlayed.length > 0 && (
          <div className="mt-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {recentlyPlayed.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <History className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No listening history</div>
              <div className="text-sm text-muted-foreground">
                Samples you play will appear here
              </div>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Search className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <div className="text-lg font-medium">No results found</div>
              <div className="text-sm text-muted-foreground">
                Try a different search term
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([label, items]) => (
              <div key={label}>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">{label}</h2>
                <div className="space-y-1">
                  {items.map((item) => {
                    const isCurrentlyPlaying = currentSample?.id === item.sample.id && isPlaying
                    return (
                      <div
                        key={`${item.sample.id}-${item.playedAt}`}
                        className={`group flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/50 ${
                          currentSample?.id === item.sample.id ? 'bg-primary/5' : ''
                        }`}
                      >
                        {/* Play button */}
                        <button
                          onClick={() => handlePlay(item)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          {isCurrentlyPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4 translate-x-0.5" />
                          )}
                        </button>

                        {/* Cover */}
                        {item.sample.coverUrl ? (
                          <img
                            src={item.sample.coverUrl}
                            alt={item.sample.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-primary/20 to-secondary">
                            <span className="text-sm font-bold text-primary/50">
                              {item.sample.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{item.sample.title}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.sample.bpm && <span>{item.sample.bpm} BPM</span>}
                            {item.sample.key && <span>• {item.sample.key}</span>}
                            {item.sample.duration && <span>• {formatDuration(item.sample.duration)}</span>}
                          </div>
                        </div>

                        {/* Time played */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(item.playedAt)}
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeFromHistory(item.sample.id)}
                          className="rounded p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                          title="Remove from history"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
