import type { CSSProperties } from 'react'
import { DEFAULT_PLATFORMS } from '../data/platforms'
import type { CustomApp } from '../types'

interface Props {
  myApps: CustomApp[]
  disabledPlatformIds: string[]
  onOpen: (url: string) => void
  onOpenSettings: () => void
}

export default function PlatformGrid({ myApps, disabledPlatformIds, onOpen, onOpenSettings }: Props) {
  const platforms = DEFAULT_PLATFORMS.filter((p) => !disabledPlatformIds.includes(p.id))

  if (platforms.length === 0 && myApps.length === 0) {
    return (
      <div className="empty-state">
        <p>Todavía no elegiste ninguna app. Sumalas desde Ajustes cuando quieras.</p>
        <button className="primary-button" onClick={onOpenSettings}>
          Ir a Ajustes
        </button>
      </div>
    )
  }

  return (
    <div className="platform-grid">
      {platforms.map((p) => (
        <button
          key={p.id}
          className="platform-tile"
          style={{ '--tile-color': p.color } as CSSProperties}
          onClick={() => onOpen(p.url)}
        >
          <span className="platform-tile-name">{p.name}</span>
        </button>
      ))}
      {myApps.map((a) => (
        <button
          key={a.id}
          className="platform-tile platform-tile-custom"
          onClick={() => onOpen(a.url)}
        >
          <span className="platform-tile-name">{a.name}</span>
        </button>
      ))}
    </div>
  )
}
