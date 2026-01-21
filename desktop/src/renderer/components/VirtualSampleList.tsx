import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { SampleCard } from './SampleCard'

interface Sample {
  _id: string
  title: string
  fileUrl?: string
  previewUrl?: string
  coverUrl?: string
  bpm?: number
  musicalKey?: string
  genre?: string
  duration?: number
  creditPrice?: number
  isOwned?: boolean
}

interface VirtualSampleListProps {
  samples: Sample[]
  isLoading?: boolean
  emptyMessage?: string
}

export function VirtualSampleList({
  samples,
  isLoading,
  emptyMessage = 'No samples found'
}: VirtualSampleListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate number of columns based on container width
  const getColumnCount = useCallback(() => {
    if (!parentRef.current) return 4
    const width = parentRef.current.offsetWidth
    if (width < 600) return 2
    if (width < 900) return 3
    if (width < 1200) return 4
    return 5
  }, [])

  const columnCount = getColumnCount()
  const rowCount = Math.ceil(samples.length / columnCount)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated row height
    overscan: 3 // Render 3 extra rows above/below viewport
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (samples.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  const virtualRows = virtualizer.getVirtualItems()

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount
          const rowSamples = samples.slice(startIndex, startIndex + columnCount)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <div className="grid gap-4 p-2" style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
              }}>
                {rowSamples.map((sample) => (
                  <SampleCard
                    key={sample._id}
                    sample={{
                      _id: sample._id,
                      title: sample.title,
                      fileUrl: sample.fileUrl,
                      previewUrl: sample.previewUrl,
                      coverImageUrl: sample.coverUrl,
                      bpm: sample.bpm,
                      key: sample.musicalKey,
                      genre: sample.genre,
                      duration: sample.duration,
                      creditPrice: sample.creditPrice,
                      isOwned: sample.isOwned
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Simpler list virtualization for table/list views
interface VirtualSampleTableProps {
  samples: Sample[]
  selectedId?: string
  onSelect?: (sample: Sample) => void
  onDoubleClick?: (sample: Sample) => void
}

export function VirtualSampleTable({
  samples,
  selectedId,
  onSelect,
  onDoubleClick
}: VirtualSampleTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: samples.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56, // Row height
    overscan: 10
  })

  const virtualRows = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualRows.map((virtualRow) => {
          const sample = samples[virtualRow.index]
          const isSelected = selectedId === sample._id

          return (
            <div
              key={virtualRow.key}
              className={`absolute left-0 top-0 flex w-full items-center gap-4 border-b border-border px-4 transition-colors ${
                isSelected ? 'bg-primary/10' : 'hover:bg-secondary/50'
              }`}
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
              onClick={() => onSelect?.(sample)}
              onDoubleClick={() => onDoubleClick?.(sample)}
            >
              {/* Cover */}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-secondary">
                {sample.coverUrl && (
                  <img
                    src={sample.coverUrl}
                    alt={sample.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>

              {/* Title */}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{sample.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {sample.genre}
                </div>
              </div>

              {/* BPM */}
              <div className="w-16 text-center text-sm text-muted-foreground">
                {sample.bpm || '-'}
              </div>

              {/* Key */}
              <div className="w-12 text-center text-sm text-muted-foreground">
                {sample.musicalKey || '-'}
              </div>

              {/* Duration */}
              <div className="w-16 text-center text-sm text-muted-foreground">
                {sample.duration
                  ? `${Math.floor(sample.duration / 60)}:${String(
                      Math.floor(sample.duration % 60)
                    ).padStart(2, '0')}`
                  : '-'}
              </div>

              {/* Price/Owned */}
              <div className="w-20 text-right">
                {sample.isOwned ? (
                  <span className="text-xs text-green-500">Owned</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {sample.creditPrice} cr
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
