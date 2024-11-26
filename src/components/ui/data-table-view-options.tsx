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
  const hiddenColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && 
        column.getCanHide() &&
        !column.getIsVisible()
    ).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          View
          {hiddenColumns > 0 && (
            <span className="ml-1 rounded-md bg-primary/20 px-1.5 py-0.5 text-xs font-medium leading-none">
              {hiddenColumns}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
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
                    "capitalize py-2",
                    isVisible ? "text-foreground" : "text-muted-foreground"
                  )}
                  checked={isVisible}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {columnName}
                </DropdownMenuCheckboxItem>
              )
            })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
