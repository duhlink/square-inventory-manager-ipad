import * as React from "react"
import { cn } from "@/lib/utils"
import { usePress } from "@/hooks/use-press"
import { Ripple } from "@/components/ui/ripple"
import { PressIndicator } from "@/components/ui/press-indicator"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    containerClassName?: string
  }
>(({ className, containerClassName, ...props }, ref) => (
  <div className={cn(
    "relative w-full overflow-auto overscroll-contain",
    "-webkit-overflow-scrolling-touch scroll-smooth",
    "rounded-md border",
    "max-h-[80vh] sm:max-h-[85vh]",
    containerClassName
  )}>
    <div className="h-1 sm:h-2" />
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-xs sm:text-sm",
        "touch-pan-x touch-pan-y",
        "border-separate border-spacing-0",
        className
      )}
      {...props}
    />
    <div className="h-1 sm:h-2" />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b sticky top-0 bg-background z-10", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "sticky bottom-0 border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    onLongPress?: () => void
    onRowClick?: () => void
  }
>(({ className, onLongPress, onRowClick, children, ...props }, ref) => {
  const pressHandlers = usePress({
    onLongPress,
    onClick: onRowClick,
    longPressDelay: 500
  })

  const isInteractive = onLongPress || onRowClick

  return (
    <tr
      ref={ref}
      className={cn(
        "relative transition-colors",
        "hover:bg-muted/50",
        "data-[state=selected]:bg-muted",
        "touch-manipulation select-none",
        "focus-visible:outline-none focus-visible:bg-muted/60",
        isInteractive && "cursor-pointer",
        className
      )}
      {...(isInteractive ? pressHandlers : {})}
      {...props}
    >
      {children}
    </tr>
  )
})
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    isSortable?: boolean
    onSort?: () => void
  }
>(({ className, isSortable, onSort, children, ...props }, ref) => {
  const pressHandlers = onSort ? usePress({
    onClick: onSort,
    longPressDelay: 500
  }) : {}

  return (
    <th
      ref={ref}
      className={cn(
        "h-8 px-2 sm:px-4 text-left align-middle font-medium text-muted-foreground text-xs sm:text-sm",
        "touch-manipulation select-none whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        isSortable && "cursor-pointer",
        className
      )}
      {...(onSort ? pressHandlers : {})}
      {...props}
    >
      {children}
    </th>
  )
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    isEditable?: boolean
    onCellPress?: () => void
  }
>(({ className, isEditable, onCellPress, children, ...props }, ref) => {
  const pressHandlers = onCellPress ? usePress({
    onClick: onCellPress,
    longPressDelay: 500
  }) : {}

  const isInteractive = isEditable || onCellPress

  return (
    <td
      ref={ref}
      className={cn(
        "p-1 sm:p-2 align-middle h-8 text-xs sm:text-sm",
        "touch-manipulation select-none",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        isEditable && "cursor-text",
        !isEditable && onCellPress && "cursor-pointer",
        className
      )}
      {...(onCellPress ? pressHandlers : {})}
      {...props}
    >
      {children}
    </td>
  )
})
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-2 sm:mt-4 text-xs sm:text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
