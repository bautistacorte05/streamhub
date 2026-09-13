import { findPlatformByProviderName } from '../data/platforms'
import type { CustomApp, Provider } from '../types'

interface Props {
  title: string
  providers: Provider[]
  fallbackLink: string | null
  myApps: CustomApp[]
  onOpen: (url: string) => void
}

const TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/w92'

export default function ProviderBadges({ title, providers, fallbackLink, myApps, onOpen }: Props) {
  if (providers.length === 0) {
    return (
      <p className="providers-empty">
        No encontramos "{title}" en streaming por suscripcion en Argentina ahora mismo
        {fallbackLink ? (
          <>
            {' '}
            —{' '}
            <button className="link-button" onClick={() => onOpen(fallbackLink)}>
              ver mas detalle
            </button>
          </>
        ) : null}
        .
      </p>
    )
  }

  return (
    <div className="provider-badges">
      {providers.map((provider) => {
        const match = findPlatformByProviderName(provider.name, title, myApps)
        const targetUrl = match?.url ?? fallbackLink
        return (
          <button
            key={provider.id}
            className="provider-badge"
            disabled={!targetUrl}
            onClick={() => targetUrl && onOpen(targetUrl)}
            title={match ? `Abrir ${provider.name}` : `Ver "${provider.name}" en JustWatch`}
          >
            {provider.logoPath ? (
              <img src={`${TMDB_LOGO_BASE}${provider.logoPath}`} alt={provider.name} />
            ) : null}
            <span>{provider.name}</span>
          </button>
        )
      })}
    </div>
  )
}
