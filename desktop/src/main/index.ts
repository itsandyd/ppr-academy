import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { setupIpcHandlers } from './ipc'
import { createTray } from './tray'
import { setupAutoUpdater } from './updater'

let mainWindow: BrowserWindow | null = null

// Track if app is quitting (cast to any to allow dynamic property)
const appWithQuit = app as typeof app & { isQuitting: boolean }
appWithQuit.isQuitting = false

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false, // Required for Clerk to load external scripts
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open DevTools in development
  if (is.dev) {
    mainWindow.webContents.openDevTools()
  }

  // Handle window close - minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!appWithQuit.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
}

// App ready
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.ppr-academy.samples')

  // Watch for shortcuts in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Setup IPC handlers
  setupIpcHandlers()

  // Create the main window
  createWindow()

  // Create system tray
  createTray(mainWindow)

  // Setup auto-updater (only in production)
  if (!is.dev) {
    setupAutoUpdater(mainWindow)
  }

  app.on('activate', function () {
    // On macOS re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle app quit
app.on('before-quit', () => {
  appWithQuit.isQuitting = true
})

// Export for use in tray.ts
export { appWithQuit }
