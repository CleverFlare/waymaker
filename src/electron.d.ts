interface Window {
  electronAPI: {
    platform: string
    onImportFiles: (callback: (files: { name: string; buffer: ArrayBuffer }[]) => void) => () => void
    onUndo: (callback: () => void) => () => void
    onRedo: (callback: () => void) => () => void
  }
}
