import { ipcMain, dialog, shell, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, writeFileSync, createWriteStream } from 'fs'
import Store from 'electron-store'
import https from 'https'
import http from 'http'

const store = new Store()

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

  // Start native drag operation
  ipcMain.on('start-drag', (event, filePath: string) => {
    if (!existsSync(filePath)) {
      console.error('File not found for drag:', filePath)
      return
    }

    // Create drag icon
    const iconPath = join(__dirname, '../../resources/drag-icon.png')
    const icon = existsSync(iconPath)
      ? nativeImage.createFromPath(iconPath)
      : nativeImage.createEmpty()

    event.sender.startDrag({
      file: filePath,
      icon: icon
    })
  })

  // Start drag with multiple files
  ipcMain.on('start-drag-multiple', (event, filePaths: string[]) => {
    const validPaths = filePaths.filter(p => existsSync(p))
    if (validPaths.length === 0) {
      console.error('No valid files for drag')
      return
    }

    const iconPath = join(__dirname, '../../resources/drag-icon.png')
    const icon = existsSync(iconPath)
      ? nativeImage.createFromPath(iconPath)
      : nativeImage.createEmpty()

    // Drag the first file (Electron doesn't support multiple files in startDrag)
    // For multiple files, users should select and drag from Finder/Explorer
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

  // Download file from URL to local path
  ipcMain.handle('download-file', async (event, url: string, localPath: string) => {
    return new Promise((resolve, reject) => {
      // Ensure directory exists
      const dir = localPath.substring(0, localPath.lastIndexOf('/'))
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      const file = createWriteStream(localPath)
      const protocol = url.startsWith('https') ? https : http

      const request = protocol.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirect
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            file.close()
            ipcMain.emit('download-file', event, redirectUrl, localPath)
            return
          }
        }

        if (response.statusCode !== 200) {
          file.close()
          reject(new Error(`Download failed: ${response.statusCode}`))
          return
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10)
        let downloadedSize = 0

        response.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length
          if (totalSize > 0) {
            const progress = Math.round((downloadedSize / totalSize) * 100)
            event.sender.send('download-progress', { localPath, progress, downloadedSize, totalSize })
          }
        })

        response.pipe(file)

        file.on('finish', () => {
          file.close()
          resolve({ success: true, path: localPath, size: downloadedSize })
        })
      })

      request.on('error', (err) => {
        file.close()
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
