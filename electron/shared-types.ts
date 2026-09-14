// Tipos puros (sin dependencias de 'electron' ni de Node) compartidos entre
// el proceso principal (electron/*.ts, compilado con tsc a CommonJS) y el
// renderer (src/*.tsx, compilado por Vite) -- ver "Arquitectura" en
// CONTEXTO.md sobre por que ambos lados se compilan por separado. Como acá
// solo hay `interface`/`type` (cero runtime), un `import type` desde
// cualquiera de los dos lados se borra por completo al compilar y no
// rompe esa separación: es la unica fuente de verdad para la forma de
// estos datos, en vez de mantener dos copias a mano.
//
// Si algo necesita codigo de verdad (no solo tipos), NO va aca -- va en
// electron/config.ts, electron/tmdb.ts, etc., como hasta ahora.

export interface CustomApp {
  id: string
  name: string
  url: string
}

export interface Config {
  tmdbApiKey: string
  region: string
  myApps: CustomApp[]
  // Ids de DEFAULT_PLATFORMS (src/data/platforms.ts) que el usuario no
  // tiene y no quiere ver en "Mis apps". Vacio = se muestran todas (asi
  // instalaciones viejas, sin este campo, no pierden ninguna).
  disabledPlatformIds: string[]
  // Si ya completo (o salteo) el wizard de bienvenida. Ver migracion en
  // electron/config.ts readConfig() para instalaciones previas a que
  // existiera el wizard.
  onboardingComplete: boolean
}

export type MediaType = 'movie' | 'tv'

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

export type UpdateStatus =
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }
