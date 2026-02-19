import { createTheme, MantineColorsTuple } from '@mantine/core'

const cyan: MantineColorsTuple = [
  '#e0feff',
  '#b0f5fc',
  '#7eedf9',
  '#4de4f6',
  '#1cdcf3',
  '#06b6d4',
  '#0599b3',
  '#047c92',
  '#035f71',
  '#024250'
]

const violet: MantineColorsTuple = [
  '#f5e6ff',
  '#e4b8ff',
  '#d48aff',
  '#c35cff',
  '#b32eff',
  '#a855f7',
  '#8a44cc',
  '#6c33a1',
  '#4e2276',
  '#30114b'
]

export const theme = createTheme({
  primaryColor: 'cyan',
  colors: {
    cyan,
    violet,
    dark: [
      '#c1c2c5',
      '#a6a7ab',
      '#909296',
      '#5c5f66',
      '#373a40',
      '#2c2e33',
      '#1e2030',
      '#151722',
      '#0d1117',
      '#0a0e27'
    ]
  },
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  defaultRadius: 'md'
})
