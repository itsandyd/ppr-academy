import { ipcMain, dialog, shell, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, createWriteStream } from 'fs'
import Store from 'electron-store'
import https from 'https'
import http from 'http'

const store = new Store()

// Native drag module for macOS (DAW-compatible drag and drop)
let nativeDrag: {
  prepareDrag: (filePath: string, nativeHandle: Buffer | null) => boolean
  startFileDrag: (filePath: string, nativeHandle: Buffer | null) => boolean
  startMultiFileDrag: (filePaths: string[], nativeHandle: Buffer | null) => boolean
  isMacOS: () => boolean
} | null = null

// Try to load the native drag module (only available on macOS after build)
try {
  if (process.platform === 'darwin') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    nativeDrag = require('bindings')('native_drag')
    console.log('[NativeDrag] Native drag module loaded successfully')
  }
} catch (err) {
  console.warn('[NativeDrag] Native drag module not available, falling back to Electron startDrag:', err)
  nativeDrag = null
}

// Default download path
const DEFAULT_DOWNLOAD_PATH = join(app.getPath('music'), 'PPR Samples')

export function setupIpcHandlers(): void {
  // Get app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // Get download path
  ipcMain.handle('get-download-path', () => {
    return store.get('downloadPath', DEFAULT_DOWNLOAD_PATH)
  })

  // Set download path
  ipcMain.handle('set-download-path', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Download Location',
      defaultPath: store.get('downloadPath', DEFAULT_DOWNLOAD_PATH) as string
    })

    if (!result.canceled && result.filePaths[0]) {
      store.set('downloadPath', result.filePaths[0])
      return result.filePaths[0]
    }
    return null
  })

  // Open folder in file explorer
  ipcMain.handle('open-folder', async (_, path: string) => {
    if (existsSync(path)) {
      shell.openPath(path)
      return true
    }
    return false
  })

  // Show item in folder
  ipcMain.handle('show-item-in-folder', async (_, path: string) => {
    if (existsSync(path)) {
      shell.showItemInFolder(path)
      return true
    }
    return false
  })

  // Prepare for drag - call on mousedown BEFORE drag starts
  ipcMain.on('prepare-drag', (event, filePath: string) => {
    if (!nativeDrag || process.platform !== 'darwin') {
      return
    }

    const path = require('path')
    const normalizedPath = path.resolve(filePath)

    if (!existsSync(normalizedPath)) {
      console.error('[Drag] File not found for prepare:', normalizedPath)
      return
    }

    console.log('[Drag] Preparing drag for:', normalizedPath)

    const window = BrowserWindow.fromWebContents(event.sender)
    let nativeHandle: Buffer | null = null

    if (window) {
      try {
        nativeHandle = window.getNativeWindowHandle()
      } catch (e) {
        // ignore
      }
    }

    try {
      nativeDrag.prepareDrag(normalizedPath, nativeHandle)
      console.log('[Drag] Drag prepared, waiting for mouse drag event')
    } catch (err) {
      console.error('[Drag] Prepare failed:', err)
    }
  })

  // Start native drag operation
  ipcMain.on('start-drag', (event, filePath: string) => {
    console.log('[Drag] Attempting to drag file:', filePath)

    const path = require('path')
    const fs = require('fs')
    const normalizedPath = path.resolve(filePath)
    console.log('[Drag] Normalized path:', normalizedPath)

    if (!existsSync(normalizedPath)) {
      console.error('[Drag] File not found:', normalizedPath)
      return
    }

    const stats = fs.statSync(normalizedPath)
    console.log('[Drag] File size:', stats.size, 'bytes')

    if (stats.size === 0) {
      console.error('[Drag] File is empty!')
      return
    }

    // On macOS, use native drag module for DAW compatibility
    if (nativeDrag && process.platform === 'darwin') {
      console.log('[Drag] Using native macOS drag')

      const window = BrowserWindow.fromWebContents(event.sender)
      let nativeHandle: Buffer | null = null

      if (window) {
        try {
          nativeHandle = window.getNativeWindowHandle()
        } catch (handleErr) {
          console.warn('[Drag] Could not get native handle:', handleErr)
        }
      }

      try {
        const success = nativeDrag.startFileDrag(normalizedPath, nativeHandle)
        if (success) {
          console.log('[Drag] Native drag setup complete (waiting for mouse drag)')
          return // Don't also call Electron's startDrag
        }
      } catch (nativeErr) {
        console.error('[Drag] Native drag failed:', nativeErr)
      }
    }

    // Fallback to Electron's startDrag for non-macOS
    console.log('[Drag] Using Electron startDrag fallback')
    const icon = nativeImage.createEmpty()

    try {
      event.sender.startDrag({
        file: normalizedPath,
        icon: icon
      })
      console.log('[Drag] Electron drag initiated')
    } catch (err) {
      console.error('[Drag] Error starting drag:', err)
    }
  })

  // Alternative: Copy file path to clipboard for manual drag
  ipcMain.handle('copy-file-path', (_, filePath: string) => {
    const { clipboard } = require('electron')
    clipboard.writeText(filePath)
    return true
  })

  // Start drag with multiple files
  ipcMain.on('start-drag-multiple', (event, filePaths: string[]) => {
    const path = require('path')
    const validPaths = filePaths
      .map(p => path.resolve(p))
      .filter(p => existsSync(p))

    if (validPaths.length === 0) {
      console.error('[Drag] No valid files for multi-drag')
      return
    }

    console.log('[Drag] Multi-drag with', validPaths.length, 'files')

    // Try native drag module first (macOS only, DAW-compatible)
    if (nativeDrag && process.platform === 'darwin') {
      console.log('[Drag] Using native macOS drag for multiple files')

      const window = BrowserWindow.fromWebContents(event.sender)
      let nativeHandle: Buffer | null = null

      if (window) {
        try {
          nativeHandle = window.getNativeWindowHandle()
        } catch (handleErr) {
          console.warn('[Drag] Could not get native handle:', handleErr)
        }
      }

      try {
        const success = nativeDrag.startMultiFileDrag(validPaths, nativeHandle)
        if (success) {
          console.log('[Drag] Native multi-drag initiated successfully')
          return
        }
      } catch (nativeErr) {
        console.error('[Drag] Native multi-drag failed:', nativeErr)
      }
    }

    // Fallback to Electron's startDrag (only first file)
    console.log('[Drag] Using Electron fallback for multi-drag (first file only)')
    const iconPath = join(__dirname, '../../resources/drag-icon.png')
    const icon = existsSync(iconPath)
      ? nativeImage.createFromPath(iconPath)
      : nativeImage.createEmpty()

    if (validPaths.length > 0) {
      event.sender.startDrag({
        file: validPaths[0],
        icon: icon
      })
    }
  })

  // Store get/set for preferences
  ipcMain.handle('store-get', (_, key: string) => {
    return store.get(key)
  })

  ipcMain.handle('store-set', (_, key: string, value: unknown) => {
    store.set(key, value)
    return true
  })

  // Create directory if it doesn't exist
  ipcMain.handle('ensure-directory', (_, path: string) => {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true })
    }
    return true
  })

  // Check if file exists
  ipcMain.handle('file-exists', (_, path: string) => {
    return existsSync(path)
  })

  // Helper to get correct extension from content-type
  function getExtensionFromContentType(contentType: string | undefined): string | null {
    if (!contentType) return null
    const type = contentType.toLowerCase().split(';')[0].trim()
    const mimeToExt: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/x-wav': 'wav',
      'audio/aiff': 'aiff',
      'audio/x-aiff': 'aiff',
      'audio/flac': 'flac',
      'audio/x-flac': 'flac',
      'audio/ogg': 'ogg',
      'audio/m4a': 'm4a',
      'audio/mp4': 'm4a',
      'audio/aac': 'aac'
    }
    return mimeToExt[type] || null
  }

  // Download file from URL to local path
  ipcMain.handle('download-file', async (event, url: string, localPath: string) => {
    console.log('[Download] Starting download:', url)
    console.log('[Download] Initial path:', localPath)

    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http

      const request = protocol.get(url, (response) => {
        console.log('[Download] Response status:', response.statusCode)
        console.log('[Download] Content-Type:', response.headers['content-type'])

        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location
          console.log('[Download] Redirecting to:', redirectUrl)
          if (redirectUrl) {
            // Recursively handle redirect by invoking the handler again
            ipcMain.emit('download-file', event, redirectUrl, localPath)
            return
          }
        }

        if (response.statusCode !== 200) {
          console.error('[Download] Failed with status:', response.statusCode)
          reject(new Error(`Download failed: ${response.statusCode}`))
          return
        }

        // Detect correct extension from Content-Type
        const detectedExt = getExtensionFromContentType(response.headers['content-type'])
        let finalPath = localPath

        if (detectedExt) {
          // Replace extension in path
          const pathWithoutExt = localPath.replace(/\.[^/.]+$/, '')
          finalPath = `${pathWithoutExt}.${detectedExt}`
          console.log('[Download] Detected format:', detectedExt)
          console.log('[Download] Final path:', finalPath)
        }

        // Ensure directory exists
        const dir = finalPath.substring(0, finalPath.lastIndexOf('/'))
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true })
          console.log('[Download] Created directory:', dir)
        }

        const file = createWriteStream(finalPath)
        const totalSize = parseInt(response.headers['content-length'] || '0', 10)
        let downloadedSize = 0
        console.log('[Download] Total size:', totalSize, 'bytes')

        response.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length
          if (totalSize > 0) {
            const progress = Math.round((downloadedSize / totalSize) * 100)
            event.sender.send('download-progress', { localPath: finalPath, progress, downloadedSize, totalSize })
          }
        })

        response.pipe(file)

        file.on('finish', () => {
          file.close()
          console.log('[Download] Complete! Size:', downloadedSize, 'bytes')
          // Return the final path (with correct extension)
          resolve({ success: true, path: finalPath, size: downloadedSize })
        })

        file.on('error', (err) => {
          file.close()
          console.error('[Download] File write error:', err.message)
          reject(err)
        })
      })

      request.on('error', (err) => {
        console.error('[Download] Request error:', err.message)
        reject(err)
      })
    })
  })

  // Write buffer to file
  ipcMain.handle('write-file', async (_, path: string, data: ArrayBuffer) => {
    try {
      const dir = path.substring(0, path.lastIndexOf('/'))
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(path, Buffer.from(data))
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // Open external link
  ipcMain.handle('open-external', async (_, url: string) => {
    await shell.openExternal(url)
    return true
  })

  // Get platform info
  ipcMain.handle('get-platform', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.getSystemVersion()
    }
  })

  // Select audio file for upload
  ipcMain.handle('select-audio-file', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Audio Sample',
      properties: ['openFile'],
      filters: [
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'aiff', 'flac', 'ogg'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const fs = require('fs')
    const path = require('path')

    try {
      const stats = fs.statSync(filePath)
      const fileName = path.basename(filePath)
      const extension = path.extname(filePath).toLowerCase().slice(1)

      // Read file as buffer for upload
      const fileBuffer = fs.readFileSync(filePath)

      return {
        path: filePath,
        name: fileName,
        size: stats.size,
        format: extension,
        buffer: fileBuffer.toString('base64') // Base64 encode for IPC transfer
      }
    } catch (error) {
      console.error('[Upload] Error reading file:', error)
      return null
    }
  })

  // Read audio file as ArrayBuffer for upload
  ipcMain.handle('read-audio-file', async (_, filePath: string) => {
    const fs = require('fs')
    try {
      const buffer = fs.readFileSync(filePath)
      return buffer
    } catch (error) {
      console.error('[Upload] Error reading file:', error)
      return null
    }
  })

  // Window controls
  ipcMain.on('window-minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.minimize()
  })

  ipcMain.on('window-maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window?.isMaximized()) {
      window.unmaximize()
    } else {
      window?.maximize()
    }
  })

  ipcMain.on('window-close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.close()
  })
}
