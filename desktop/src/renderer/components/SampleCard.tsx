import { useState } from 'react'
import { Play, Pause, Download, Heart, GripVertical, Coins, Check } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { usePlayerStore } from '../stores/playerStore'
import { useDragToDAW } from '../hooks/useDragToDAW'
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

  const { currentSample, isPlaying, playSample, setIsPlaying } = usePlayerStore()
  const { getDragProps, isDragging, isDownloaded } = useDragToDAW()

  const isCurrentlyPlaying = currentSample?.id === sample._id && isPlaying
  const downloaded = isDownloaded(sample._id)

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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const dragProps = getDragProps({ ...sample, isOwned })

  return (
    <>
      <div
        className={`group relative overflow-hidden rounded-lg border border-border bg-card transition-all ${
          isHovered ? 'border-primary/50 shadow-lg' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
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

          {/* Drag handle for owned samples */}
          {isOwned && (
            <div
              className={`absolute right-2 top-2 cursor-grab rounded bg-black/50 p-1 text-white transition-opacity ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Downloaded indicator */}
          {isOwned && downloaded && (
            <div className="absolute left-2 top-2 rounded bg-green-500/80 p-1">
              <Check className="h-3 w-3 text-white" />
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
              <span className="flex items-center gap-1 text-xs text-green-500">
                <Check className="h-3 w-3" />
                Owned
              </span>
            ) : (
              <button
                onClick={handleBuyClick}
                className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                <Coins className="h-3 w-3" />
                <span>{sample.creditPrice || 1}</span>
              </button>
            )}

            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavorite({ sampleId: sample._id as Id<"audioSamples"> })
                }}
                className="rounded p-1 text-muted-foreground transition-colors hover:text-red-500"
              >
                <Heart className="h-4 w-4" />
              </button>
              {isOwned && (
                <button className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground">
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>
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
