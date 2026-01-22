import { useCallback, useState } from 'react'
import { useDownloadStore } from '../stores/downloadStore'

interface Sample {
  _id: string
  title: string
  fileUrl?: string
  genre?: string
  isOwned?: boolean
}

export function useDragToDAW() {
  const { getDownloadBySampleId } = useDownloadStore()
  const [isDragging, setIsDragging] = useState(false)
  const [dragSampleId, setDragSampleId] = useState<string | null>(null)
  const [needsDownload, setNeedsDownload] = useState<string | null>(null)

  // Check if sample is downloaded (sync check via store)
  const isDownloaded = useCallback((sampleId: string) => {
    const download = getDownloadBySampleId(sampleId)
    return download?.status === 'completed'
  }, [getDownloadBySampleId])

  // Get local path from the download store
  const getLocalPath = useCallback((sampleId: string): string | undefined => {
    const download = getDownloadBySampleId(sampleId)
    return download?.localPath
  }, [getDownloadBySampleId])

  // Synchronous check and drag - MUST be sync for DAW drops to work
  const handleDragStart = useCallback((
    e: React.DragEvent,
    sample: Sample
  ) => {
    if (!sample.isOwned) {
      e.preventDefault()
      return
    }

    // Get local path synchronously from store
    const localPath = getLocalPath(sample._id)
    const downloaded = isDownloaded(sample._id)

    // If not downloaded, prevent drag and show feedback
    if (!downloaded || !localPath) {
      e.preventDefault()
      setNeedsDownload(sample._id)
      setTimeout(() => setNeedsDownload(null), 2000)
      return
    }

    // IMPORTANT: For native file drag to DAWs, we must:
    // 1. NOT prevent default (let native drag behavior happen)
    // 2. Call Electron's startDrag which sets up native pasteboard
    // 3. NOT set conflicting dataTransfer data

    setIsDragging(true)
    setDragSampleId(sample._id)

    // Trigger native file drag via Electron - this sets up the macOS pasteboard
    // with the file path in a format that DAWs understand
    window.electron.startDrag(localPath)
  }, [isDownloaded, getLocalPath])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setDragSampleId(null)
  }, [])

  // For multiple files - check all are downloaded first
  const handleDragMultiple = useCallback((
    e: React.DragEvent,
    samples: Sample[]
  ) => {
    const ownedSamples = samples.filter(s => s.isOwned && s.fileUrl)

    if (ownedSamples.length === 0) {
      e.preventDefault()
      return
    }

    // Check all samples are downloaded
    const localPaths: string[] = []
    for (const sample of ownedSamples) {
      const localPath = getLocalPath(sample._id)
      if (isDownloaded(sample._id) && localPath) {
        localPaths.push(localPath)
      }
    }

    if (localPaths.length === 0) {
      e.preventDefault()
      setNeedsDownload('multiple')
      setTimeout(() => setNeedsDownload(null), 2000)
      return
    }

    // Set drag data
    e.dataTransfer.setData('text/plain', localPaths.join('\n'))
    e.dataTransfer.effectAllowed = 'copy'

    setIsDragging(true)

    // Electron only supports single file in startDrag, but we can drag multiple via the dataTransfer
    window.electron.startDragMultiple(localPaths)
  }, [isDownloaded, getLocalPath])

  // Helper to check if a sample can be dragged (owned + downloaded)
  const canDrag = useCallback((sample: Sample) => {
    if (!sample.isOwned) return false
    return isDownloaded(sample._id) && !!getLocalPath(sample._id)
  }, [isDownloaded, getLocalPath])

  // Prepare drag on mouse down - this sets up native event monitors BEFORE drag starts
  const handleMouseDown = useCallback((sample: Sample) => {
    if (!sample.isOwned) return

    const localPath = getLocalPath(sample._id)
    if (!localPath || !isDownloaded(sample._id)) return

    // Prepare native drag on mouse down, before the drag gesture starts
    window.electron.prepareDrag(localPath)
  }, [getLocalPath, isDownloaded])

  const getDragProps = useCallback((sample: Sample) => {
    const downloaded = isDownloaded(sample._id) && !!getLocalPath(sample._id)
    const canDragNow = sample.isOwned && downloaded

    return {
      draggable: sample.isOwned,
      onMouseDown: () => handleMouseDown(sample),
      onDragStart: (e: React.DragEvent) => handleDragStart(e, sample),
      onDragEnd: handleDragEnd,
      style: {
        cursor: canDragNow ? 'grab' : sample.isOwned ? 'not-allowed' : 'default'
      }
    }
  }, [handleDragStart, handleDragEnd, handleMouseDown, isDownloaded, getLocalPath])

  return {
    isDragging,
    dragSampleId,
    needsDownload,
    handleDragStart,
    handleDragEnd,
    handleDragMultiple,
    getDragProps,
    isDownloaded,
    canDrag,
    getLocalPath
  }
}
