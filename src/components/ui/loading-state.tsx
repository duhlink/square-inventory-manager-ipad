"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  message?: string
  size?: "sm" | "default" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-8 w-8"
}

export function LoadingState({ message = "Loading...", size = "default", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2 min-h-[100px] text-muted-foreground", className)}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

export function LoadingSpinner({ size = "default", className }: { size?: "sm" | "default" | "lg", className?: string }) {
  return <Loader2 className={cn(`animate-spin ${sizeClasses[size]}`, className)} />
}

export function LoadingBar({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full h-1 overflow-hidden bg-muted rounded-full", className)}>
      <div className="absolute top-0 h-full w-1/3 bg-primary animate-loading-bar" />
    </div>
  )
}

export function StatusMessage({ 
  message, 
  type = "info", 
  className 
}: { 
  message: string, 
  type?: "info" | "success" | "warning" | "error",
  className?: string 
}) {
  const bgColors = {
    info: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    success: "bg-green-500/15 text-green-700 dark:text-green-300",
    warning: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
    error: "bg-red-500/15 text-red-700 dark:text-red-300"
  }

  return (
    <div className={cn(`px-4 py-2 rounded-md text-sm font-medium ${bgColors[type]}`, className)}>
      {message}
    </div>
  )
}
