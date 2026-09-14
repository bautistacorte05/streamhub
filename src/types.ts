// Reexporta los tipos "de datos" desde electron/shared-types.ts -- una
// sola fuente de verdad para la forma de Config, SearchResult, etc. en vez
// de mantener dos copias a mano en electron/ y en src/ (ver el comentario
// al principio de shared-types.ts). Esto es seguro porque son puros tipos
// (cero runtime): un `import type` se borra por completo al compilar, asi
// que src/ sigue sin depender en los hechos de nada de electron/.
export type {
  CustomApp,
  Config,
  MediaType,
  UpdateStatus,
  SearchResult,
  Provider,
  Providers,
} from '../electron/shared-types'

import type {
  Config,
  MediaType,
  UpdateStatus,
  SearchResult,
  Providers,
} from '../electron/shared-types'

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
