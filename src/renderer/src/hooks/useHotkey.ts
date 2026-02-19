export function formatHotkey(accelerator: string): string {
  if (!accelerator) return '—'

  const isMac = navigator.platform.toLowerCase().includes('mac')

  return accelerator
    .replace(/CommandOrControl|CmdOrCtrl/gi, isMac ? 'Cmd' : 'Ctrl')
    .replace(/Command|Cmd/gi, isMac ? '\u2318' : 'Ctrl')
    .replace(/Control|Ctrl/gi, isMac ? '\u2303' : 'Ctrl')
    .replace(/Shift/gi, isMac ? '\u21E7' : 'Shift')
    .replace(/Alt|Option/gi, isMac ? '\u2325' : 'Alt')
    .replace(/Meta|Super/gi, isMac ? '\u2318' : 'Win')
    .replace(/Escape/gi, 'Esc')
    .replace(/\+/g, ' + ')
}
