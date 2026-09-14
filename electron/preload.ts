import { contextBridge, ipcRenderer } from 'electron'
import type { Config } from './config'
import type { MediaType } from './tmdb'
import type { UpdateStatus } from './updater'

const api = {
  config: {
    get: (): Promise<Config> => ipcRenderer.invoke('config:get'),
    set: (data: Partial<Config>): Promise<Config> => ipcRenderer.invoke('config:set', data),
  },
  tmdb: {
    search: (query: string) => ipcRenderer.invoke('tmdb:search', query),
    providers: (data: { id: number; mediaType: MediaType }) =>
      ipcRenderer.invoke('tmdb:providers', data),
  },
  shell: {
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),
  },
  updater: {
    // Push desde el proceso principal (autoUpdater tira eventos por su
    // cuenta, no a pedido) — devuelve una funcion para dejar de escuchar.
    onStatus: (cb: (status: UpdateStatus) => void) => {
      const listener = (_e: unknown, status: UpdateStatus) => cb(status)
      ipcRenderer.on('updater:status', listener)
      return () => ipcRenderer.removeListener('updater:status', listener)
    },
    install: (): Promise<void> => ipcRenderer.invoke('updater:install'),
    check: (): Promise<void> => ipcRenderer.invoke('updater:check'),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
