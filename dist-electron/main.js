import { BrowserWindow as e, Menu as t, MenuItem as n, app as r, dialog as i } from "electron";
import a from "node:path";
import { fileURLToPath as o } from "node:url";
import s from "node:fs/promises";
//#region electron/main.ts
var c = a.dirname(o(import.meta.url));
process.env.DIST = a.join(c, "../dist"), process.env.VITE_PUBLIC = r.isPackaged ? process.env.DIST : a.join(process.env.DIST, "../public");
var l;
function u() {
	l = new e({
		width: 1440,
		height: 900,
		webPreferences: {
			preload: a.join(c, "preload.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		}
	}), process.env.VITE_DEV_SERVER_URL ? (l.loadURL(process.env.VITE_DEV_SERVER_URL), l.webContents.openDevTools()) : l.loadFile(a.join(process.env.DIST, "index.html"));
}
function d() {
	let e = t.getApplicationMenu();
	if (!e) return;
	let r = e.items.find((e) => e.label === "File");
	r?.submenu && (r.submenu.insert(0, new n({ type: "separator" })), r.submenu.insert(0, new n({
		label: "Import…",
		accelerator: "CmdOrCtrl+I",
		click: async () => {
			if (!l) return;
			let { canceled: e, filePaths: t } = await i.showOpenDialog(l, {
				properties: ["openFile", "multiSelections"],
				filters: [
					{
						name: "All Assets",
						extensions: [
							"glb",
							"gltf",
							"png",
							"jpg",
							"jpeg",
							"webp"
						]
					},
					{
						name: "3D Models",
						extensions: ["glb", "gltf"]
					},
					{
						name: "Images",
						extensions: [
							"png",
							"jpg",
							"jpeg",
							"webp"
						]
					}
				]
			});
			if (!e && t.length > 0) {
				let e = await Promise.all(t.map(async (e) => ({
					name: a.basename(e),
					buffer: (await s.readFile(e)).buffer
				})));
				l.webContents.send("import-files", e);
			}
		}
	})), t.setApplicationMenu(e));
}
r.whenReady().then(() => {
	u(), d();
}), r.on("window-all-closed", () => {
	process.platform !== "darwin" && (r.quit(), l = null);
}), r.on("activate", () => {
	e.getAllWindows().length === 0 && u();
});
//#endregion
export {};
