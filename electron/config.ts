import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import type { Config } from './shared-types'

export type { CustomApp, Config } from './shared-types'

const DEFAULT_CONFIG: Config = {
  tmdbApiKey: '',
  region: 'AR',
  myApps: [],
  disabledPlatformIds: [],
  onboardingComplete: false,
}

function configPath(): string {
  // Vive en %APPDATA%\streamhub\config.json, no en la carpeta del proyecto
  // (mismo criterio que gastos-mensuales con su .db: sobrevive a reinstalar
  // o clonar el codigo de nuevo).
  return path.join(app.getPath('userData'), 'config.json')
}

export function readConfig(): Config {
  try {
    const raw = fs.readFileSync(configPath(), 'utf-8')
    const parsed = JSON.parse(raw)
    const merged = { ...DEFAULT_CONFIG, ...parsed }
    // Migracion: instalaciones de antes de que existiera el wizard de
    // bienvenida ya tienen API key o apps cargadas -> no mostrarselo, lo
    // tratamos como ya completado. Instalaciones nuevas de verdad (config.json
    // recien creado) no tienen ninguna de las dos, asi que si ven el wizard.
    if (parsed.onboardingComplete === undefined && (merged.tmdbApiKey || merged.myApps.length > 0)) {
      merged.onboardingComplete = true
    }
    return merged
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function writeConfig(partial: Partial<Config>): Config {
  const next = { ...readConfig(), ...partial }
  fs.mkdirSync(path.dirname(configPath()), { recursive: true })
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf-8')
  return next
}
