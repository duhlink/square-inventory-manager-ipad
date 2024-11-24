"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"

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
}

export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-2">
      <div className="flex flex-1 flex-col sm:flex-row gap-4 sm:items-center">
        <Input
          placeholder="Filter records..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-10 w-full sm:w-[250px] lg:w-[350px]"
        />
        <div className="flex flex-wrap gap-2">
          {filterableColumns.map(({ id, title, options }) => {
            const column = table.getColumn(id)
            if (!column) return null
            return (
              <DataTableFacetedFilter
                key={id}
                column={column}
                title={title}
                options={options}
              />
            )
          })}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-10 px-3 lg:px-4"
            >
              Reset
              <Cross2Icon className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}