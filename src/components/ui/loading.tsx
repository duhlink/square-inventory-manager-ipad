import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg"
  fullScreen?: boolean
}

export function Loading({
  size = "default",
  fullScreen = false,
  className,
  ...props
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <Loader2
        className={cn(
          "animate-spin text-muted-foreground",
          sizeClasses[size]
        )}
      />
    </div>
  )
}

export function LoadingPage() {
  return (
    <Loading
      fullScreen
      size="lg"
      className="fixed inset-0 z-50"
    />
  )
}

export function LoadingInline({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-[200px] w-full items-center justify-center",
        className
      )}
      {...props}
    >
      <Loading size="default" />
    </div>
  )
}

export function LoadingButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Loading
      size="sm"
      className={cn("mr-2 inline-block", className)}
      {...props}
    />
  )
}