"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RippleProps extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number
  color?: string
}

export const Ripple = React.forwardRef<HTMLDivElement, RippleProps>(
  ({ className, duration = 600, color = "rgba(0, 0, 0, 0.1)", ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{
      x: number
      y: number
      size: number
      id: number
    }>>([])

    React.useEffect(() => {
      const timeouts: number[] = []
      ripples.forEach((ripple) => {
        const timeout = window.setTimeout(() => {
          setRipples((prevRipples) =>
            prevRipples.filter((r) => r.id !== ripple.id)
          )
        }, duration)
        timeouts.push(timeout)
      })
      return () => {
        timeouts.forEach((timeout) => clearTimeout(timeout))
      }
    }, [ripples, duration])

    const onClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const size = Math.max(rect.width, rect.height)
      const id = Date.now()

      setRipples((prevRipples) => [...prevRipples, { x, y, size, id }])
    }

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        onClick={onClick}
        {...props}
      >
        {ripples.map(({ x, y, size, id }) => (
          <div
            key={id}
            className="absolute rounded-full animate-ripple"
            style={{
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
    )
  }
)
Ripple.displayName = "Ripple"