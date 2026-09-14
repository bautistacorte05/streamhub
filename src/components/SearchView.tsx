import { useState, type FormEvent } from 'react'
import type { CustomApp, Providers, SearchResult } from '../types'
import ProviderBadges from './ProviderBadges'

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w154'

interface Props {
  myApps: CustomApp[]
  onOpen: (url: string) => void
}

export default function SearchView({ myApps, onOpen }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [providers, setProviders] = useState<Providers | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setSelected(null)
    setProviders(null)
    try {
      const r = await window.api.tmdb.search(query.trim())
      setResults(r)
      if (r.length === 0) setError('No se encontro nada con ese nombre.')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function selectResult(result: SearchResult) {
    setSelected(result)
    setProviders(null)
    setLoading(true)
    setError(null)
    try {
      const p = await window.api.tmdb.providers({ id: result.id, mediaType: result.mediaType })
      setProviders(p)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="search-view">
      <form className="search-form" onSubmit={runSearch}>
        <input
          type="text"
          placeholder="Buscar una pelicula o serie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="primary-button" disabled={loading}>
          Buscar
        </button>
      </form>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="search-body">
        <ul className="search-results">
          {results.map((r) => (
            <li key={`${r.mediaType}-${r.id}`}>
              <button
                className={`search-result ${selected?.id === r.id ? 'search-result-active' : ''}`}
                onClick={() => selectResult(r)}
              >
                {r.posterPath ? (
                  <img src={`${TMDB_POSTER_BASE}${r.posterPath}`} alt={r.title} />
                ) : (
                  <div className="poster-placeholder" />
                )}
                <div>
                  <div className="search-result-title">{r.title}</div>
                  <div className="search-result-meta">
                    {r.year} · {r.mediaType === 'movie' ? 'Pelicula' : 'Serie'}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="providers-panel">
            <h3>{selected.title}</h3>
            {loading ? (
              <p className="providers-loading">Buscando donde verla...</p>
            ) : providers ? (
              <ProviderBadges
                title={selected.title}
                providers={providers.flatrate}
                fallbackLink={providers.link}
                myApps={myApps}
                onOpen={onOpen}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function errorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('MISSING_API_KEY')) return 'El buscador no esta disponible ahora mismo. Probá mas tarde.'
  if (msg.includes('TMDB_HTTP_ERROR_401')) return 'El buscador no esta disponible ahora mismo. Probá mas tarde.'
  if (msg.includes('TMDB_HTTP_ERROR')) return 'TMDB no respondio bien. Probá de nuevo en un momento.'
  return 'Algo fallo buscando. Revisa tu conexion a internet.'
}
