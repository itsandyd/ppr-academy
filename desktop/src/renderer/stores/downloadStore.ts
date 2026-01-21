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

  // Actions
  addDownload: (item: Omit<DownloadItem, 'progress' | 'status'>) => void
  updateProgress: (id: string, progress: number, downloadedSize?: number) => void
  setStatus: (id: string, status: DownloadItem['status'], error?: string) => void
  removeDownload: (id: string) => void
  clearCompleted: () => void
  pauseDownload: (id: string) => void
  resumeDownload: (id: string) => void
  getDownloadBySampleId: (sampleId: string) => DownloadItem | undefined
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],
  activeDownloads: 0,
  maxConcurrent: 3,

  addDownload: (item) => {
    set((state) => ({
      downloads: [
        ...state.downloads,
        {
          ...item,
          progress: 0,
          status: 'pending'
        }
      ]
    }))
  },

  updateProgress: (id, progress, downloadedSize) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id
          ? { ...d, progress, downloadedSize, status: 'downloading' as const }
          : d
      )
    }))
  },

  setStatus: (id, status, error) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, status, error } : d
      ),
      activeDownloads:
        status === 'downloading'
          ? state.activeDownloads + 1
          : status === 'completed' || status === 'error'
            ? Math.max(0, state.activeDownloads - 1)
            : state.activeDownloads
    }))
  },

  removeDownload: (id) => {
    set((state) => ({
      downloads: state.downloads.filter((d) => d.id !== id)
    }))
  },

  clearCompleted: () => {
    set((state) => ({
      downloads: state.downloads.filter((d) => d.status !== 'completed')
    }))
  },

  pauseDownload: (id) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, status: 'paused' as const } : d
      ),
      activeDownloads: Math.max(0, state.activeDownloads - 1)
    }))
  },

  resumeDownload: (id) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === id ? { ...d, status: 'pending' as const } : d
      )
    }))
  },

  getDownloadBySampleId: (sampleId) => {
    return get().downloads.find((d) => d.sampleId === sampleId)
  }
}))

// Load persisted downloads on startup
window.electron.storeGet('pendingDownloads').then((downloads) => {
  if (Array.isArray(downloads)) {
    downloads.forEach((d: DownloadItem) => {
      if (d.status !== 'completed') {
        useDownloadStore.getState().addDownload(d)
      }
    })
  }
})
