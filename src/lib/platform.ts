export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false
  return window.navigator.platform.toLowerCase().includes('mac')
}

export function getModifierKey(): string {
  return isMacOS() ? '⌘' : 'Ctrl'
}

export function getShortcut(key: string): string {
  return `${getModifierKey()}+${key.toUpperCase()}`
}