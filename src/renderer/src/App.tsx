import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { theme } from './styles/theme'
import { AppShell } from './components/layout/AppShell'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './styles/global.css'

export function App(): JSX.Element {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <AppShell />
    </MantineProvider>
  )
}
