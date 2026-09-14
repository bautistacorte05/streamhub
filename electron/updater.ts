import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'

// Auto-update via electron-updater, apuntando al feed de GitHub Releases
// (ver "publish" en package.json). Descarga en segundo plano apenas hay
// una version nueva publicada y la deja lista; se instala recien cuando
// el usuario decide reiniciar (aviso en la UI, ver UpdateBanner.tsx) o
// cuando cierra la app (autoInstallOnAppQuit). Nunca interrumpe de golpe
// mientras la esta usando.
//
// Requiere que cada release en GitHub incluya, ademas del instalador
// (.exe) y su .blockmap, el latest.yml que genera electron-builder --
// por eso publicar se hace con `npm run release` (electron-builder
// --publish always), no subiendo el .exe a mano.
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

export type UpdateStatus =
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

export function initUpdater(win: BrowserWindow) {
  const send = (status: UpdateStatus) => {
    if (!win.isDestroyed()) win.webContents.send('updater:status', status)
  }

  autoUpdater.on('checking-for-update', () => send({ state: 'checking' }))
  autoUpdater.on('update-available', (info) => send({ state: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => send({ state: 'not-available' }))
  autoUpdater.on('update-downloaded', (info) => send({ state: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) => send({ state: 'error', message: err.message }))

  // Un chequeo al arrancar (con margen para no competir con el startup)
  // y despues cada 4hs mientras la app siga abierta.
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5_000)
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000)
}

export function installUpdateNow() {
  autoUpdater.quitAndInstall()
}

export function checkForUpdatesNow() {
  return autoUpdater.checkForUpdates().catch(() => {})
}
