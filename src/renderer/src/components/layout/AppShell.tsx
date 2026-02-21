import { useState, useEffect, useCallback, useRef } from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { DonateModal } from '../common/DonateModal'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { DashboardView } from '../dashboard/DashboardView'
import { RecorderView } from '../recorder/RecorderView'
import { EditorView } from '../editor/EditorView'
import { LibraryView } from '../library/LibraryView'
import { SettingsView } from '../settings/SettingsView'
import { useAppStore } from '../../stores/appStore'
import { useEditorStore } from '../../stores/editorStore'
import { useMacroStore } from '../../stores/macroStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { AppStatus, Macro } from '@shared/types'

export function AppShell(): JSX.Element {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const loadMacros = useMacroStore((s) => s.loadMacros)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const [showDonate, setShowDonate] = useState(false)
  const [showDirtyDialog, setShowDirtyDialog] = useState(false)
  const pendingNavRef = useRef<string | null>(null)

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
          if (currentStatus === 'recording' || currentStatus === 'recording_paused') {
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
        case 'togglePause': {
          if (currentStatus === 'recording') {
            await window.api.pauseRecording()
          } else if (currentStatus === 'recording_paused') {
            await window.api.resumeRecording()
          } else if (currentStatus === 'playing') {
            await window.api.pausePlayback()
          } else if (currentStatus === 'paused') {
            await window.api.resumePlayback()
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

  // Navigation guard: intercept navigation away from editor when dirty
  const handleNavigate = useCallback(
    (viewId: string) => {
      if (
        activeView === 'editor' &&
        viewId !== 'editor' &&
        useEditorStore.getState().isDirty
      ) {
        pendingNavRef.current = viewId
        setShowDirtyDialog(true)
      } else {
        setActiveView(viewId)
      }
    },
    [activeView, setActiveView]
  )

  const handleSaveAndLeave = useCallback(async () => {
    await useEditorStore.getState().saveMacro()
    await loadMacros()
    setShowDirtyDialog(false)
    if (pendingNavRef.current) {
      setActiveView(pendingNavRef.current)
      pendingNavRef.current = null
    }
  }, [setActiveView, loadMacros])

  const handleDiscard = useCallback(() => {
    // Reload the macro to discard changes (reset isDirty)
    const macro = useEditorStore.getState().macro
    if (macro) {
      // Just clear isDirty — the editor will reload if needed
      useEditorStore.setState({ isDirty: false })
    }
    setShowDirtyDialog(false)
    if (pendingNavRef.current) {
      setActiveView(pendingNavRef.current)
      pendingNavRef.current = null
    }
  }, [setActiveView])

  const handleCancelNav = useCallback(() => {
    setShowDirtyDialog(false)
    pendingNavRef.current = null
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar onDonate={() => setShowDonate(true)} onNavigate={handleNavigate} />
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
      <ConfirmDialog
        isOpen={showDirtyDialog}
        title="Unsaved Changes"
        message="You have unsaved changes in the editor. What would you like to do?"
        confirmLabel="Save & Leave"
        altLabel="Discard"
        altColor="var(--danger)"
        cancelLabel="Cancel"
        onConfirm={handleSaveAndLeave}
        onAlt={handleDiscard}
        onCancel={handleCancelNav}
      />
    </div>
  )
}
