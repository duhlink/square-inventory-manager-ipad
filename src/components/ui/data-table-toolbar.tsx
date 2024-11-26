"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { DataTableCategories } from "@/components/ui/data-table-categories"
import { LoadingSpinner } from "@/components/ui/loading-state"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterableColumns?: {
    id: string
    title: string
    options: {
      label: string
      value: string
    }[]
  }[]
  isFiltering?: boolean
}

export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
  isFiltering = false,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between space-x-2 py-4">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative">
          <Input
            placeholder="Filter records..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {isFiltering && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {table.getColumn("categories") && (
            <DataTableCategories table={table} />
          )}
          <DataTableViewOptions table={table} />
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
