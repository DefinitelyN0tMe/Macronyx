import { useEffect, useState, useCallback } from 'react'
import { useChainStore } from '../../stores/chainStore'
import { useAppStore } from '../../stores/appStore'
import type { Macro } from '@shared/types'

export function ChainEditor(): JSX.Element {
  const chains = useChainStore((s) => s.chains)
  const selectedChainId = useChainStore((s) => s.selectedChainId)
  const loadChains = useChainStore((s) => s.loadChains)
  const selectChain = useChainStore((s) => s.selectChain)
  const createChain = useChainStore((s) => s.createChain)
  const deleteChain = useChainStore((s) => s.deleteChain)
  const addStep = useChainStore((s) => s.addStep)
  const removeStep = useChainStore((s) => s.removeStep)
  const updateStep = useChainStore((s) => s.updateStep)
  const saveChain = useChainStore((s) => s.saveChain)

  const appStatus = useAppStore((s) => s.status)

  const [macros, setMacros] = useState<Macro[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  const selectedChain = chains.find((c) => c.id === selectedChainId) || null

  useEffect(() => {
    loadChains()
    window.api.listMacros().then((list: Macro[]) => setMacros(list || []))
  }, [loadChains])

  // Sync local isPlaying with global app status
  useEffect(() => {
    if (appStatus === 'idle' && isPlaying) {
      setIsPlaying(false)
    }
  }, [appStatus, isPlaying])

  const handlePlay = useCallback(async (): Promise<void> => {
    // Read fresh state to avoid stale closures
    const { chains: currentChains, selectedChainId: currentId } = useChainStore.getState()
    const chain = currentChains.find((c) => c.id === currentId)
    if (!chain || chain.steps.length === 0) return
    setIsPlaying(true)
    try {
      await window.api.playChain(chain.id)
    } catch {
      // Error handled
    }
    setIsPlaying(false)
  }, [])

  const handleStop = useCallback((): void => {
    window.api.stopChain()
    setIsPlaying(false)
  }, [])

  // Listen for global hotkeys (play/stop) while on the Chains page
  useEffect(() => {
    const cleanup = window.api.onHotkeyAction((action: string) => {
      if (action === 'playStart') {
        handlePlay()
      } else if (action === 'playStop') {
        handleStop()
      }
    })
    return cleanup
  }, [handlePlay, handleStop])

  const handleCreate = async (): Promise<void> => {
    await createChain(`Chain ${chains.length + 1}`)
  }

  const getMacroName = (macroId: string): string => {
    const macro = macros.find((m) => m.id === macroId)
    return macro ? macro.name : 'Unknown Macro'
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%', padding: 16 }}>
      {/* Chain list sidebar */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>Chains</h3>
          <button
            onClick={handleCreate}
            style={{
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              background: 'var(--accent-cyan)',
              color: '#000',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + New
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => selectChain(chain.id)}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                background:
                  selectedChainId === chain.id
                    ? 'rgba(6, 182, 212, 0.15)'
                    : 'var(--bg-secondary)',
                color:
                  selectedChainId === chain.id ? 'var(--accent-cyan)' : 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontWeight: 500 }}>{chain.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                {chain.steps.length} step{chain.steps.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
          {chains.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', padding: 20 }}>
              No chains yet. Create one to chain macros together.
            </div>
          )}
        </div>
      </div>

      {/* Chain editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {selectedChain ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                value={selectedChain.name}
                onChange={(e) =>
                  saveChain({ ...selectedChain, name: e.target.value })
                }
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontSize: 16,
                  fontWeight: 600
                }}
              />
              {!isPlaying ? (
                <button
                  onClick={handlePlay}
                  disabled={selectedChain.steps.length === 0}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    background:
                      selectedChain.steps.length > 0
                        ? 'var(--accent-cyan)'
                        : 'var(--bg-secondary)',
                    color: selectedChain.steps.length > 0 ? '#000' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: selectedChain.steps.length > 0 ? 'pointer' : 'default',
                    fontSize: 13
                  }}
                >
                  ▶ Play Chain
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  ■ Stop
                </button>
              )}
              <button
                onClick={() => deleteChain(selectedChain.id)}
                title="Delete Chain"
                style={{
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                Delete
              </button>
            </div>

            {/* Hotkey hint */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
              <span>
                <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', fontSize: 10 }}>
                  F11
                </kbd>{' '}
                Play
              </span>
              <span>
                <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', fontSize: 10 }}>
                  F12
                </kbd>{' '}
                Stop
              </span>
              <span>
                <kbd style={{ padding: '1px 5px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', fontSize: 10 }}>
                  Esc
                </kbd>{' '}
                Emergency Stop
              </span>
            </div>

            {/* Steps */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedChain.steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    background: step.enabled ? 'var(--bg-secondary)' : 'rgba(100,100,100,0.1)',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    opacity: step.enabled ? 1 : 0.5
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: 'rgba(6, 182, 212, 0.2)',
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {i + 1}
                  </span>

                  <select
                    value={step.macroId}
                    onChange={(e) =>
                      updateStep(selectedChain.id, i, { macroId: e.target.value })
                    }
                    style={{
                      flex: 1,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: 'var(--text-primary)',
                      fontSize: 13
                    }}
                  >
                    <option value="">Select macro...</option>
                    {macros.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Delay:</span>
                    <input
                      type="number"
                      value={step.delayAfterMs}
                      onChange={(e) =>
                        updateStep(selectedChain.id, i, {
                          delayAfterMs: Math.max(0, parseInt(e.target.value) || 0)
                        })
                      }
                      style={{
                        width: 60,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        padding: '4px 6px',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ms</span>
                  </div>

                  <button
                    onClick={() =>
                      updateStep(selectedChain.id, i, { enabled: !step.enabled })
                    }
                    title={step.enabled ? 'Disable step' : 'Enable step'}
                    style={{
                      border: 'none',
                      borderRadius: 6,
                      padding: '4px 8px',
                      background: step.enabled
                        ? 'rgba(34, 197, 94, 0.15)'
                        : 'rgba(100,100,100,0.1)',
                      color: step.enabled ? '#22c55e' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    {step.enabled ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => removeStep(selectedChain.id, i)}
                    title="Remove step"
                    style={{
                      border: 'none',
                      borderRadius: 6,
                      width: 28,
                      height: 28,
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add step button */}
              <button
                onClick={() => {
                  if (macros.length > 0) {
                    addStep(selectedChain.id, macros[0].id)
                  }
                }}
                disabled={macros.length === 0}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 8,
                  padding: 12,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: macros.length > 0 ? 'pointer' : 'default',
                  fontSize: 13,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (macros.length > 0) {
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                    e.currentTarget.style.color = 'var(--accent-cyan)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                + Add Step
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontSize: 14
            }}
          >
            {chains.length > 0
              ? 'Select a chain to edit'
              : 'Create a chain to run macros in sequence'}
          </div>
        )}
      </div>
    </div>
  )
}
