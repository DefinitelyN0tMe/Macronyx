// Map uiohook-napi keycodes to human-readable key names
// Reference: https://github.com/nicholasadamou/uiohook-napi/blob/main/src/keycodes.ts
const KEYCODE_MAP: Record<number, string> = {
  // Function keys
  0x003b: 'F1',
  0x003c: 'F2',
  0x003d: 'F3',
  0x003e: 'F4',
  0x003f: 'F5',
  0x0040: 'F6',
  0x0041: 'F7',
  0x0042: 'F8',
  0x0043: 'F9',
  0x0044: 'F10',
  0x0057: 'F11',
  0x0058: 'F12',

  // Numbers
  0x000b: '0',
  0x0002: '1',
  0x0003: '2',
  0x0004: '3',
  0x0005: '4',
  0x0006: '5',
  0x0007: '6',
  0x0008: '7',
  0x0009: '8',
  0x000a: '9',

  // Letters
  0x001e: 'a',
  0x0030: 'b',
  0x002e: 'c',
  0x0020: 'd',
  0x0012: 'e',
  0x0021: 'f',
  0x0022: 'g',
  0x0023: 'h',
  0x0017: 'i',
  0x0024: 'j',
  0x0025: 'k',
  0x0026: 'l',
  0x0032: 'm',
  0x0031: 'n',
  0x0018: 'o',
  0x0019: 'p',
  0x0010: 'q',
  0x0013: 'r',
  0x001f: 's',
  0x0014: 't',
  0x0016: 'u',
  0x002f: 'v',
  0x0011: 'w',
  0x002d: 'x',
  0x0015: 'y',
  0x002c: 'z',

  // Special keys
  0x0001: 'Escape',
  0x000e: 'BackSpace',
  0x000f: 'Tab',
  0x001c: 'Return',
  0x0039: 'space',
  0x001d: 'Control_L',
  0x0e1d: 'Control_R',
  0x002a: 'Shift_L',
  0x0036: 'Shift_R',
  0x0038: 'Alt_L',
  0x0e38: 'Alt_R',
  0x0e5b: 'Super_L',
  0x0e5c: 'Super_R',

  // Navigation
  0x0e48: 'Up',
  0x0e50: 'Down',
  0x0e4b: 'Left',
  0x0e4d: 'Right',
  0x0e49: 'Page_Up',
  0x0e51: 'Page_Down',
  0x0e47: 'Home',
  0x0e4f: 'End',
  0x0e52: 'Insert',
  0x0e53: 'Delete',

  // Symbols
  0x0027: 'semicolon',
  0x0028: 'apostrophe',
  0x0029: 'grave',
  0x002b: 'backslash',
  0x0033: 'comma',
  0x0034: 'period',
  0x0035: 'slash',
  0x000c: 'minus',
  0x000d: 'equal',
  0x001a: 'bracketleft',
  0x001b: 'bracketright',

  // Numpad
  0x0052: 'KP_0',
  0x004f: 'KP_1',
  0x0050: 'KP_2',
  0x0051: 'KP_3',
  0x004b: 'KP_4',
  0x004c: 'KP_5',
  0x004d: 'KP_6',
  0x0047: 'KP_7',
  0x0048: 'KP_8',
  0x0049: 'KP_9',
  0x0037: 'KP_Multiply',
  0x004e: 'KP_Add',
  0x004a: 'KP_Subtract',
  0x0053: 'KP_Decimal',
  0x0e35: 'KP_Divide',
  0x0e1c: 'KP_Enter',

  // Other
  0x003a: 'Caps_Lock',
  0x0045: 'Num_Lock',
  0x0046: 'Scroll_Lock',
  0x0e37: 'Print',
  0xff13: 'Pause'
}

export function mapKeyCode(keyCode: number): string | undefined {
  return KEYCODE_MAP[keyCode]
}

// Reverse map for display: human-readable name to keycode
const REVERSE_MAP: Record<string, number> = {}
for (const [code, name] of Object.entries(KEYCODE_MAP)) {
  REVERSE_MAP[name.toLowerCase()] = Number(code)
}

export function keyNameToCode(name: string): number | undefined {
  return REVERSE_MAP[name.toLowerCase()]
}

// Get a display-friendly label for a keycode
export function getKeyLabel(keyCode: number): string {
  const name = KEYCODE_MAP[keyCode]
  if (!name) return `Key(${keyCode})`

  const displayMap: Record<string, string> = {
    Control_L: 'Ctrl',
    Control_R: 'Ctrl',
    Shift_L: 'Shift',
    Shift_R: 'Shift',
    Alt_L: 'Alt',
    Alt_R: 'Alt',
    Super_L: 'Win',
    Super_R: 'Win',
    Return: 'Enter',
    BackSpace: 'Backspace',
    space: 'Space',
    Escape: 'Esc',
    Delete: 'Del',
    Insert: 'Ins',
    Page_Up: 'PgUp',
    Page_Down: 'PgDn',
    Caps_Lock: 'CapsLk',
    Num_Lock: 'NumLk',
    Scroll_Lock: 'ScrLk',
    KP_Multiply: 'Num*',
    KP_Add: 'Num+',
    KP_Subtract: 'Num-',
    KP_Decimal: 'Num.',
    KP_Divide: 'Num/',
    KP_Enter: 'NumEnter'
  }

  if (displayMap[name]) return displayMap[name]
  if (name.startsWith('KP_')) return `Num${name.slice(3)}`
  if (name.length === 1) return name.toUpperCase()
  return name
}
