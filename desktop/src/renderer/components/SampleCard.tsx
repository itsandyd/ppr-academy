import { useState } from 'react'
import { Play, Pause, Download, Heart, GripVertical, Coins, Loader2, HardDrive, FolderOpen } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { usePlayerStore } from '../stores/playerStore'
import { useDragToDAW } from '../hooks/useDragToDAW'
import { useDownload } from '../hooks/useDownload'
import { useDownloadStore } from '../stores/downloadStore'
import { PurchaseModal } from './PurchaseModal'
import { Id } from '@convex/_generated/dataModel'

interface SampleCardProps {
  sample: {
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
}

export function SampleCard({ sample }: SampleCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [isOwned, setIsOwned] = useState(sample.isOwned || false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { currentSample, isPlaying, playSample, setIsPlaying } = usePlayerStore()
  const { getDragProps, isDragging, isDownloaded, needsDownload } = useDragToDAW()
  const { downloadSample } = useDownload()
  const { getDownloadBySampleId } = useDownloadStore()

  const isCurrentlyPlaying = currentSample?.id === sample._id && isPlaying
  const downloaded = isDownloaded(sample._id)
  const showNeedsDownload = needsDownload === sample._id
  const downloadItem = getDownloadBySampleId(sample._id)
  const downloadProgress = downloadItem?.status === 'downloading' ? downloadItem.progress : 0

  const toggleFavorite = useMutation(api.samples.toggleFavorite)

  // Check ownership
  const ownership = useQuery(
    api.samples.checkSampleOwnership,
    { sampleId: sample._id as Id<"audioSamples"> }
  )

  // Update isOwned when ownership query returns
  if (ownership?.owned && !isOwned) {
    setIsOwned(true)
  }

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      setIsPlaying(false)
    } else {
      playSample({
        id: sample._id,
        title: sample.title,
        fileUrl: sample.fileUrl || '',
        previewUrl: sample.previewUrl,
        coverUrl: sample.coverImageUrl,
        bpm: sample.bpm,
        key: sample.key,
        genre: sample.genre,
        duration: sample.duration,
        creditPrice: sample.creditPrice
      })
    }
  }

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOwned) {
      setShowPurchaseModal(true)
    }
  }

  const handlePurchaseSuccess = () => {
    setIsOwned(true)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOwned || !sample.fileUrl || isDownloading) return

    setIsDownloading(true)
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
      setIsDownloading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleShowInFinder = (e: React.MouseEvent) => {
    e.stopPropagation()
    const localPath = downloadItem?.localPath
    if (localPath) {
      window.electron.showItemInFolder(localPath)
    }
  }

  const dragProps = getDragProps({ ...sample, isOwned })

  return (
    <>
      <div
        className={`group relative overflow-hidden rounded-lg border bg-card transition-all ${
          downloaded && isOwned
            ? 'border-green-500/50 ring-1 ring-green-500/20'
            : 'border-border'
        } ${isHovered ? 'border-primary/50 shadow-lg' : ''} ${isDragging ? 'opacity-50' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...dragProps}
      >
        {/* Cover image / waveform placeholder */}
        <div className="relative aspect-square bg-secondary">
          {sample.coverImageUrl ? (
            <img
              src={sample.coverImageUrl}
              alt={sample.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary">
              <span className="text-4xl font-bold text-primary/30">
                {sample.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Play overlay */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
              isHovered || isCurrentlyPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              onClick={handlePlay}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110"
            >
              {isCurrentlyPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 translate-x-0.5" />
              )}
            </button>
          </div>

          {/* Downloaded badge - always visible when downloaded */}
          {isOwned && downloaded && (
            <div
              className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white shadow-lg"
              title="Ready to drag to DAW"
            >
              <HardDrive className="h-3 w-3" />
              <span>Ready</span>
            </div>
          )}

          {/* Download progress bar */}
          {isOwned && isDownloading && downloadProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}

          {/* Action buttons for owned + downloaded samples */}
          {isOwned && downloaded && (
            <div
              className={`absolute right-2 top-2 flex gap-1 transition-opacity ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Show in Finder - reliable way to drag to DAW */}
              <button
                onClick={handleShowInFinder}
                className="rounded bg-white/90 p-1.5 text-gray-700 shadow-lg transition-all hover:scale-110 hover:bg-white"
                title="Show in Finder (drag from there to DAW)"
              >
                <FolderOpen className="h-4 w-4" />
              </button>
              {/* Direct drag handle */}
              <div
                className="cursor-grab rounded bg-primary p-1.5 text-white shadow-lg transition-all hover:scale-110"
                title="Drag to DAW"
              >
                <GripVertical className="h-4 w-4" />
              </div>
            </div>
          )}

          {/* Download first tooltip - shows when user tries to drag undownloaded sample */}
          {showNeedsDownload && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-white shadow-lg">
                <Download className="h-6 w-6" />
                <span className="text-sm font-medium">Download first to drag</span>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="truncate text-sm font-medium">{sample.title}</h3>

          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {sample.bpm && <span>{sample.bpm} BPM</span>}
            {sample.key && <span>• {sample.key}</span>}
            {sample.duration && <span>• {formatDuration(sample.duration)}</span>}
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-between">
            {isOwned ? (
              downloaded ? (
                <button
                  onClick={handleShowInFinder}
                  className="flex items-center gap-1 rounded bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-500/20"
                  title="Open in Finder to drag to your DAW"
                >
                  <FolderOpen className="h-3 w-3" />
                  Show in Finder
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  title="Download to enable drag to DAW"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{downloadProgress > 0 ? `${downloadProgress}%` : 'Downloading...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </>
                  )}
                </button>
              )
            ) : (
              <button
                onClick={handleBuyClick}
                className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <Coins className="h-3 w-3" />
                <span>{sample.creditPrice || 1}</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite({ sampleId: sample._id as Id<"audioSamples"> })
              }}
              className="rounded p-1 text-muted-foreground transition-colors hover:text-red-500"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseModal
          sample={sample}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </>
  )
}
