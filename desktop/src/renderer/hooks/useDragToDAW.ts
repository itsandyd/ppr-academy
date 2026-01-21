import { useCallback, useState } from 'react'
import { useDownload } from './useDownload'
import { useDownloadStore } from '../stores/downloadStore'

interface Sample {
  _id: string
  title: string
  fileUrl?: string
  genre?: string
  isOwned?: boolean
}

export function useDragToDAW() {
  const { downloadSample, getLocalPath } = useDownload()
  const { getDownloadBySampleId } = useDownloadStore()
  const [isDragging, setIsDragging] = useState(false)
  const [dragSampleId, setDragSampleId] = useState<string | null>(null)

  // Check if sample is downloaded (sync check via store)
  const isDownloaded = useCallback((sampleId: string) => {
    const download = getDownloadBySampleId(sampleId)
    return download?.status === 'completed'
  }, [getDownloadBySampleId])

  const handleDragStart = useCallback(async (
    e: React.DragEvent,
    sample: Sample
  ) => {
    // Prevent default browser drag behavior
    e.preventDefault()

    if (!sample.isOwned) {
      console.log('Sample not owned, cannot drag')
      return
    }

    if (!sample.fileUrl) {
      console.log('Sample has no file URL')
      return
    }

    setIsDragging(true)
    setDragSampleId(sample._id)

    try {
      let localPath = getLocalPath(sample._id)

      // If not downloaded, download first
      if (!isDownloaded(sample._id) || !localPath) {
        localPath = await downloadSample({
          sampleId: sample._id,
          title: sample.title,
          url: sample.fileUrl,
          genre: sample.genre
        })
      }

      if (localPath) {
        // Check if file exists locally
        const exists = await window.electron.fileExists(localPath)

        if (exists) {
          // Start native drag
          window.electron.startDrag(localPath)
        } else {
          console.error('File not found locally:', localPath)
        }
      }
    } catch (error) {
      console.error('Drag failed:', error)
    } finally {
      setIsDragging(false)
      setDragSampleId(null)
    }
  }, [downloadSample, isDownloaded, getLocalPath])

  const handleDragMultiple = useCallback(async (
    samples: Sample[]
  ) => {
    const ownedSamples = samples.filter(s => s.isOwned && s.fileUrl)

    if (ownedSamples.length === 0) {
      console.log('No owned samples to drag')
      return
    }

    setIsDragging(true)

    try {
      const localPaths: string[] = []

      for (const sample of ownedSamples) {
        let localPath = getLocalPath(sample._id)

        if (!isDownloaded(sample._id) || !localPath) {
          localPath = await downloadSample({
            sampleId: sample._id,
            title: sample.title,
            url: sample.fileUrl!,
            genre: sample.genre
          })
        }

        if (localPath) {
          const exists = await window.electron.fileExists(localPath)
          if (exists) {
            localPaths.push(localPath)
          }
        }
      }

      if (localPaths.length > 0) {
        window.electron.startDragMultiple(localPaths)
      }
    } catch (error) {
      console.error('Multi-drag failed:', error)
    } finally {
      setIsDragging(false)
    }
  }, [downloadSample, isDownloaded, getLocalPath])

  const getDragProps = useCallback((sample: Sample) => ({
    draggable: sample.isOwned,
    onDragStart: (e: React.DragEvent) => handleDragStart(e, sample),
    style: {
      cursor: sample.isOwned ? 'grab' : 'default'
    }
  }), [handleDragStart])

  return {
    isDragging,
    dragSampleId,
    handleDragStart,
    handleDragMultiple,
    getDragProps,
    isDownloaded,
    getLocalPath
  }
}
