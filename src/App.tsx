import { useEffect, useState } from 'react'
import OnboardingWizard from './components/OnboardingWizard'
import PlatformGrid from './components/PlatformGrid'
import SearchView from './components/SearchView'
import SettingsModal from './components/SettingsModal'
import UpdateBanner from './components/UpdateBanner'
import type { Config } from './types'

type Tab = 'folder' | 'search'

export default function App() {
  const [tab, setTab] = useState<Tab>('folder')
  const [config, setConfig] = useState<Config | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    window.api.config.get().then(setConfig)
  }, [])

  function openExternal(url: string) {
    window.api.shell.openExternal(url)
  }

  if (!config) {
    return (
      <div className="app-loading">
        <p>Cargando...</p>
      </div>
    )
  }

  if (!config.onboardingComplete) {
    return <OnboardingWizard config={config} onComplete={setConfig} />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>StreamHub</h1>
        <nav className="tabs">
          <button
            className={`tab ${tab === 'folder' ? 'tab-active' : ''}`}
            onClick={() => setTab('folder')}
          >
            Mis apps
          </button>
          <button
            className={`tab ${tab === 'search' ? 'tab-active' : ''}`}
            onClick={() => setTab('search')}
          >
            Buscar
          </button>
        </nav>
        <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Ajustes">
          ⚙
        </button>
      </header>

      <main className="app-main">
        {tab === 'folder' ? (
          <PlatformGrid
            myApps={config.myApps}
            disabledPlatformIds={config.disabledPlatformIds}
            onOpen={openExternal}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <SearchView myApps={config.myApps} onOpen={openExternal} />
        )}
      </main>

      {settingsOpen ? (
        <SettingsModal
          config={config}
          onClose={() => setSettingsOpen(false)}
          onSaved={setConfig}
        />
      ) : null}

      <UpdateBanner />
    </div>
  )
}
