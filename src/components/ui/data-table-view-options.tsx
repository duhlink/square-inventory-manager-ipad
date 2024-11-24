"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { SlidersHorizontal, Check, X } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 lg:h-10 px-3 lg:px-4 flex items-center gap-2"
          title="Toggle visible columns"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">View Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel className="py-2 px-4 text-sm font-semibold">
          Toggle Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column) => {
              const isVisible = column.getIsVisible()
              const columnName = column.id
                .split(/(?=[A-Z])|_/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')

              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className={cn(
                    "py-3 px-4 cursor-pointer hover:bg-muted flex items-center justify-between gap-2",
                    "focus:bg-muted focus:text-foreground"
                  )}
                  checked={isVisible}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isVisible ? (
                      <Check className="h-4 w-4 text-green-500 flex-none" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 flex-none" />
                    )}
                    <span className={cn(
                      "text-sm truncate",
                      isVisible ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {columnName}
                    </span>
                  </div>
                </DropdownMenuCheckboxItem>
              )
            })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
