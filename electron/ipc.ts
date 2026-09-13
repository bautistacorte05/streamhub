import { ipcMain, shell } from 'electron'
import { readConfig, writeConfig, type Config } from './config'
import { searchTitles, getProviders, type MediaType } from './tmdb'

ipcMain.handle('config:get', () => readConfig())
ipcMain.handle('config:set', (_e, partial: Partial<Config>) => writeConfig(partial))

ipcMain.handle('tmdb:search', (_e, query: string) => searchTitles(query))
ipcMain.handle('tmdb:providers', (_e, data: { id: number; mediaType: MediaType }) =>
  getProviders(data.id, data.mediaType),
)

ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url))
