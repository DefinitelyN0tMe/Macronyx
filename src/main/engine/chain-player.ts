// Chain Player — executes macro chains (A → B → C) sequentially
import type { MacroChain, Macro, ChainPlaybackState, PlaybackState } from '../../shared/types'
import { Player } from './player'

export class ChainPlayer {
  private currentStepIndex = 0
  private isPlaying = false
  private isPaused = false
  private player: Player
  private onProgress?: (state: ChainPlaybackState) => void
  private currentChain: MacroChain | null = null

  constructor(player: Player) {
    this.player = player
  }

  async play(
    chain: MacroChain,
    loadMacro: (id: string) => Promise<Macro | null>,
    onProgress: (state: ChainPlaybackState) => void
  ): Promise<void> {
    if (this.isPlaying) {
      this.stop()
      await new Promise((r) => setTimeout(r, 50))
    }

    this.isPlaying = true
    this.isPaused = false
    this.currentStepIndex = 0
    this.currentChain = chain
    this.onProgress = onProgress

    const enabledSteps = chain.steps.filter((s) => s.enabled)

    try {
      for (let i = 0; i < enabledSteps.length; i++) {
        if (!this.isPlaying) break
        this.currentStepIndex = i

        const step = enabledSteps[i]
        const macro = await loadMacro(step.macroId)
        if (!macro) {
          console.warn(`Chain step ${i}: macro ${step.macroId} not found, skipping`)
          continue
        }

        onProgress({
          chainId: chain.id,
          status: 'playing',
          currentStepIndex: i,
          totalSteps: enabledSteps.length,
          currentMacroId: macro.id
        })

        // Play the macro and wait for it to finish
        await new Promise<void>((resolve) => {
          this.player.play(macro, (_state: PlaybackState) => {
            if (_state.status === 'idle') {
              resolve()
            }
          })
        })

        if (!this.isPlaying) break

        // Delay between steps
        if (step.delayAfterMs > 0 && i < enabledSteps.length - 1) {
          const deadline = Date.now() + step.delayAfterMs
          while (Date.now() < deadline && this.isPlaying && !this.isPaused) {
            await new Promise((r) => setTimeout(r, Math.min(50, deadline - Date.now())))
          }
          // Wait while paused
          while (this.isPaused && this.isPlaying) {
            await new Promise((r) => setTimeout(r, 100))
          }
        }
      }
    } catch (err) {
      console.error('Chain playback error:', err)
    }

    this.isPlaying = false
    this.currentChain = null
    onProgress({
      chainId: chain.id,
      status: 'idle',
      currentStepIndex: 0,
      totalSteps: enabledSteps.length,
      currentMacroId: null
    })
  }

  stop(): void {
    this.isPlaying = false
    this.isPaused = false
    this.player.stop()
  }

  pause(): void {
    this.isPaused = true
    this.player.pause()
  }

  resume(): void {
    this.isPaused = false
    this.player.resume()
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }
}
