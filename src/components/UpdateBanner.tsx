import { useEffect, useState } from 'react'
import type { UpdateStatus } from '../types'

// Aviso discreto que aparece solo cuando ya hay una actualizacion
// descargada y lista (autoUpdater la baja solo en segundo plano, ver
// electron/updater.ts) -- nunca interrumpe mientras se esta usando la
// app, el usuario elige cuando reiniciar.
export default function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => window.api.updater.onStatus(setStatus), [])

  if (!status || status.state !== 'downloaded') return null

  return (
    <div className="update-banner">
      <span>
        Hay una actualización lista (v{status.version}) — reiniciá para instalarla.
      </span>
      <button
        className="primary-button"
        disabled={installing}
        onClick={() => {
          setInstalling(true)
          window.api.updater.install()
        }}
      >
        {installing ? 'Reiniciando…' : 'Reiniciar ahora'}
      </button>
    </div>
  )
}
