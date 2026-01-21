import { useState, useEffect } from 'react'
import { FolderOpen, RefreshCw, Pause, Trash2 } from 'lucide-react'

interface DownloadItem {
  id: string
  title: string
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'error'
  size?: string
  filePath?: string
}

export function DownloadsPage() {
  const [downloadPath, setDownloadPath] = useState<string>('')
  const [downloads] = useState<DownloadItem[]>([])

  useEffect(() => {
    // Get the current download path
    window.electron.getDownloadPath().then(setDownloadPath)

    // TODO: Load active downloads from store
    // For now, show empty state
  }, [])

  const handleChangeDownloadPath = async () => {
    const newPath = await window.electron.setDownloadPath()
    if (newPath) {
      setDownloadPath(newPath)
    }
  }

  const handleOpenDownloadFolder = () => {
    window.electron.openFolder(downloadPath)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h1 className="text-2xl font-bold">Downloads</h1>
        <p className="text-sm text-muted-foreground">
          Manage your downloaded samples
        </p>

        {/* Download path */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 truncate rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm">
            {downloadPath || 'No download path set'}
          </div>
          <button
            onClick={handleChangeDownloadPath}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-secondary"
          >
            Change
          </button>
          <button
            onClick={handleOpenDownloadFolder}
            className="rounded-lg border border-input bg-background p-2 transition-colors hover:bg-secondary"
            title="Open download folder"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Download queue */}
      <div className="flex-1 overflow-auto p-4">
        {downloads.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-medium">No active downloads</div>
              <div className="text-sm text-muted-foreground">
                Purchase and download samples to see them here
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {downloads.map((download) => (
              <div
                key={download.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{download.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {download.status === 'completed'
                        ? 'Downloaded'
                        : download.status === 'downloading'
                          ? `${download.progress}%`
                          : download.status === 'error'
                            ? 'Failed'
                            : 'Pending'}
                    </span>
                    {download.size && <span>• {download.size}</span>}
                  </div>

                  {/* Progress bar */}
                  {download.status === 'downloading' && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${download.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {download.status === 'downloading' && (
                    <button className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground">
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  {download.status === 'error' && (
                    <button className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                  {download.status === 'completed' && download.filePath && (
                    <button
                      onClick={() => window.electron.showItemInFolder(download.filePath!)}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                  )}
                  <button className="rounded p-1.5 text-muted-foreground transition-colors hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
