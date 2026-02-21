import { useState, useEffect, useCallback, useRef } from 'react'
import type { RecordingState, Macro } from '@shared/types'
import { useAppStore } from '../stores/appStore'
import { useMacroStore } from '../stores/macroStore'

export function useRecording() {
  const status = useAppStore((s) => s.status)
  const recordingStartedAt = useAppStore((s) => s.recordingStartedAt)
  const recordingAccumulatedPause = useAppStore((s) => s.recordingAccumulatedPause)
  const recordingPausedAt = useAppStore((s) => s.recordingPausedAt)
  const recordingEventCount = useAppStore((s) => s.recordingEventCount)
  const { loadMacros } = useMacroStore()
  const [elapsedMs, setElapsedMs] = useState(0)
  const [lastMacro, setLastMacro] = useState<Macro | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isRecording = status === 'recording' || status === 'recording_paused'
  const isPaused = status === 'recording_paused'

  // Count recording events (persisted in appStore so it survives navigation)
  useEffect(() => {
    const unsub = window.api.onRecordingEvent(() => {
      useAppStore.getState().incrementEventCount()
    })
    return unsub
  }, [])

  // Sync event count AND timer from RECORDING_STATUS messages (authoritative from main process)
  useEffect(() => {
    const unsub = window.api.onRecordingStatus((raw) => {
      const state = raw as RecordingState
      const store = useAppStore.getState()
      store.setEventCount(state.eventCount)

      // Sync timer to the main process's authoritative elapsed time
      // This eliminates drift from independent Date.now() tracking across processes
      if (state.elapsedMs !== undefined && state.elapsedMs >= 0) {
        if (state.isPaused) {
          store.syncRecordingElapsed(state.elapsedMs, true)
        } else if (state.isRecording) {
          store.syncRecordingElapsed(state.elapsedMs, false)
        }
      }
    })
    return unsub
  }, [])

  // Timer display — reads from appStore values (survive navigation)
  // Timer state management is done in AppShell.tsx (always mounted) so hotkeys work too
  useEffect(() => {
    if (status === 'recording') {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        const { recordingStartedAt: start, recordingAccumulatedPause: pause } =
          useAppStore.getState()
        if (start > 0) {
          setElapsedMs(Date.now() - start - pause)
        }
      }, 50)
    } else if (status === 'recording_paused') {
      // Freeze the timer at the paused value
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (recordingStartedAt > 0 && recordingPausedAt > 0) {
        setElapsedMs(recordingPausedAt - recordingStartedAt - recordingAccumulatedPause)
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, recordingStartedAt, recordingPausedAt, recordingAccumulatedPause])

  // On mount while recording: immediately show the correct elapsed time
  useEffect(() => {
    if (status === 'recording' && recordingStartedAt > 0) {
      setElapsedMs(Date.now() - recordingStartedAt - recordingAccumulatedPause)
    } else if (status === 'recording_paused' && recordingStartedAt > 0 && recordingPausedAt > 0) {
      setElapsedMs(recordingPausedAt - recordingStartedAt - recordingAccumulatedPause)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startRecording = useCallback(async () => {
    await window.api.startRecording()
  }, [])

  const stopRecording = useCallback(async () => {
    const result = (await window.api.stopRecording()) as {
      success: boolean
      macro?: Macro
    }
    if (result.success && result.macro) {
      setLastMacro(result.macro)
      await loadMacros()
    }
  }, [loadMacros])

  const pauseRecording = useCallback(async () => {
    await window.api.pauseRecording()
  }, [])

  const resumeRecording = useCallback(async () => {
    await window.api.resumeRecording()
  }, [])

  return {
    isRecording,
    isPaused,
    eventCount: recordingEventCount,
    elapsedMs,
    lastMacro,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  }
}
