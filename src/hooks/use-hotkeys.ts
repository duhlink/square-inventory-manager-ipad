import { useEffect, useCallback } from 'react'

type KeyHandler = (e: KeyboardEvent) => void
type KeyMap = { [key: string]: KeyHandler }

/**
 * A React hook for handling keyboard shortcuts
 * 
 * @param keyMap An object mapping key combinations to handler functions
 * 
 * Supported formats:
 * - Single keys: 'escape', 'enter', 'tab', 'space', etc.
 * - Modifier combinations: 'ctrl+s', 'ctrl+shift+s', 'ctrl+alt+s'
 * - Platform-aware: Uses 'ctrl+' prefix for both Control and Command (⌘) keys
 * 
 * Example usage:
 * ```tsx
 * useHotkeys({
 *   'ctrl+s': (e) => handleSave(e),
 *   'escape': (e) => handleCancel(e),
 *   'ctrl+shift+a': (e) => handleSpecialAction(e)
 * })
 * ```
 */
export function useHotkeys(keyMap: KeyMap) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Get the pressed key combination
      const key = event.key.toLowerCase()
      const ctrl = event.ctrlKey
      const meta = event.metaKey
      const alt = event.altKey
      const shift = event.shiftKey

      // Create string representations of possible key combinations
      const combinations = []

      // Add ctrl+ combination
      if (ctrl) {
        let keyString = 'ctrl+'
        if (alt) keyString += 'alt+'
        if (shift) keyString += 'shift+'
        keyString += key
        combinations.push(keyString)
      }

      // Add cmd+ (meta) combination
      if (meta) {
        let keyString = 'ctrl+' // We use ctrl+ for both Ctrl and Cmd
        if (alt) keyString += 'alt+'
        if (shift) keyString += 'shift+'
        keyString += key
        combinations.push(keyString)
      }

      // Single key (like 'escape')
      if (!ctrl && !meta && !alt && !shift) {
        combinations.push(key)
      }

      // Check if we have a handler for any of the combinations
      for (const combination of combinations) {
        const handler = keyMap[combination]
        if (handler) {
          event.preventDefault()
          handler(event)
          break
        }
      }
    },
    [keyMap]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}