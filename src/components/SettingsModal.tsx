import { useState, type FormEvent } from 'react'
import { DEFAULT_PLATFORMS } from '../data/platforms'
import { REGIONS } from '../data/regions'
import type { Config } from '../types'

interface Props {
  config: Config
  onClose: () => void
  onSaved: (config: Config) => void
}

export default function SettingsModal({ config, onClose, onSaved }: Props) {
  const [apiKey, setApiKey] = useState(config.tmdbApiKey)
  const [newAppName, setNewAppName] = useState('')
  const [newAppUrl, setNewAppUrl] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveApiKey(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await window.api.config.set({ tmdbApiKey: apiKey.trim() })
      onSaved(updated)
    } finally {
      setSaving(false)
    }
  }

  async function addCustomApp(e: FormEvent) {
    e.preventDefault()
    if (!newAppName.trim() || !newAppUrl.trim()) return
    const url = /^https?:\/\//.test(newAppUrl.trim()) ? newAppUrl.trim() : `https://${newAppUrl.trim()}`
    const entry = { id: crypto.randomUUID(), name: newAppName.trim(), url }
    const updated = await window.api.config.set({ myApps: [...config.myApps, entry] })
    onSaved(updated)
    setNewAppName('')
    setNewAppUrl('')
  }

  async function removeCustomApp(id: string) {
    const updated = await window.api.config.set({
      myApps: config.myApps.filter((a) => a.id !== id),
    })
    onSaved(updated)
  }

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

        <section className="modal-section">
          <h3>API key de TMDB (opcional)</h3>
          <p className="modal-hint">
            El buscador ya funciona de una, no hace falta configurar nada acá. Esto es solo por
            si en algún momento preferís usar tu propia cuenta de TMDB en vez de la que trae
            StreamHub — es gratis, te registrás en{' '}
            <button
              className="link-button"
              onClick={() => window.api.shell.openExternal('https://www.themoviedb.org/settings/api')}
            >
              themoviedb.org/settings/api
            </button>{' '}
            y pegás acá tu "API Key (v3 auth)". Dejando el campo vacío y guardando, volvés a usar
            la de StreamHub.
          </p>
          <form className="settings-form" onSubmit={saveApiKey}>
            <input
              type="password"
              placeholder="API key de TMDB (dejar vacío = usar la de StreamHub)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button type="submit" className="primary-button" disabled={saving}>
              Guardar
            </button>
          </form>
        </section>

        <section className="modal-section">
          <h3>Agregar otra app o web</h3>
          <p className="modal-hint">
            Para sumar a la carpeta algo que no esta en la lista por defecto (Netflix, Max, Prime
            Video, Disney+, Paramount+, Apple TV+, YouTube, Movistar Play, Flow, Crunchyroll).
          </p>
          <form className="settings-form settings-form-add" onSubmit={addCustomApp}>
            <input
              type="text"
              placeholder="Nombre (ej. Plex)"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
            />
            <input
              type="text"
              placeholder="URL (ej. plex.tv)"
              value={newAppUrl}
              onChange={(e) => setNewAppUrl(e.target.value)}
            />
            <button type="submit" className="primary-button">
              Agregar
            </button>
          </form>

          {config.myApps.length > 0 ? (
            <ul className="custom-app-list">
              {config.myApps.map((a) => (
                <li key={a.id}>
                  <span>{a.name}</span>
                  <button className="link-button" onClick={() => removeCustomApp(a.id)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
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
