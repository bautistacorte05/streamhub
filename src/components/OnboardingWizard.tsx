import { useState } from 'react'
import { DEFAULT_PLATFORMS } from '../data/platforms'
import { REGIONS } from '../data/regions'
import type { Config } from '../types'

interface Props {
  config: Config
  onComplete: (config: Config) => void
}

type Step = 'region' | 'platforms'

// Se muestra una sola vez, en instalaciones nuevas de verdad (ver migracion
// en electron/config.ts readConfig()). El objetivo es que alguien que nunca
// vio la app pueda dejarla lista en 2 pasos, sin tener que entender que es
// una API key ni crearse una cuenta en ningun lado — la busqueda de TMDB
// funciona de una con la key embebida (ver electron/embedded-key.ts) y es
// la unica que usa la app (ver electron/tmdb.ts).
export default function OnboardingWizard({ config, onComplete }: Props) {
  const [step, setStep] = useState<Step>('region')
  const [region, setRegion] = useState(config.region || 'AR')
  // Arranca con todo tildado (mismo comportamiento que tenia la app antes
  // del wizard) para no arriesgarse a una grilla vacia si alguien avanza
  // los pasos sin tocar nada.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(DEFAULT_PLATFORMS.map((p) => p.id)),
  )
  const [saving, setSaving] = useState(false)

  function togglePlatform(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function finish() {
    setSaving(true)
    try {
      const disabledPlatformIds = DEFAULT_PLATFORMS.filter((p) => !selected.has(p.id)).map(
        (p) => p.id,
      )
      const updated = await window.api.config.set({
        region: region.trim().toUpperCase(),
        disabledPlatformIds,
        onboardingComplete: true,
      })
      onComplete(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-steps">
          <span className={step === 'region' ? 'onboarding-step-active' : ''}>1. País</span>
          <span className={step === 'platforms' ? 'onboarding-step-active' : ''}>2. Tus apps</span>
        </div>

        {step === 'region' ? (
          <section>
            <h2>¡Bienvenido a StreamHub!</h2>
            <p className="modal-hint">
              Es tu carpeta única con accesos directos a tus plataformas de streaming, más un
              buscador de en qué plataforma está cada película o serie. Empecemos por tu país,
              para que el buscador muestre resultados de tu región.
            </p>
            <select
              className="onboarding-select"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="onboarding-actions">
              <button className="primary-button" onClick={() => setStep('platforms')}>
                Siguiente
              </button>
            </div>
          </section>
        ) : null}

        {step === 'platforms' ? (
          <section>
            <h2>¿Qué plataformas tenés?</h2>
            <p className="modal-hint">Destildá las que no uses. Podés cambiar esto después desde Ajustes.</p>
            <div className="onboarding-platform-grid">
              {DEFAULT_PLATFORMS.map((p) => (
                <label
                  key={p.id}
                  className={`onboarding-platform-option ${
                    selected.has(p.id) ? 'onboarding-platform-option-active' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => togglePlatform(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
            <div className="onboarding-actions">
              <button className="link-button" onClick={() => setStep('region')}>
                Atrás
              </button>
              <button className="primary-button" disabled={saving} onClick={finish}>
                Empezar
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
