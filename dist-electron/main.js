import { BrowserWindow, Menu, MenuItem, app, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
//#region electron/main.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
var win;
function createWindow() {
	win = new BrowserWindow({
		width: 1440,
		height: 900,
		webPreferences: {
			preload: path.join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	} else win.loadFile(path.join(process.env.DIST, "index.html"));
}
function addImportMenuItem() {
	const menu = Menu.getApplicationMenu();
	if (!menu) return;
	const fileMenu = menu.items.find((i) => i.label === "File");
	if (!fileMenu?.submenu) return;
	fileMenu.submenu.insert(0, new MenuItem({ type: "separator" }));
	fileMenu.submenu.insert(0, new MenuItem({
		label: "Import…",
		accelerator: "CmdOrCtrl+I",
		click: async () => {
			if (!win) return;
			const { canceled, filePaths } = await dialog.showOpenDialog(win, {
				properties: ["openFile", "multiSelections"],
				filters: [{
					name: "3D Models",
					extensions: ["glb", "gltf"]
				}]
			});
			if (!canceled && filePaths.length > 0) {
				const files = await Promise.all(filePaths.map(async (p) => ({
					name: path.basename(p),
					buffer: (await fs.readFile(p)).buffer
				})));
				win.webContents.send("import-files", files);
			}
		}
	}));
	Menu.setApplicationMenu(menu);
}
app.whenReady().then(() => {
	createWindow();
	addImportMenuItem();
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
//#endregion
export {};
