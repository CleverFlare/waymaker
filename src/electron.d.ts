interface Window {
  electronAPI: {
    platform: string
    onImportFiles: (callback: (files: { name: string; buffer: ArrayBuffer }[]) => void) => () => void
  }
}
