import { app, BrowserWindow, dialog, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
	? process.env.DIST
	: path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;

function createWindow() {
	win = new BrowserWindow({
		width: 1440,
		height: 900,
		webPreferences: {
			preload: path.join(__dirname, 'preload.mjs'),
			contextIsolation: true,
			nodeIntegration: false
		}
	});

	if (process.env.VITE_DEV_SERVER_URL) {
		win.loadURL(process.env.VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	} else {
		win.loadFile(path.join(process.env.DIST!, 'index.html'));
	}
}

function buildApplicationMenu() {
	const isMac = process.platform === 'darwin';

	const template: Electron.MenuItemConstructorOptions[] = [
		...(isMac ? [{ role: 'appMenu' as const }] : []),
		{
			label: 'File',
			submenu: [
				{
					label: 'Import…',
					accelerator: 'CmdOrCtrl+I',
					click: async () => {
						if (!win) return;
						const { canceled, filePaths } = await dialog.showOpenDialog(win, {
							properties: ['openFile', 'multiSelections'],
							filters: [
								{
									name: 'All Assets',
									extensions: ['glb', 'gltf', 'png', 'jpg', 'jpeg', 'webp']
								},
								{ name: '3D Models', extensions: ['glb', 'gltf'] },
								{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
							]
						});
						if (!canceled && filePaths.length > 0) {
							const files = await Promise.all(
								filePaths.map(async (p) => ({
									name: path.basename(p),
									buffer: (await fs.readFile(p)).buffer as ArrayBuffer
								}))
							);
							win!.webContents.send('import-files', files);
						}
					}
				},
				{ type: 'separator' },
				isMac ? { role: 'close' as const } : { role: 'quit' as const }
			]
		},
		{
			label: 'Edit',
			submenu: [
				{
					label: 'Undo',
					accelerator: 'CmdOrCtrl+Z',
					click: () => win?.webContents.send('undo')
				},
				{
					label: 'Redo',
					accelerator: 'CmdOrCtrl+Shift+Z',
					click: () => win?.webContents.send('redo')
				},
				{ type: 'separator' },
				{ role: 'cut' },
				{ role: 'copy' },
				{ role: 'paste' },
				{ role: 'selectAll' }
			]
		},
		{
			label: 'View',
			submenu: [
				{ role: 'reload' },
				{ role: 'forceReload' },
				{ role: 'toggleDevTools' },
				{ type: 'separator' },
				{ role: 'resetZoom' },
				{ role: 'zoomIn' },
				{ role: 'zoomOut' },
				{ type: 'separator' },
				{ role: 'togglefullscreen' }
			]
		},
		{
			label: 'Window',
			submenu: [
				{ role: 'minimize' },
				...(isMac
					? [{ role: 'zoom' as const }, { type: 'separator' as const }, { role: 'front' as const }]
					: [{ role: 'close' as const }])
			]
		}
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
	createWindow();
	buildApplicationMenu();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
		win = null;
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
