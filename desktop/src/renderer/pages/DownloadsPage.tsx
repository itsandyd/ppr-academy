import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  FolderOpen,
  RefreshCw,
  Pause,
  Trash2,
  Music,
  Download,
  Loader2,
  Search,
  Play,
  GripVertical,
  Clock
} from 'lucide-react'
import { usePlayerStore } from '../stores/playerStore'
import { useDownloadStore } from '../stores/downloadStore'

interface DownloadedSample {
  _id: string
  title: string
  fileUrl?: string
  previewUrl?: string
  coverImageUrl?: string
  bpm?: number
  key?: string
  genre?: string
  duration?: number
  downloadInfo?: {
    downloadedAt: number
    downloadCount?: number
    licenseType?: string
  }
}

type DownloadsTab = 'library' | 'active'

export function DownloadsPage() {
  const [activeTab, setActiveTab] = useState<DownloadsTab>('library')
  const [downloadPath, setDownloadPath] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Get user's downloaded samples from Convex
  const downloadedSamples = useQuery(api.samples.getUserLibrary) as DownloadedSample[] | undefined

  // Get active downloads from store
  const { downloads: activeDownloads } = useDownloadStore()

  // Player store for playing samples
  const { playSample, currentSample, isPlaying, setIsPlaying } = usePlayerStore()

  useEffect(() => {
    // Get the current download path
    window.electron.getDownloadPath().then(setDownloadPath)
  }, [])

  const handleChangeDownloadPath = async () => {
    const newPath = await window.electron.setDownloadPath()
    if (newPath) {
      setDownloadPath(newPath)
    }
  }

  const handleOpenDownloadFolder = () => {
    window.electron.openFolder(downloadPath)
  }

  // Filter samples by search
  const filteredSamples = downloadedSamples?.filter((sample) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      sample.title.toLowerCase().includes(query) ||
      sample.genre?.toLowerCase().includes(query) ||
      sample.key?.toLowerCase().includes(query)
    )
  })

  // Count active downloads
  const activeCount = activeDownloads.filter(
    (d) => d.status === 'downloading' || d.status === 'pending'
  ).length

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handlePlaySample = (sample: DownloadedSample) => {
    if (currentSample?.id === sample._id) {
      setIsPlaying(!isPlaying)
    } else {
      playSample({
        id: sample._id,
        title: sample.title,
        fileUrl: sample.fileUrl || sample.previewUrl || '',
        previewUrl: sample.previewUrl,
        coverUrl: sample.coverImageUrl,
        bpm: sample.bpm,
        key: sample.key
      })
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h1 className="text-2xl font-bold">Downloads</h1>
        <p className="text-sm text-muted-foreground">
          Your purchased samples and active downloads
        </p>

        {/* Download path */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 truncate rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm">
            {downloadPath || 'No download path set'}
          </div>
          <button
            onClick={handleChangeDownloadPath}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-secondary"
          >
            Change
          </button>
          <button
            onClick={handleOpenDownloadFolder}
            className="rounded-lg border border-input bg-background p-2 transition-colors hover:bg-secondary"
            title="Open download folder"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="flex gap-1 pt-2">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'library'
                ? 'bg-background border border-b-0 border-border text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Music className="h-4 w-4" />
            My Library
            {downloadedSamples && (
              <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                {downloadedSamples.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-background border border-b-0 border-border text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Download className="h-4 w-4" />
            Active Downloads
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'library' ? (
          <div className="flex h-full flex-col">
            {/* Search bar */}
            <div className="p-4 pb-0">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search your library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Samples list */}
            <div className="flex-1 overflow-auto p-4">
              {downloadedSamples === undefined ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSamples?.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <Music className="mb-4 h-16 w-16 text-muted-foreground" />
                  <h2 className="mb-2 text-lg font-medium">
                    {downloadedSamples.length === 0
                      ? 'No samples yet'
                      : 'No matching samples'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {downloadedSamples.length === 0
                      ? 'Purchase samples from the Explore page to build your library'
                      : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSamples?.map((sample) => {
                    const isCurrentSample = currentSample?.id === sample._id
                    const isCurrentPlaying = isCurrentSample && isPlaying

                    return (
                      <div
                        key={sample._id}
                        className={`group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50 ${
                          isCurrentSample ? 'bg-primary/10' : ''
                        }`}
                      >
                        {/* Drag handle */}
                        <div className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        {/* Play button / Cover */}
                        <button
                          onClick={() => handlePlaySample(sample)}
                          className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-secondary"
                        >
                          {sample.coverImageUrl ? (
                            <img
                              src={sample.coverImageUrl}
                              alt={sample.title}
                              className="h-full w-full rounded object-cover"
                            />
                          ) : (
                            <Music className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div
                            className={`absolute inset-0 flex items-center justify-center rounded bg-black/50 transition-opacity ${
                              isCurrentPlaying
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isCurrentPlaying ? (
                              <Pause className="h-4 w-4 text-white" />
                            ) : (
                              <Play className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </button>

                        {/* Title & metadata */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{sample.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {sample.bpm && <span>{sample.bpm} BPM</span>}
                            {sample.key && (
                              <>
                                <span>•</span>
                                <span>{sample.key}</span>
                              </>
                            )}
                            {sample.genre && (
                              <>
                                <span>•</span>
                                <span>{sample.genre}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDuration(sample.duration)}
                        </div>

                        {/* Downloaded date */}
                        {sample.downloadInfo?.downloadedAt && (
                          <div className="hidden text-xs text-muted-foreground sm:block">
                            {formatDate(sample.downloadInfo.downloadedAt)}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() =>
                              window.electron.openFolder(downloadPath)
                            }
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            title="Show in folder"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Active Downloads Tab */
          <div className="p-4">
            {activeDownloads.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <Download className="mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-lg font-medium">No active downloads</h2>
                <p className="text-sm text-muted-foreground">
                  Purchase and download samples to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeDownloads.map((download) => (
                  <div
                    key={download.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{download.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {download.status === 'completed'
                            ? 'Downloaded'
                            : download.status === 'downloading'
                              ? `${download.progress}%`
                              : download.status === 'error'
                                ? 'Failed'
                                : 'Pending'}
                        </span>
                        {download.size && <span>• {formatFileSize(download.size)}</span>}
                      </div>

                      {/* Progress bar */}
                      {download.status === 'downloading' && (
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${download.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      {download.status === 'downloading' && (
                        <button className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground">
                          <Pause className="h-4 w-4" />
                        </button>
                      )}
                      {download.status === 'error' && (
                        <button className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      {download.status === 'completed' && download.localPath && (
                        <button
                          onClick={() =>
                            window.electron.showItemInFolder(download.localPath)
                          }
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </button>
                      )}
                      <button className="rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
