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

  const isRecording = status === 'recording'

  useEffect(() => {
    const unsub = window.api.onRecordingEvent(() => {
      setEventCount((c) => c + 1)
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = window.api.onRecordingStatus((raw) => {
      const state = raw as RecordingState
      if (state.isRecording) {
        useAppStore.getState().setStatus('recording')
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (isRecording) {
      setEventCount(0)
      setElapsedMs(0)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current)
      }, 50)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording])

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

  return {
    isRecording,
    eventCount,
    elapsedMs,
    lastMacro,
    startRecording,
    stopRecording
  }
}
