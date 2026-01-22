import { useCallback, useEffect } from 'react'
import { useDownloadStore } from '../stores/downloadStore'

interface DownloadOptions {
  sampleId: string
  title: string
  url: string
  genre?: string
}

export function useDownload() {
  const { addDownload, updateProgress, setStatus, updateLocalPath, getDownloadBySampleId } = useDownloadStore()

  // Listen for download progress from main process
  useEffect(() => {
    const unsubscribe = window.electron.onDownloadProgress((progress) => {
      // Find download by localPath and update progress
      const downloads = useDownloadStore.getState().downloads
      const download = downloads.find(d => d.localPath === progress.localPath)
      if (download) {
        updateProgress(download.id, progress.progress, progress.downloadedSize)
      }
    })
    return unsubscribe
  }, [updateProgress])

  const downloadSample = useCallback(async (options: DownloadOptions) => {
    const { sampleId, title, url, genre } = options

    // Check if already downloading or downloaded
    const existing = getDownloadBySampleId(sampleId)
    if (existing) {
      if (existing.status === 'downloading') {
        return existing.localPath
      }
      if (existing.status === 'completed') {
        // Verify file still exists
        const exists = await window.electron.fileExists(existing.localPath)
        if (exists) {
          return existing.localPath
        }
      }
    }

    // Get download path
    const basePath = await window.electron.getDownloadPath()
    const folder = genre || 'Uncategorized'
    const safeName = title.replace(/[/\\?%*:|"<>]/g, '-')

    // Detect file extension from URL, default to mp3 (most common)
    let extension = 'mp3'
    const urlLower = url.toLowerCase()
    if (urlLower.includes('.wav')) {
      extension = 'wav'
    } else if (urlLower.includes('.aif') || urlLower.includes('.aiff')) {
      extension = 'aiff'
    } else if (urlLower.includes('.flac')) {
      extension = 'flac'
    } else if (urlLower.includes('.ogg')) {
      extension = 'ogg'
    } else if (urlLower.includes('.mp3')) {
      extension = 'mp3'
    }

    const localPath = `${basePath}/${folder}/${safeName}.${extension}`

    // Create download ID
    const id = `${sampleId}-${Date.now()}`

    // Add to download store
    addDownload({
      id,
      sampleId,
      title,
      url,
      localPath
    })

    // Start download using native API
    try {
      setStatus(id, 'downloading')

      const result = await window.electron.downloadFile(url, localPath)

      if (result.success) {
        // Use the final path returned (may have corrected extension based on content-type)
        const finalPath = result.path || localPath

        // Update the download item with the correct path if it changed
        if (finalPath !== localPath) {
          console.log('[Download] Path corrected to:', finalPath)
          updateLocalPath(id, finalPath)
        }

        setStatus(id, 'completed')
        updateProgress(id, 100, result.size)
        return finalPath
      } else {
        throw new Error(result.error || 'Download failed')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed'
      setStatus(id, 'error', message)
      throw error
    }
  }, [addDownload, updateProgress, setStatus, updateLocalPath, getDownloadBySampleId])

  const isDownloaded = useCallback(async (sampleId: string) => {
    const download = getDownloadBySampleId(sampleId)
    if (!download || download.status !== 'completed') {
      return false
    }
    // Verify file still exists
    return window.electron.fileExists(download.localPath)
  }, [getDownloadBySampleId])

  const getLocalPath = useCallback((sampleId: string) => {
    const download = getDownloadBySampleId(sampleId)
    return download?.localPath
  }, [getDownloadBySampleId])

  return {
    downloadSample,
    isDownloaded,
    getLocalPath
  }
}
