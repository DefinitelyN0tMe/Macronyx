import { create } from 'zustand'
import type { AppStatus } from '@shared/types'

interface AppState {
  status: AppStatus
  activeView: string
  setStatus: (status: AppStatus) => void
  setActiveView: (view: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  status: 'idle',
  activeView: 'dashboard',
  setStatus: (status) => set({ status }),
  setActiveView: (activeView) => set({ activeView })
}))
