import { useState, useEffect, useCallback } from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { DonateModal } from '../common/DonateModal'
import { DashboardView } from '../dashboard/DashboardView'
import { RecorderView } from '../recorder/RecorderView'
import { EditorView } from '../editor/EditorView'
import { LibraryView } from '../library/LibraryView'
import { SettingsView } from '../settings/SettingsView'
import { useAppStore } from '../../stores/appStore'
import { useMacroStore } from '../../stores/macroStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { AppStatus, Macro } from '@shared/types'

export function AppShell(): JSX.Element {
  const activeView = useAppStore((s) => s.activeView)
  const loadMacros = useMacroStore((s) => s.loadMacros)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const [showDonate, setShowDonate] = useState(false)

  useEffect(() => {
    loadMacros()
    loadSettings()
  }, [loadMacros, loadSettings])

  // Listen for app status changes from the main process
  useEffect(() => {
    const unsub = window.api.onAppStatus((raw) => {
      const newStatus = raw as AppStatus
      useAppStore.getState().setStatus(newStatus)
    })
    return unsub
  }, [])

  // Handle hotkey actions from main process
  const handleHotkeyAction = useCallback(
    async (action: string) => {
      const currentStatus = useAppStore.getState().status
      switch (action) {
        case 'recordStart': {
          if (currentStatus === 'idle') {
            await window.api.startRecording()
          }
          break
        }
        case 'recordStop': {
          if (currentStatus === 'recording') {
            const result = (await window.api.stopRecording()) as {
              success: boolean
              macro?: Macro
            }
            if (result.success) {
              await loadMacros()
            }
          }
          break
        }
        case 'playStart': {
          if (currentStatus === 'idle') {
            const macros = useMacroStore.getState().macros
            const selectedId = useMacroStore.getState().selectedMacroId
            const macroId = selectedId || (macros.length > 0 ? macros[0].id : null)
            if (macroId) {
              await window.api.startPlayback(macroId)
            }
          }
          break
        }
        case 'playStop': {
          if (currentStatus === 'playing' || currentStatus === 'paused') {
            await window.api.stopPlayback()
          }
          break
        }
      }
    },
    [loadMacros]
  )

  useEffect(() => {
    const unsub = window.api.onHotkeyAction(handleHotkeyAction)
    return unsub
  }, [handleHotkeyAction])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar onDonate={() => setShowDonate(true)} />
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
      <DonateModal isOpen={showDonate} onClose={() => setShowDonate(false)} />
    </div>
  )
}
