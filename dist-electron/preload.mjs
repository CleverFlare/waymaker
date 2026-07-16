let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	platform: process.platform,
	onImportFiles: (callback) => {
		const handler = (_event, files) => callback(files);
		electron.ipcRenderer.on("import-files", handler);
		return () => electron.ipcRenderer.removeListener("import-files", handler);
	}
});
//#endregion
