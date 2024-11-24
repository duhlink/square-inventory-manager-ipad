import { useCallback, useRef } from 'react'

interface UsePressOptions {
  onLongPress?: () => void
  onClick?: () => void
  longPressDelay?: number
}

export function usePress({
  onLongPress,
  onClick,
  longPressDelay = 500
}: UsePressOptions) {
  const timerRef = useRef<number>()
  const isLongPress = useRef(false)

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault()
    isLongPress.current = false
    timerRef.current = window.setTimeout(() => {
      isLongPress.current = true
      onLongPress?.()
    }, longPressDelay)
  }, [onLongPress, longPressDelay])

  const cancel = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault()
    window.clearTimeout(timerRef.current)
    if (!isLongPress.current) {
      onClick?.()
    }
  }, [onClick])

  const handlers = {
    onTouchStart: start,
    onTouchEnd: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: (event: React.MouseEvent) => {
      event.preventDefault()
      window.clearTimeout(timerRef.current)
    }
  }

  return handlers
}