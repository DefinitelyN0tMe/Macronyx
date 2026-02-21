import { create } from 'zustand'
import type { MacroChain, ChainStep } from '@shared/types'
import { v4 as uuid } from 'uuid'

interface ChainState {
  chains: MacroChain[]
  selectedChainId: string | null
  isLoading: boolean

  loadChains: () => Promise<void>
  selectChain: (id: string | null) => void
  createChain: (name: string) => Promise<MacroChain>
  saveChain: (chain: MacroChain) => Promise<void>
  deleteChain: (id: string) => Promise<void>
  addStep: (chainId: string, macroId: string) => Promise<void>
  removeStep: (chainId: string, stepIndex: number) => Promise<void>
  updateStep: (chainId: string, stepIndex: number, changes: Partial<ChainStep>) => Promise<void>
  reorderSteps: (chainId: string, fromIndex: number, toIndex: number) => Promise<void>
}

export const useChainStore = create<ChainState>((set, get) => ({
  chains: [],
  selectedChainId: null,
  isLoading: false,

  loadChains: async () => {
    set({ isLoading: true })
    try {
      const chains = await window.api.listChains()
      set({ chains: chains || [], isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  selectChain: (id) => set({ selectedChainId: id }),

  createChain: async (name) => {
    const chain: MacroChain = {
      id: uuid(),
      name,
      description: '',
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await window.api.saveChain(chain)
    const { chains } = get()
    set({ chains: [chain, ...chains], selectedChainId: chain.id })
    return chain
  },

  saveChain: async (chain) => {
    const updated = { ...chain, updatedAt: new Date().toISOString() }
    await window.api.saveChain(updated)
    const { chains } = get()
    set({
      chains: chains.map((c) => (c.id === updated.id ? updated : c))
    })
  },

  deleteChain: async (id) => {
    await window.api.deleteChain(id)
    const { chains, selectedChainId } = get()
    set({
      chains: chains.filter((c) => c.id !== id),
      selectedChainId: selectedChainId === id ? null : selectedChainId
    })
  },

  addStep: async (chainId, macroId) => {
    const { chains } = get()
    const chain = chains.find((c) => c.id === chainId)
    if (!chain) return
    const updated = {
      ...chain,
      steps: [...chain.steps, { macroId, delayAfterMs: 500, enabled: true }],
      updatedAt: new Date().toISOString()
    }
    await window.api.saveChain(updated)
    set({ chains: chains.map((c) => (c.id === chainId ? updated : c)) })
  },

  removeStep: async (chainId, stepIndex) => {
    const { chains } = get()
    const chain = chains.find((c) => c.id === chainId)
    if (!chain) return
    const steps = chain.steps.filter((_, i) => i !== stepIndex)
    const updated = { ...chain, steps, updatedAt: new Date().toISOString() }
    await window.api.saveChain(updated)
    set({ chains: chains.map((c) => (c.id === chainId ? updated : c)) })
  },

  updateStep: async (chainId, stepIndex, changes) => {
    const { chains } = get()
    const chain = chains.find((c) => c.id === chainId)
    if (!chain) return
    const steps = chain.steps.map((s, i) => (i === stepIndex ? { ...s, ...changes } : s))
    const updated = { ...chain, steps, updatedAt: new Date().toISOString() }
    await window.api.saveChain(updated)
    set({ chains: chains.map((c) => (c.id === chainId ? updated : c)) })
  },

  reorderSteps: async (chainId, fromIndex, toIndex) => {
    const { chains } = get()
    const chain = chains.find((c) => c.id === chainId)
    if (!chain) return
    const steps = [...chain.steps]
    const [moved] = steps.splice(fromIndex, 1)
    steps.splice(toIndex, 0, moved)
    const updated = { ...chain, steps, updatedAt: new Date().toISOString() }
    await window.api.saveChain(updated)
    set({ chains: chains.map((c) => (c.id === chainId ? updated : c)) })
  }
}))
