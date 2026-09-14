export interface Platform {
  id: string
  name: string
  url: string
  color: string
  // Para matchear el nombre de provider que devuelve TMDB (ej. "Amazon
  // Prime Video") contra esta plataforma y poder linkear directo en vez de
  // mandar siempre a la pagina generica de JustWatch.
  matchKeywords: string[]
  // Si la plataforma tiene una URL de busqueda predecible, la usamos para
  // llevar al usuario directo al resultado de ese titulo (en vez de a la
  // home, que obligaria a buscar de nuevo ahi adentro). Ninguna plataforma
  // expone un link publico que abra "play" de un titulo puntual sin un
  // acuerdo privado de partnership — esto es lo mas cerca que se puede
  // llegar sin eso.
  searchUrl?: (title: string) => string
}

// Set inicial pensado para Argentina, pero funcional en cualquier region de
// REGIONS (src/data/regions.ts). Lista fija en el codigo -- se suma una
// plataforma nueva aca cuando hay demanda real de ella (ver CONTEXTO.md),
// no hay forma de que el usuario agregue una propia desde la UI.
export const DEFAULT_PLATFORMS: Platform[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    url: 'https://www.netflix.com',
    color: '#E50914',
    matchKeywords: ['netflix'],
    searchUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: 'max',
    name: 'Max',
    url: 'https://play.max.com',
    color: '#002BE7',
    matchKeywords: ['max', 'hbo'],
    searchUrl: (title) => `https://play.max.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: 'prime-video',
    name: 'Prime Video',
    url: 'https://www.primevideo.com',
    color: '#00A8E1',
    matchKeywords: ['prime video', 'amazon'],
    searchUrl: (title) =>
      `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(title)}`,
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    url: 'https://www.disneyplus.com',
    color: '#113CCF',
    matchKeywords: ['disney'],
    // Disney+ saco su ruta publica de busqueda (2026-09-14: /search?q= y
    // /search a secas devuelven 404 real, verificado con fetch y en el
    // navegador) -> cae a la home, igual que Movistar Play y Flow.
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+',
    url: 'https://www.paramountplus.com',
    color: '#0064FF',
    matchKeywords: ['paramount'],
    searchUrl: (title) => `https://www.paramountplus.com/search?q=${encodeURIComponent(title)}`,
  },
  {
    id: 'apple-tv',
    name: 'Apple TV+',
    url: 'https://tv.apple.com',
    color: '#000000',
    matchKeywords: ['apple tv'],
    searchUrl: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com',
    color: '#FF0000',
    matchKeywords: ['youtube'],
    searchUrl: (title) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`,
  },
  {
    id: 'movistar-play',
    name: 'Movistar Play',
    url: 'https://www.movistarplay.com.ar',
    color: '#019DF4',
    matchKeywords: ['movistar'],
    // Sin patron de busqueda confiable conocido -> cae a la home.
  },
  {
    id: 'flow',
    name: 'Flow',
    url: 'https://www.flow.com.ar',
    color: '#6E2C8C',
    matchKeywords: ['flow'],
    // Sin patron de busqueda confiable conocido -> cae a la home.
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    url: 'https://www.crunchyroll.com',
    color: '#F47521',
    matchKeywords: ['crunchyroll'],
    searchUrl: (title) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`,
  },
]

// Busca, entre los defaults + los custom del usuario, una plataforma cuyo
// nombre haga match con el nombre de provider que devolvio TMDB, y arma la
// URL de busqueda de ese titulo ahi adentro (o la home si no hay patron
// de busqueda conocido para esa plataforma).
export function findPlatformByProviderName(
  providerName: string,
  title: string,
  customApps: { id: string; name: string; url: string }[],
): { url: string } | null {
  const lower = providerName.toLowerCase()

  const builtIn = DEFAULT_PLATFORMS.find((p) => p.matchKeywords.some((k) => lower.includes(k)))
  if (builtIn) return { url: builtIn.searchUrl ? builtIn.searchUrl(title) : builtIn.url }

  const custom = customApps.find((a) => lower.includes(a.name.toLowerCase()))
  if (custom) return { url: custom.url }

  return null
}
