import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onImportFiles: (callback: (files: { name: string; buffer: ArrayBuffer }[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, files: { name: string; buffer: ArrayBuffer }[]) => callback(files)
    ipcRenderer.on('import-files', handler)
    return () => ipcRenderer.removeListener('import-files', handler)
  },
})
