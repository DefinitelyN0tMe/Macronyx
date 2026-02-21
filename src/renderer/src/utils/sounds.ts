// Notification sounds using Web Audio API oscillator synthesis
// Short, distinct tones for each action — no audio files needed

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext()
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15
): void {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    // Fade out to avoid click
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Silently fail — sounds are non-critical
  }
}

function playSequence(
  notes: Array<{ freq: number; start: number; duration: number }>,
  type: OscillatorType = 'sine',
  volume = 0.12
): void {
  try {
    const ctx = getAudioContext()
    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start)
      gain.gain.setValueAtTime(volume, ctx.currentTime + note.start)
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + note.start + note.duration
      )

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + note.start)
      osc.stop(ctx.currentTime + note.start + note.duration)
    }
  } catch {
    // Silently fail
  }
}

/** Ascending two-note chime — recording started */
export function soundRecordStart(): void {
  playSequence([
    { freq: 660, start: 0, duration: 0.1 },
    { freq: 880, start: 0.1, duration: 0.15 }
  ], 'sine', 0.13)
}

/** Descending two-note chime — recording stopped */
export function soundRecordStop(): void {
  playSequence([
    { freq: 880, start: 0, duration: 0.1 },
    { freq: 660, start: 0.1, duration: 0.15 }
  ], 'sine', 0.13)
}

/** Single mid-tone blip — paused */
export function soundPause(): void {
  playTone(520, 0.12, 'sine', 0.12)
}

/** Single higher blip — resumed */
export function soundResume(): void {
  playTone(700, 0.12, 'sine', 0.12)
}

/** Playback start — bright ascending triple */
export function soundPlayStart(): void {
  playSequence([
    { freq: 523, start: 0, duration: 0.08 },
    { freq: 659, start: 0.08, duration: 0.08 },
    { freq: 784, start: 0.16, duration: 0.12 }
  ], 'triangle', 0.11)
}

/** Playback stop — descending triple */
export function soundPlayStop(): void {
  playSequence([
    { freq: 784, start: 0, duration: 0.08 },
    { freq: 659, start: 0.08, duration: 0.08 },
    { freq: 523, start: 0.16, duration: 0.12 }
  ], 'triangle', 0.11)
}
