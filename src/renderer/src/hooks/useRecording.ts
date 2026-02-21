import { useState, useEffect, useCallback, useRef } from 'react'
import type { RecordingState, Macro } from '@shared/types'
import { useAppStore } from '../stores/appStore'
import { useMacroStore } from '../stores/macroStore'

export function useRecording() {
  const status = useAppStore((s) => s.status)
  const recordingStartedAt = useAppStore((s) => s.recordingStartedAt)
  const recordingAccumulatedPause = useAppStore((s) => s.recordingAccumulatedPause)
  const recordingPausedAt = useAppStore((s) => s.recordingPausedAt)
  const { loadMacros } = useMacroStore()
  const [eventCount, setEventCount] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [lastMacro, setLastMacro] = useState<Macro | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isRecording = status === 'recording' || status === 'recording_paused'
  const isPaused = status === 'recording_paused'

  useEffect(() => {
    const unsub = window.api.onRecordingEvent(() => {
      setEventCount((c) => c + 1)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = window.api.onRecordingStatus((raw) => {
      const state = raw as RecordingState
      if (state.isRecording && !state.isPaused) {
        useAppStore.getState().setStatus('recording')
      } else if (state.isRecording && state.isPaused) {
        useAppStore.getState().setStatus('recording_paused')
      }
    })
    return unsub
  }, [])

  // Timer management — uses appStore values (survive navigation)
  useEffect(() => {
    if (status === 'recording') {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        const { recordingStartedAt: start, recordingAccumulatedPause: pause } = useAppStore.getState()
        if (start > 0) {
          setElapsedMs(Date.now() - start - pause)
        }
      }, 50)
    } else if (status === 'recording_paused') {
      // Freeze the timer — compute frozen value from store
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

  const startRecording = useCallback(async () => {
    setEventCount(0)
    setElapsedMs(0)
    useAppStore.getState().startRecordingTimer()
    await window.api.startRecording()
  }, [])

  const stopRecording = useCallback(async () => {
    const result = (await window.api.stopRecording()) as {
      success: boolean
      macro?: Macro
    }
    useAppStore.getState().resetRecordingTimer()
    if (result.success && result.macro) {
      setLastMacro(result.macro)
      await loadMacros()
    }
  }, [loadMacros])

  const pauseRecording = useCallback(async () => {
    useAppStore.getState().pauseRecordingTimer()
    await window.api.pauseRecording()
  }, [])

  const resumeRecording = useCallback(async () => {
    useAppStore.getState().resumeRecordingTimer()
    await window.api.resumeRecording()
  }, [])

  return {
    isRecording,
    isPaused,
    eventCount,
    elapsedMs,
    lastMacro,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  }
}
