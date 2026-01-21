import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Define the API types
export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>
  getPlatform: () => Promise<{ platform: string; arch: string; version: string }>

  // File system
  getDownloadPath: () => Promise<string>
  setDownloadPath: () => Promise<string | null>
  openFolder: (path: string) => Promise<boolean>
  showItemInFolder: (path: string) => Promise<boolean>
  ensureDirectory: (path: string) => Promise<boolean>
  fileExists: (path: string) => Promise<boolean>
  downloadFile: (url: string, localPath: string) => Promise<{ success: boolean; path?: string; size?: number; error?: string }>
  writeFile: (path: string, data: ArrayBuffer) => Promise<{ success: boolean; error?: string }>

  // Drag and drop
  startDrag: (filePath: string) => void
  startDragMultiple: (filePaths: string[]) => void

  // Store (preferences)
  storeGet: (key: string) => Promise<unknown>
  storeSet: (key: string, value: unknown) => Promise<boolean>

  // External
  openExternal: (url: string) => Promise<boolean>

  // Updates
  checkForUpdates: () => Promise<{ success: boolean; updateInfo?: unknown; error?: string }>
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>
  installUpdate: () => void

  // Window controls
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void

  // Event listeners
  onNavigate: (callback: (path: string) => void) => () => void
  onUpdaterStatus: (callback: (status: { status: string; data?: unknown }) => void) => () => void
  onCheckForUpdates: (callback: () => void) => () => void
  onDownloadProgress: (callback: (progress: { localPath: string; progress: number; downloadedSize: number; totalSize: number }) => void) => () => void
}

// Expose protected methods to the renderer process
const electronAPI: ElectronAPI = {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // File system
  getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
  setDownloadPath: () => ipcRenderer.invoke('set-download-path'),
  openFolder: (path: string) => ipcRenderer.invoke('open-folder', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('show-item-in-folder', path),
  ensureDirectory: (path: string) => ipcRenderer.invoke('ensure-directory', path),
  fileExists: (path: string) => ipcRenderer.invoke('file-exists', path),
  downloadFile: (url: string, localPath: string) => ipcRenderer.invoke('download-file', url, localPath),
  writeFile: (path: string, data: ArrayBuffer) => ipcRenderer.invoke('write-file', path, data),

  // Drag and drop
  startDrag: (filePath: string) => ipcRenderer.send('start-drag', filePath),
  startDragMultiple: (filePaths: string[]) => ipcRenderer.send('start-drag-multiple', filePaths),

  // Store (preferences)
  storeGet: (key: string) => ipcRenderer.invoke('store-get', key),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),

  // External
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),

  // Window controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // Event listeners
  onNavigate: (callback: (path: string) => void) => {
    const handler = (_event: IpcRendererEvent, path: string) => callback(path)
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
  },

  onUpdaterStatus: (callback: (status: { status: string; data?: unknown }) => void) => {
    const handler = (_event: IpcRendererEvent, status: { status: string; data?: unknown }) => callback(status)
    ipcRenderer.on('updater-status', handler)
    return () => ipcRenderer.removeListener('updater-status', handler)
  },

  onCheckForUpdates: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('check-for-updates', handler)
    return () => ipcRenderer.removeListener('check-for-updates', handler)
  },

  onDownloadProgress: (callback: (progress: { localPath: string; progress: number; downloadedSize: number; totalSize: number }) => void) => {
    const handler = (_event: IpcRendererEvent, progress: { localPath: string; progress: number; downloadedSize: number; totalSize: number }) => callback(progress)
    ipcRenderer.on('download-progress', handler)
    return () => ipcRenderer.removeListener('download-progress', handler)
  }
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI)

// Type declaration for the window object
declare global {
  interface Window {
    electron: ElectronAPI
  }
}
