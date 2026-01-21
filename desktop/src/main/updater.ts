import { autoUpdater, UpdateInfo } from 'electron-updater'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import log from 'electron-log'

// Configure logging
autoUpdater.logger = log
log.transports.file.level = 'info'

let mainWindow: BrowserWindow | null = null
let updateCheckInterval: NodeJS.Timeout | null = null

// Check for updates every 4 hours
const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000

export function setupAutoUpdater(window: BrowserWindow | null): void {
  mainWindow = window

  // Disable auto download - let user decide
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false

  // Check for updates on startup (with small delay for app to fully load)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn('Initial update check failed:', err.message)
    })
  }, 5000)

  // Schedule periodic update checks
  updateCheckInterval = setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn('Periodic update check failed:', err.message)
    })
  }, UPDATE_CHECK_INTERVAL)

  // IPC handler for manual update check
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { success: true, updateInfo: result?.updateInfo }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // IPC handler to download update
  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // IPC handler to install update
  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
    sendStatusToWindow('checking-for-update')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Update available:', info)
    sendStatusToWindow('update-available', info)

    // Build release notes message
    let releaseNotes = ''
    if (info.releaseNotes) {
      if (typeof info.releaseNotes === 'string') {
        releaseNotes = `\n\nRelease Notes:\n${info.releaseNotes.substring(0, 500)}`
      } else if (Array.isArray(info.releaseNotes)) {
        releaseNotes = `\n\nRelease Notes:\n${info.releaseNotes.map(n => n.note).join('\n').substring(0, 500)}`
      }
    }

    // Ask user if they want to download
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.${releaseNotes}\n\nWould you like to download it now?`,
      buttons: ['Download', 'Later'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info)
    sendStatusToWindow('update-not-available', info)
  })

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err)
    sendStatusToWindow('error', err.message)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`
    log.info(logMessage)
    sendStatusToWindow('download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info)
    sendStatusToWindow('update-downloaded', info)

    // Ask user to restart
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'The update has been downloaded. Restart now to apply the update?',
      buttons: ['Restart', 'Later'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })
}

function sendStatusToWindow(status: string, data?: unknown): void {
  mainWindow?.webContents.send('updater-status', { status, data })
}

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates()
}

export function stopUpdateChecks(): void {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval)
    updateCheckInterval = null
  }
}
