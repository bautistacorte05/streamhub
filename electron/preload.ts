import { contextBridge, ipcRenderer } from 'electron'
import type { Config } from './config'
import type { MediaType } from './tmdb'

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
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
