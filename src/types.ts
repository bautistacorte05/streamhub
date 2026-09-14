export interface CustomApp {
  id: string
  name: string
  url: string
}

export interface Config {
  tmdbApiKey: string
  region: string
  myApps: CustomApp[]
  disabledPlatformIds: string[]
  onboardingComplete: boolean
}

export type MediaType = 'movie' | 'tv'

export type UpdateStatus =
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

export interface SearchResult {
  id: number
  mediaType: MediaType
  title: string
  year: string
  posterPath: string | null
  overview: string
}

export interface Provider {
  id: number
  name: string
  logoPath: string | null
}

export interface Providers {
  flatrate: Provider[]
  rent: Provider[]
  buy: Provider[]
  link: string | null
}

export interface Api {
  config: {
    get: () => Promise<Config>
    set: (data: Partial<Config>) => Promise<Config>
  }
  tmdb: {
    search: (query: string) => Promise<SearchResult[]>
    providers: (data: { id: number; mediaType: MediaType }) => Promise<Providers>
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
  updater: {
    onStatus: (cb: (status: UpdateStatus) => void) => () => void
    install: () => Promise<void>
    check: () => Promise<void>
  }
}

declare global {
  interface Window {
    api: Api
  }
}
