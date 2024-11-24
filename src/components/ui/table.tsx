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
    containerClassName
  )}>
    <div className="h-2" /> {/* Padding spacer */}
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm",
        "touch-pan-x touch-pan-y",
        "border-separate border-spacing-0",
        className
      )}
      {...props}
    />
    <div className="h-2" /> {/* Padding spacer */}
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
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
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
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

  const content = isInteractive ? (
    <Ripple
      className="w-full"
      color="rgba(0, 0, 0, 0.03)"
      duration={800}
    >
      <div className="relative">
        {children}
        <div className="absolute inset-0 pointer-events-none border-b" />
      </div>
    </Ripple>
  ) : (
    <>
      {children}
      <div className="absolute inset-0 pointer-events-none border-b" />
    </>
  )

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
      {content}
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

  const content = isSortable ? (
    <Ripple
      className="w-full h-full"
      color="rgba(0, 0, 0, 0.05)"
      duration={400}
    >
      <div className="p-4 flex items-center">{children}</div>
    </Ripple>
  ) : (
    <div className="p-4">{children}</div>
  )

  return (
    <th
      ref={ref}
      className={cn(
        "h-12 text-left align-middle font-medium text-muted-foreground p-0",
        "touch-manipulation select-none",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        "[&>button]:w-full [&>button]:h-full [&>button]:p-4 [&>button]:flex [&>button]:items-center [&>button]:font-medium",
        isSortable && "cursor-pointer",
        className
      )}
      {...(onSort ? pressHandlers : {})}
      {...props}
    >
      {content}
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

  const content = isInteractive ? (
    <Ripple
      className="w-full h-full"
      color={isEditable ? "rgba(0, 0, 0, 0.05)" : "rgba(0, 0, 0, 0.1)"}
    >
      <div className="p-4">{children}</div>
    </Ripple>
  ) : (
    <div className="p-4">{children}</div>
  )

  return (
    <td
      ref={ref}
      className={cn(
        "align-middle min-h-[3.5rem] p-0",
        "touch-manipulation select-none",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        "[&>button]:w-full [&>button]:h-full [&>button]:p-4 [&>button]:flex [&>button]:items-center",
        isEditable && "cursor-text",
        !isEditable && onCellPress && "cursor-pointer",
        className
      )}
      {...(onCellPress ? pressHandlers : {})}
      {...props}
    >
      {content}
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
    className={cn("mt-4 text-sm text-muted-foreground", className)}
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