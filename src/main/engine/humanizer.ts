export class Humanizer {
  randomizeDelay(delay: number, amount: number): number {
    if (amount <= 0 || delay <= 0) return delay
    const factor = amount / 100
    const variance = delay * factor
    const offset = (Math.random() * 2 - 1) * variance
    return Math.max(1, Math.round(delay + offset))
  }

  randomizePosition(amount: number): { x: number; y: number } {
    const maxOffset = Math.max(1, Math.round(amount / 10))
    return {
      x: Math.round((Math.random() * 2 - 1) * maxOffset),
      y: Math.round((Math.random() * 2 - 1) * maxOffset)
    }
  }
}
