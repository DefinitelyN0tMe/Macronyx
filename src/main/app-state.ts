// Shared mutable app state accessible from both index.ts and ipc.ts
// Avoids circular dependencies

export const appState = {
  minimizeToTray: true,
  isQuitting: false
}
