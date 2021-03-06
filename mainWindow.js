const { BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path')
const url = require('url')
const fs = require('fs')
const windowStateKeeper = require('electron-window-state');

const APP_ARGS_FILE_PATH = path.join(__dirname, 'electron-owa.json');
const appArgs = JSON.parse(fs.readFileSync(APP_ARGS_FILE_PATH, 'utf8'));

const preloadScript = path.join(__dirname, 'inject', 'index.js');

function createMainWindow(onClose) {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800,
  });

  mainWindow = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    autoHideMenuBar: true,
    title: 'Outlook Web App',
    webPreferences: {
      javascript: true,
      plugins: false,
      nodeIntegration: false,
      preload: preloadScript,
    },
    // after webpack path here should reference `resources/app/`
    icon: path.join(__dirname, '/icon.ico')
  });
  
  mainWindowState.manage(mainWindow);

  mainWindow.webContents.on('new-window', (event, urlToGo) => {
    event.preventDefault()
    if (linkIsInternal(appArgs.serverUrl, urlToGo)) {
      const win = new BrowserWindow({
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
          preload: preloadScript,
        },
        icon: path.join(__dirname, '/icon.ico')
      })
      win.once('ready-to-show', () => win.show())
      win.loadURL(urlToGo)
      event.newGuest = win
    } else {
      shell.openExternal(urlToGo);
    }
  });

  mainWindow.loadURL(appArgs.serverUrl)

  // Emitted when the window is closed.
  mainWindow.on('closed', onClose)
}

function linkIsInternal(currentUrl, newUrl) {
  const currentDomain = url.parse(currentUrl).hostname;
  const newDomain = url.parse(newUrl).hostname;
  return currentDomain === newDomain;
}

module.exports = createMainWindow;
