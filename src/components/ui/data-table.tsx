"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import { LoadingSpinner, StatusMessage } from "@/components/ui/loading-state"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  filterableColumns?: {
    id: string
    title: string
    options: {
      label: string
      value: string
    }[]
  }[]
}

export function DataTable<TData>({
  columns,
  data,
  filterableColumns = [],
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [isFiltering, setIsFiltering] = React.useState(false)
  const [status, setStatus] = React.useState<{
    message: string;
    type: "info" | "success" | "warning" | "error";
  } | null>(null)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: (value) => {
      setIsFiltering(true)
      setColumnFilters(value)
      // Simulate loading state for filtering
      setTimeout(() => {
        setIsFiltering(false)
        setStatus({ 
          message: "Filter applied", 
          type: "success" 
        })
        setTimeout(() => setStatus(null), 2000)
      }, 500)
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none">
        <DataTableToolbar 
          table={table}
          filterableColumns={filterableColumns}
          isFiltering={isFiltering}
        />
      </div>
      {status && (
        <div className="flex-none mt-2">
          <StatusMessage 
            message={status.message} 
            type={status.type} 
          />
        </div>
      )}
      <div className="flex-1 min-h-0 mt-2 border rounded-md">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort()
                    const sortHandler = header.column.getToggleSortingHandler()
                    return (
                      <TableHead 
                        key={header.id}
                        isSortable={isSortable}
                        onSort={sortHandler ? () => sortHandler({}) : undefined}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isFiltering ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-muted-foreground">
                        Filtering results...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex-none mt-2">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
