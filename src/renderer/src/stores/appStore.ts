import { create } from 'zustand'
import type { AppStatus } from '@shared/types'

interface AppState {
  status: AppStatus
  prevStatus: AppStatus
  activeView: string
  // Recording state (persists across navigation)
  recordingStartedAt: number
  recordingAccumulatedPause: number
  recordingPausedAt: number
  recordingEventCount: number
  setStatus: (status: AppStatus) => void
  setActiveView: (view: string) => void
  startRecordingTimer: () => void
  pauseRecordingTimer: () => void
  resumeRecordingTimer: () => void
  resetRecordingTimer: () => void
  incrementEventCount: () => void
  setEventCount: (count: number) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  status: 'idle',
  prevStatus: 'idle',
  activeView: 'dashboard',
  recordingStartedAt: 0,
  recordingAccumulatedPause: 0,
  recordingPausedAt: 0,
  recordingEventCount: 0,
  setStatus: (status) => set({ prevStatus: get().status, status }),
  setActiveView: (activeView) => set({ activeView }),
  startRecordingTimer: () =>
    set({
      recordingStartedAt: Date.now(),
      recordingAccumulatedPause: 0,
      recordingPausedAt: 0,
      recordingEventCount: 0
    }),
  pauseRecordingTimer: () => {
    if (get().recordingPausedAt === 0) {
      set({ recordingPausedAt: Date.now() })
    }
  },
  resumeRecordingTimer: () => {
    const { recordingPausedAt, recordingAccumulatedPause } = get()
    if (recordingPausedAt > 0) {
      set({
        recordingAccumulatedPause: recordingAccumulatedPause + (Date.now() - recordingPausedAt),
        recordingPausedAt: 0
      })
    }
  },
  resetRecordingTimer: () =>
    set({
      recordingStartedAt: 0,
      recordingAccumulatedPause: 0,
      recordingPausedAt: 0,
      recordingEventCount: 0
    }),
  incrementEventCount: () => set({ recordingEventCount: get().recordingEventCount + 1 }),
  setEventCount: (count) => set({ recordingEventCount: count })
}))
