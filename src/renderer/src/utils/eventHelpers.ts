import type { MacroEventType } from '@shared/types'

export function getEventTypeLabel(type: MacroEventType): string {
  const labels: Record<MacroEventType, string> = {
    mouse_move: 'Mouse Move',
    mouse_click: 'Mouse Click',
    mouse_up: 'Mouse Release',
    mouse_scroll: 'Mouse Scroll',
    key_down: 'Key Press',
    key_up: 'Key Release'
  }
  return labels[type] || type
}

export function getEventTypeColor(type: MacroEventType): string {
  if (type.startsWith('mouse_')) return 'var(--accent-cyan)'
  if (type.startsWith('key_')) return 'var(--accent-violet)'
  return 'var(--text-secondary)'
}

export function getEventIcon(type: MacroEventType): string {
  const icons: Record<MacroEventType, string> = {
    mouse_move: '\u2192',
    mouse_click: '\u25CF',
    mouse_up: '\u25CB',
    mouse_scroll: '\u2195',
    key_down: '\u2B07',
    key_up: '\u2B06'
  }
  return icons[type] || '?'
}

export function isMouseEvent(type: MacroEventType): boolean {
  return type.startsWith('mouse_')
}

export function isKeyEvent(type: MacroEventType): boolean {
  return type.startsWith('key_')
}

/** Deterministic HSL color from a string (for group bands) */
export function stringToColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0 // Convert to 32bit integer
  }
  const hue = ((hash % 360) + 360) % 360
  return `hsl(${hue}, 60%, 55%)`
}
