import { Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import { appWithQuit } from './index'
import { join } from 'path'
import { existsSync } from 'fs'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow | null): Tray {
  // Create tray icon
  const iconPath = join(__dirname, '../../resources/tray-icon.png')
  const icon = existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty()

  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show PPR Samples',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'My Library',
      click: () => {
        mainWindow?.show()
        mainWindow?.webContents.send('navigate', '/library')
      }
    },
    {
      label: 'Downloads',
      click: () => {
        mainWindow?.show()
        mainWindow?.webContents.send('navigate', '/downloads')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Preferences...',
      accelerator: 'CmdOrCtrl+,',
      click: () => {
        mainWindow?.show()
        mainWindow?.webContents.send('navigate', '/settings')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Check for Updates...',
      click: () => {
        mainWindow?.webContents.send('check-for-updates')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit PPR Samples',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        appWithQuit.isQuitting = true
        appWithQuit.quit()
      }
    }
  ])

  tray.setToolTip('PPR Samples')
  tray.setContextMenu(contextMenu)

  // Double-click to show window
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  return tray
}

export function updateTrayMenu(_mainWindow: BrowserWindow | null, _status?: string): void {
  if (!tray) return

  // Could update tray menu dynamically based on status
  // For example, show current playing sample, download progress, etc.
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
