/*
import { app, BrowserWindow } from "electron";
import * as path from "path";

export class Main {
	mainWindow: Electron.BrowserWindow;
	browserWindow: typeof BrowserWindow;
	app: Electron.App;

	public main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		// we pass the Electron.App object and the  
		// Electron.BrowserWindow into this function 
		// so this class has no dependencies. This 
		// makes the code easier to write tests for 
		this.browserWindow = browserWindow;
		this.app = app;
		this.app.on('window-all-closed', this.onWindowAllClosed);
		this.app.on('ready', this.onReady);
	}

	createWindow() {
		// Create the browser window.
		this.mainWindow = new BrowserWindow({
			height: 600,
			width: 800,
		});

		// and load the index.html of the app.
		this.mainWindow.loadFile(path.join(__dirname, "../index.html"));

		// Open the DevTools.
		this.mainWindow.webContents.openDevTools();

		// Emitted when the window is closed.
		this.mainWindow.on("closed", () => {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			this.mainWindow = null;
		});
	}

	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	private onReady() {
		this.app.on("ready", this.createWindow);
	}

	// Quit when all windows are closed.
	onWindowAllClosed() {
		this.app.on("window-all-closed", () => {
			// On OS X it is common for applications and their menu bar
			// to stay active until the user quits explicitly with Cmd + Q
			if (process.platform !== "darwin") {
				app.quit();
			}
		});
	}

	// app.on("activate", () => {
	// 	// On OS X it"s common to re-create a window in the app when the
	// 	// dock icon is clicked and there are no other windows open.
	// 	if (mainWindow === null) {
	// 		createWindow();
	// 	}
	// });
}
// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
*/

import { BrowserWindow } from 'electron';
import * as path from "path";

export class Main {
	
	static mainWindow: Electron.BrowserWindow;
	static application: Electron.App;
	static BrowserWindow: any;
	private static onWindowAllClosed() {
		if (process.platform !== 'darwin') {
			Main.application.quit();
		}
	}

	private static onClose() {
		// Dereference the window object. 
		Main.mainWindow = null;
	}

	private static onReady() {
		Main.mainWindow = new Main.BrowserWindow({ width: 800, height: 600 });
		Main.mainWindow.loadFile(path.join(__dirname, "../index.html"));

		// Open the DevTools.
		Main.mainWindow.webContents.openDevTools();
		Main.mainWindow.on('closed', Main.onClose);
	}

	static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		// we pass the Electron.App object and the  
		// Electron.BrowserWindow into this function 
		// so this class has no dependencies. This 
		// makes the code easier to write tests for 
		Main.BrowserWindow = browserWindow;
		Main.application = app;
		Main.application.on('window-all-closed', Main.onWindowAllClosed);
		Main.application.on('ready', Main.onReady);
	}

}