import { readConfig } from './config'
import { EMBEDDED_TMDB_API_KEY } from './embedded-key'
import type { MediaType, SearchResult, Provider, Providers } from './shared-types'

export type { MediaType, SearchResult, Provider, Providers } from './shared-types'

const TMDB_BASE = 'https://api.themoviedb.org/3'

// Idioma de respuesta que le pedimos a TMDB (formato "xx-XX") segun la
// region elegida por el usuario. Vive ac y no en src/data/regions.ts porque
// electron/ y src/ se compilan por separado (ver CONTEXTO.md) — no importa
// que la lista de paises no sea identica, esto es solo un fallback
// razonable para regiones sin mapeo (ej. una cargada a mano en Ajustes).
const LANGUAGE_BY_REGION: Record<string, string> = {
  AR: 'es-AR',
  MX: 'es-MX',
  BR: 'pt-BR',
  CL: 'es-CL',
  CO: 'es-CO',
  PE: 'es-PE',
  UY: 'es-UY',
  PY: 'es-PY',
  BO: 'es-BO',
  EC: 'es-EC',
  VE: 'es-VE',
  ES: 'es-ES',
  US: 'en-US',
}

function languageForRegion(region: string): string {
  return LANGUAGE_BY_REGION[region.toUpperCase()] ?? 'es-419'
}

// Errores identificados por `message` (no por una subclase / campo custom):
// lo que cruza el puente de ipcRenderer.invoke() de vuelta al renderer es
// solo el mensaje del Error, asi que el codigo va ahi para poder
// distinguirlo del lado de React (ver src/api.ts).
//
// Decision del usuario (2026-09-14): solo se usa la key embebida
// (embedded-key.ts) -- se saco de Ajustes la opcion de cargar una propia
// a proposito, para que la busqueda dependa siempre de la cuenta de TMDB
// que genera StreamHub y no de la que cualquiera pise a mano en
// config.json. `Config.tmdbApiKey` sigue existiendo en el tipo por
// compatibilidad con instalaciones viejas, pero ya no se lee aca.
function requireApiKey(): { apiKey: string; region: string } {
  const { region } = readConfig()
  if (!EMBEDDED_TMDB_API_KEY) {
    throw new Error('MISSING_API_KEY')
  }
  return { apiKey: EMBEDDED_TMDB_API_KEY, region }
}

export async function searchTitles(query: string): Promise<SearchResult[]> {
  const { apiKey, region } = requireApiKey()
  const url =
    `${TMDB_BASE}/search/multi?api_key=${encodeURIComponent(apiKey)}` +
    `&query=${encodeURIComponent(query)}&language=${languageForRegion(region)}` +
    `&region=${region.toUpperCase()}&include_adult=false`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`TMDB_HTTP_ERROR_${res.status}`)
  }
  const data = (await res.json()) as { results: Record<string, unknown>[] }

  return data.results
    .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 12)
    .map((r) => ({
      id: r.id as number,
      mediaType: r.media_type as MediaType,
      title: (r.title as string) ?? (r.name as string) ?? '',
      year: ((r.release_date as string) ?? (r.first_air_date as string) ?? '').slice(0, 4),
      posterPath: (r.poster_path as string) ?? null,
      overview: (r.overview as string) ?? '',
    }))
}

export async function getProviders(id: number, mediaType: MediaType): Promise<Providers> {
  const { apiKey, region } = requireApiKey()
  const url = `${TMDB_BASE}/${mediaType}/${id}/watch/providers?api_key=${encodeURIComponent(apiKey)}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`TMDB_HTTP_ERROR_${res.status}`)
  }
  const data = (await res.json()) as { results?: Record<string, Record<string, unknown>> }
  const regionData = data.results?.[region.toUpperCase()]
  if (!regionData) {
    return { flatrate: [], rent: [], buy: [], link: null }
  }

  const mapProviders = (arr?: unknown[]): Provider[] =>
    (arr ?? []).map((p) => {
      const provider = p as Record<string, unknown>
      return {
        id: provider.provider_id as number,
        name: provider.provider_name as string,
        logoPath: (provider.logo_path as string) ?? null,
      }
    })

  return {
    flatrate: mapProviders(regionData.flatrate as unknown[] | undefined),
    rent: mapProviders(regionData.rent as unknown[] | undefined),
    buy: mapProviders(regionData.buy as unknown[] | undefined),
    link: (regionData.link as string) ?? null,
  }
}
