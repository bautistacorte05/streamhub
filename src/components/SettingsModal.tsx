import { type FormEvent } from 'react'
import { DEFAULT_PLATFORMS } from '../data/platforms'
import { REGIONS } from '../data/regions'
import type { Config } from '../types'

interface Props {
  config: Config
  onClose: () => void
  onSaved: (config: Config) => void
}

export default function SettingsModal({ config, onClose, onSaved }: Props) {
  async function changeRegion(e: FormEvent<HTMLSelectElement>) {
    const updated = await window.api.config.set({ region: e.currentTarget.value })
    onSaved(updated)
  }

  async function togglePlatform(id: string) {
    const isDisabled = config.disabledPlatformIds.includes(id)
    const disabledPlatformIds = isDisabled
      ? config.disabledPlatformIds.filter((p) => p !== id)
      : [...config.disabledPlatformIds, id]
    const updated = await window.api.config.set({ disabledPlatformIds })
    onSaved(updated)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajustes</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <section className="modal-section">
          <h3>País / región</h3>
          <p className="modal-hint">
            Determina en qué región busca disponibilidad el buscador de TMDB.
          </p>
          <select className="onboarding-select" value={config.region} onChange={changeRegion}>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
            {REGIONS.some((r) => r.code === config.region) ? null : (
              <option value={config.region}>{config.region} (personalizado)</option>
            )}
          </select>
        </section>

        <section className="modal-section">
          <h3>Mis plataformas</h3>
          <p className="modal-hint">Tildá las que tenés — las demás no aparecen en "Mis apps".</p>
          <div className="platform-toggle-list">
            {DEFAULT_PLATFORMS.map((p) => (
              <label key={p.id} className="platform-toggle-item">
                <input
                  type="checkbox"
                  checked={!config.disabledPlatformIds.includes(p.id)}
                  onChange={() => togglePlatform(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </section>

        <p className="tmdb-attribution">
          Esta app usa la API de{' '}
          <button
            className="link-button"
            onClick={() => window.api.shell.openExternal('https://www.themoviedb.org/')}
          >
            TMDB
          </button>{' '}
          pero no está avalada ni certificada por TMDB.
        </p>
      </div>
    </div>
  )
}
