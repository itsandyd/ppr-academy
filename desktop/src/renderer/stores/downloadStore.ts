import { create } from 'zustand'

export interface DownloadItem {
  id: string
  sampleId: string
  title: string
  url: string
  localPath: string
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused'
  size?: number
  downloadedSize?: number
  error?: string
}

interface DownloadState {
  downloads: DownloadItem[]
  activeDownloads: number
  maxConcurrent: number
  isInitialized: boolean

  // Actions
  addDownload: (item: Omit<DownloadItem, 'progress' | 'status'>) => void
  updateProgress: (id: string, progress: number, downloadedSize?: number) => void
  setStatus: (id: string, status: DownloadItem['status'], error?: string) => void
  updateLocalPath: (id: string, newPath: string) => void
  removeDownload: (id: string) => void
  clearCompleted: () => void
  pauseDownload: (id: string) => void
  resumeDownload: (id: string) => void
  getDownloadBySampleId: (sampleId: string) => DownloadItem | undefined
  initializeFromStorage: () => Promise<void>
}

// Helper to persist downloads to electron-store
const persistDownloads = (downloads: DownloadItem[]) => {
  // Save all downloads (completed ones are important for drag-to-DAW)
  window.electron.storeSet('downloads', downloads)
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],
  activeDownloads: 0,
  maxConcurrent: 3,
  isInitialized: false,

  addDownload: (item) => {
    set((state) => {
      // Check if sample already exists
      const existing = state.downloads.find(d => d.sampleId === item.sampleId)
      if (existing) {
        return state // Don't add duplicate
      }
      const newDownloads = [
        ...state.downloads,
        {
          ...item,
          progress: 0,
          status: 'pending' as const
        }
      ]
      persistDownloads(newDownloads)
      return { downloads: newDownloads }
    })
  },

  updateProgress: (id, progress, downloadedSize) => {
    set((state) => {
      const newDownloads = state.downloads.map((d) =>
        d.id === id
          ? { ...d, progress, downloadedSize, status: 'downloading' as const }
          : d
      )
      return { downloads: newDownloads }
    })
  },

  setStatus: (id, status, error) => {
    set((state) => {
      const newDownloads = state.downloads.map((d) =>
        d.id === id ? { ...d, status, error } : d
      )
      // Persist when status changes (especially for completed)
      persistDownloads(newDownloads)
      return {
        downloads: newDownloads,
        activeDownloads:
          status === 'downloading'
            ? state.activeDownloads + 1
            : status === 'completed' || status === 'error'
              ? Math.max(0, state.activeDownloads - 1)
              : state.activeDownloads
      }
    })
  },

  updateLocalPath: (id, newPath) => {
    set((state) => {
      const newDownloads = state.downloads.map((d) =>
        d.id === id ? { ...d, localPath: newPath } : d
      )
      persistDownloads(newDownloads)
      return { downloads: newDownloads }
    })
  },

  removeDownload: (id) => {
    set((state) => {
      const newDownloads = state.downloads.filter((d) => d.id !== id)
      persistDownloads(newDownloads)
      return { downloads: newDownloads }
    })
  },

  clearCompleted: () => {
    set((state) => {
      const newDownloads = state.downloads.filter((d) => d.status !== 'completed')
      persistDownloads(newDownloads)
      return { downloads: newDownloads }
    })
  },

  pauseDownload: (id) => {
    set((state) => {
      const newDownloads = state.downloads.map((d) =>
        d.id === id ? { ...d, status: 'paused' as const } : d
      )
      persistDownloads(newDownloads)
      return {
        downloads: newDownloads,
        activeDownloads: Math.max(0, state.activeDownloads - 1)
      }
    })
  },

  resumeDownload: (id) => {
    set((state) => {
      const newDownloads = state.downloads.map((d) =>
        d.id === id ? { ...d, status: 'pending' as const } : d
      )
      persistDownloads(newDownloads)
      return { downloads: newDownloads }
    })
  },

  getDownloadBySampleId: (sampleId) => {
    return get().downloads.find((d) => d.sampleId === sampleId)
  },

  initializeFromStorage: async () => {
    if (get().isInitialized) return

    try {
      const stored = await window.electron.storeGet('downloads')
      if (Array.isArray(stored)) {
        // Verify completed downloads still exist on disk
        const validDownloads: DownloadItem[] = []
        for (const d of stored as DownloadItem[]) {
          if (d.status === 'completed') {
            const exists = await window.electron.fileExists(d.localPath)
            if (exists) {
              validDownloads.push(d)
            }
          } else if (d.status === 'downloading' || d.status === 'pending') {
            // Mark incomplete downloads as pending so they can be retried
            validDownloads.push({ ...d, status: 'pending', progress: 0 })
          }
        }
        set({ downloads: validDownloads, isInitialized: true })
        // Update storage with only valid downloads
        persistDownloads(validDownloads)
      } else {
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('Failed to load downloads from storage:', error)
      set({ isInitialized: true })
    }
  }
}))

// Initialize store on load
useDownloadStore.getState().initializeFromStorage()
