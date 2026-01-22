import { useState } from 'react'
import { Play, Pause, Heart, Download, GripVertical, Coins, Check, Loader2 } from 'lucide-react'
import { usePlayerStore } from '../stores/playerStore'
import { useDragToDAW } from '../hooks/useDragToDAW'
import { useDownload } from '../hooks/useDownload'

interface Sample {
  _id: string
  title: string
  fileUrl?: string
  previewUrl?: string
  coverImageUrl?: string
  bpm?: number
  key?: string
  genre?: string
  duration?: number
  creditPrice?: number
  isOwned?: boolean
}

interface SampleListProps {
  samples: Sample[]
}

export function SampleList({ samples }: SampleListProps) {
  const { currentSample, isPlaying, setIsPlaying, setQueue } = usePlayerStore()
  const { getDragProps, isDownloaded, needsDownload } = useDragToDAW()
  const { downloadSample } = useDownload()
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())

  const handlePlay = (sample: Sample, index: number) => {
    if (currentSample?.id === sample._id && isPlaying) {
      setIsPlaying(false)
    } else {
      // Set the queue to all samples starting from this one
      setQueue(
        samples.map((s) => ({
          id: s._id,
          title: s.title,
          fileUrl: s.fileUrl || '',
          previewUrl: s.previewUrl,
          coverUrl: s.coverImageUrl,
          bpm: s.bpm,
          key: s.key,
          genre: s.genre,
          duration: s.duration,
          creditPrice: s.creditPrice
        })),
        index
      )
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDownload = async (sample: Sample) => {
    if (!sample.isOwned || !sample.fileUrl || downloadingIds.has(sample._id)) return

    setDownloadingIds((prev) => new Set(prev).add(sample._id))
    try {
      await downloadSample({
        sampleId: sample._id,
        title: sample.title,
        url: sample.fileUrl,
        genre: sample.genre
      })
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev)
        next.delete(sample._id)
        return next
      })
    }
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
        <div className="w-8">#</div>
        <div>Title</div>
        <div className="w-16 text-center">BPM</div>
        <div className="w-12 text-center">Key</div>
        <div className="w-16 text-center">Duration</div>
        <div className="w-16 text-center">Price</div>
        <div className="w-20"></div>
      </div>

      {/* Rows */}
      {samples.map((sample, index) => {
        const isCurrentlyPlaying = currentSample?.id === sample._id && isPlaying
        const downloaded = isDownloaded(sample._id)
        const isDownloading = downloadingIds.has(sample._id)
        const showNeedsDownload = needsDownload === sample._id
        const dragProps = getDragProps({ ...sample, isOwned: sample.isOwned })

        return (
          <div
            key={sample._id}
            className={`group relative grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 rounded-lg px-4 py-2 transition-colors hover:bg-secondary/50 ${
              isCurrentlyPlaying ? 'bg-primary/10' : ''
            }`}
            {...dragProps}
          >
            {/* "Download first" tooltip */}
            {showNeedsDownload && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/70">
                <span className="rounded-md bg-orange-500 px-3 py-1 text-sm font-medium text-white">
                  Download first to drag to DAW
                </span>
              </div>
            )}
            {/* Index / Play button */}
            <div className="w-8">
              <button
                onClick={() => handlePlay(sample, index)}
                className="flex h-8 w-8 items-center justify-center"
              >
                <span className="group-hover:hidden">
                  {isCurrentlyPlaying ? (
                    <div className="flex gap-0.5">
                      <span className="h-3 w-0.5 animate-pulse bg-primary" />
                      <span className="h-3 w-0.5 animate-pulse bg-primary delay-75" />
                      <span className="h-3 w-0.5 animate-pulse bg-primary delay-150" />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                  )}
                </span>
                <span className="hidden group-hover:block">
                  {isCurrentlyPlaying ? (
                    <Pause className="h-4 w-4 text-primary" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </span>
              </button>
            </div>

            {/* Title with cover */}
            <div className="flex items-center gap-3 overflow-hidden">
              {sample.coverImageUrl ? (
                <img
                  src={sample.coverImageUrl}
                  alt={sample.title}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary">
                  <span className="text-sm font-medium text-muted-foreground">
                    {sample.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="overflow-hidden">
                <div className="truncate text-sm font-medium">{sample.title}</div>
                {sample.genre && (
                  <div className="truncate text-xs text-muted-foreground">{sample.genre}</div>
                )}
              </div>
            </div>

            {/* BPM */}
            <div className="w-16 text-center text-sm text-muted-foreground">
              {sample.bpm || '-'}
            </div>

            {/* Key */}
            <div className="w-12 text-center text-sm text-muted-foreground">
              {sample.key || '-'}
            </div>

            {/* Duration */}
            <div className="w-16 text-center text-sm text-muted-foreground">
              {formatDuration(sample.duration)}
            </div>

            {/* Price */}
            <div className="w-16 text-center">
              {sample.isOwned ? (
                <span className="text-xs text-green-500">Owned</span>
              ) : (
                <div className="flex items-center justify-center gap-1 text-sm">
                  <Coins className="h-3 w-3 text-primary" />
                  <span>{sample.creditPrice || 1}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex w-20 items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button className="rounded p-1.5 text-muted-foreground transition-colors hover:text-red-500">
                <Heart className="h-4 w-4" />
              </button>
              {sample.isOwned && (
                <>
                  {downloaded ? (
                    <span className="rounded p-1.5 text-green-500" title="Downloaded - ready to drag">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDownload(sample)}
                      disabled={isDownloading}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                      title="Download to enable drag to DAW"
                    >
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <span
                    className={`rounded p-1.5 text-muted-foreground ${
                      downloaded ? 'cursor-grab hover:text-foreground' : 'cursor-not-allowed opacity-50'
                    }`}
                    title={downloaded ? 'Drag to DAW' : 'Download first to drag'}
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
