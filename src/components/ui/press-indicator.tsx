"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  isPressed?: boolean
  size?: "sm" | "md" | "lg"
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}

export const PressIndicator = React.forwardRef<HTMLDivElement, PressIndicatorProps>(
  ({ className, isPressed, size = "md", position = "top-right", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-1 w-1",
      md: "h-1.5 w-1.5",
      lg: "h-2 w-2",
    }

    const positionClasses = {
      "top-left": "top-2 left-2",
      "top-right": "top-2 right-2",
      "bottom-left": "bottom-2 left-2",
      "bottom-right": "bottom-2 right-2",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "absolute rounded-full transition-all duration-300",
          sizeClasses[size],
          positionClasses[position],
          isPressed ? "bg-primary scale-150 opacity-100" : "bg-muted opacity-0",
          className
        )}
        {...props}
      />
    )
  }
)
PressIndicator.displayName = "PressIndicator"