import { useState, useEffect, useCallback, useRef } from 'react'
import type { RecordingState, Macro } from '@shared/types'
import { useAppStore } from '../stores/appStore'
import { useMacroStore } from '../stores/macroStore'

export function useRecording() {
  const status = useAppStore((s) => s.status)
  const { loadMacros } = useMacroStore()
  const [eventCount, setEventCount] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [lastMacro, setLastMacro] = useState<Macro | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const pausedAtRef = useRef(0)
  const accumulatedPauseRef = useRef(0)

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

  // Timer management based on status transitions
  useEffect(() => {
    if (status === 'recording') {
      if (pausedAtRef.current > 0) {
        // Resuming from pause
        accumulatedPauseRef.current += Date.now() - pausedAtRef.current
        pausedAtRef.current = 0
      } else if (startTimeRef.current === 0) {
        // Fresh recording start
        setEventCount(0)
        setElapsedMs(0)
        startTimeRef.current = Date.now()
        accumulatedPauseRef.current = 0
      }
      // Start/restart the display timer
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current - accumulatedPauseRef.current)
      }, 50)
    } else if (status === 'recording_paused') {
      // Freeze the timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (pausedAtRef.current === 0) {
        pausedAtRef.current = Date.now()
      }
    } else {
      // Idle or other — full cleanup
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      startTimeRef.current = 0
      pausedAtRef.current = 0
      accumulatedPauseRef.current = 0
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status])

  const startRecording = useCallback(async () => {
    setEventCount(0)
    setElapsedMs(0)
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
    eventCount,
    elapsedMs,
    lastMacro,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  }
}
