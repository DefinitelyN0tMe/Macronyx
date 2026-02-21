// Profile Auto-Switcher — automatically activates profiles based on the active window
import type { ProfileRule, WindowInfo } from '../../shared/types'
import { ActiveWindowService } from './active-window'

export class ProfileSwitcher {
  private rules: ProfileRule[] = []
  private activeWindowService: ActiveWindowService
  private onSwitch?: (profileId: string) => void
  private currentProfileId: string | null = null
  private listening = false

  constructor(activeWindowService: ActiveWindowService) {
    this.activeWindowService = activeWindowService
    this.handleWindowChanged = this.handleWindowChanged.bind(this)
  }

  setRules(rules: ProfileRule[]): void {
    // Sort by priority descending (higher priority checked first)
    this.rules = [...rules].sort((a, b) => b.priority - a.priority)
  }

  setOnSwitch(callback: (profileId: string) => void): void {
    this.onSwitch = callback
  }

  start(): void {
    if (this.listening) return
    this.listening = true
    this.activeWindowService.on('window-changed', this.handleWindowChanged)
  }

  stop(): void {
    this.listening = false
    this.activeWindowService.removeListener('window-changed', this.handleWindowChanged)
    this.currentProfileId = null
  }

  private handleWindowChanged(data: { previous: WindowInfo; current: WindowInfo }): void {
    const { current } = data
    if (!current) return

    for (const rule of this.rules) {
      if (this.matchesRule(rule, current)) {
        if (this.currentProfileId !== rule.profileId) {
          this.currentProfileId = rule.profileId
          this.onSwitch?.(rule.profileId)
        }
        return
      }
    }
    // No rule matched — could revert to default profile if needed
  }

  private matchesRule(rule: ProfileRule, info: WindowInfo): boolean {
    switch (rule.matchType) {
      case 'process':
        return info.processName.toLowerCase() === rule.matchValue.toLowerCase()
      case 'title_contains':
        return info.title.toLowerCase().includes(rule.matchValue.toLowerCase())
      case 'title_regex':
        try {
          return new RegExp(rule.matchValue, 'i').test(info.title)
        } catch {
          return false
        }
      default:
        return false
    }
  }
}
