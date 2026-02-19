import { useEffect } from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { DashboardView } from '../dashboard/DashboardView'
import { RecorderView } from '../recorder/RecorderView'
import { EditorView } from '../editor/EditorView'
import { LibraryView } from '../library/LibraryView'
import { SettingsView } from '../settings/SettingsView'
import { useAppStore } from '../../stores/appStore'
import { useMacroStore } from '../../stores/macroStore'
import { useSettingsStore } from '../../stores/settingsStore'

export function AppShell(): JSX.Element {
  const activeView = useAppStore((s) => s.activeView)
  const loadMacros = useMacroStore((s) => s.loadMacros)
  const loadSettings = useSettingsStore((s) => s.loadSettings)

  useEffect(() => {
    loadMacros()
    loadSettings()
  }, [loadMacros, loadSettings])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 20,
            background: 'var(--bg-primary)'
          }}
        >
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'recorder' && <RecorderView />}
          {activeView === 'editor' && <EditorView />}
          {activeView === 'library' && <LibraryView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
      <StatusBar />
    </div>
  )
}
