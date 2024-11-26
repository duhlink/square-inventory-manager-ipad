import { useCallback, useRef, useEffect } from 'react'

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
  const elementRef = useRef<HTMLElement | null>(null)

  const start = useCallback(() => {
    isLongPress.current = false
    timerRef.current = window.setTimeout(() => {
      isLongPress.current = true
      onLongPress?.()
    }, longPressDelay)
  }, [onLongPress, longPressDelay])

  const cancel = useCallback(() => {
    window.clearTimeout(timerRef.current)
    if (!isLongPress.current) {
      onClick?.()
    }
  }, [onClick])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const touchStart = () => start()
    const touchEnd = () => cancel()
    const mouseDown = () => start()
    const mouseUp = () => cancel()
    const mouseLeave = () => {
      window.clearTimeout(timerRef.current)
    }

    element.addEventListener('touchstart', touchStart, { passive: true })
    element.addEventListener('touchend', touchEnd, { passive: true })
    element.addEventListener('mousedown', mouseDown, { passive: true })
    element.addEventListener('mouseup', mouseUp, { passive: true })
    element.addEventListener('mouseleave', mouseLeave, { passive: true })

    return () => {
      element.removeEventListener('touchstart', touchStart)
      element.removeEventListener('touchend', touchEnd)
      element.removeEventListener('mousedown', mouseDown)
      element.removeEventListener('mouseup', mouseUp)
      element.removeEventListener('mouseleave', mouseLeave)
    }
  }, [start, cancel])

  return {
    ref: elementRef
  }
}
