import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import './ipc'
import { initUpdater } from './updater'

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0b0d12',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Solo tiene sentido buscar actualizaciones en la app empaquetada e
  // instalada de verdad (electron-updater tira error si falta
  // app-update.yml, que solo existe en una instalacion real hecha con
  // electron-builder -- ni en dev ni corriendo `npm start` sin instalar).
  if (app.isPackaged) initUpdater(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
