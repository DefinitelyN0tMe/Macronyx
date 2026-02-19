export function getPlatform(): 'win32' | 'darwin' | 'linux' {
  return process.platform as 'win32' | 'darwin' | 'linux'
}

export function isMac(): boolean {
  return process.platform === 'darwin'
}

export function isWindows(): boolean {
  return process.platform === 'win32'
}

export function isLinux(): boolean {
  return process.platform === 'linux'
}
