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
import { LockIcon, UnlockIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableToolbar } from "@/components/ui/data-table-toolbar"
import { LoadingSpinner, StatusMessage } from "@/components/ui/loading-state"
import { useTableSettings } from "@/hooks/use-table-settings"
import { Button } from "@/components/ui/button"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  tableId?: string
  defaultColumnWidths?: Record<string, number>
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
  tableId = "default",
  defaultColumnWidths = {},
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

  const {
    columnSettings,
    updateColumnWidth,
    toggleColumnLock,
    getColumnWidth,
    isColumnLocked
  } = useTableSettings(tableId, defaultColumnWidths)

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

  const handleColumnResize = React.useCallback((columnId: string, width: number) => {
    if (!isColumnLocked(columnId)) {
      updateColumnWidth(columnId, Math.max(50, width))
    }
  }, [isColumnLocked, updateColumnWidth])

  const handleResizeStart = React.useCallback((
    columnId: string,
    startWidth: number,
    startX: number,
    startTouch?: boolean
  ) => {
    const onMove = (clientX: number) => {
      const diff = clientX - startX
      handleColumnResize(columnId, startWidth + diff)
    }

    const onMouseMove = (e: MouseEvent) => onMove(e.pageX)
    const onTouchMove = (e: TouchEvent) => onMove(e.touches[0].pageX)

    const onEnd = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onEnd)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onEnd)
    }

    if (startTouch) {
      document.addEventListener('touchmove', onTouchMove)
      document.addEventListener('touchend', onEnd)
    } else {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onEnd)
    }
  }, [handleColumnResize])

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-7rem)] md:max-h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-9rem)]">
      <div className="flex-none border-b bg-background">
        <div className="p-4">
          <DataTableToolbar 
            table={table}
            filterableColumns={filterableColumns}
            isFiltering={isFiltering}
          />
          {status && (
            <div className="mt-2">
              <StatusMessage 
                message={status.message} 
                type={status.type} 
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto border-b">
        <div className="min-w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort()
                    const sortHandler = header.column.getToggleSortingHandler()
                    const columnId = header.column.id
                    const width = getColumnWidth(columnId)
                    const locked = isColumnLocked(columnId)

                    return (
                      <TableHead 
                        key={header.id}
                        isSortable={isSortable}
                        onSort={sortHandler ? () => sortHandler({}) : undefined}
                        style={{ width: width ? `${width}px` : undefined }}
                        className="group relative touch-none"
                      >
                        <div className="flex items-center">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-1 opacity-0 group-hover:opacity-100"
                            onClick={() => toggleColumnLock(columnId)}
                          >
                            {locked ? (
                              <LockIcon className="h-3 w-3" />
                            ) : (
                              <UnlockIcon className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        {!locked && (
                          <div
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleResizeStart(columnId, width || 0, e.pageX)
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault()
                              handleResizeStart(columnId, width || 0, e.touches[0].pageX, true)
                            }}
                            className="absolute right-0 top-0 h-full w-4 cursor-col-resize group-hover:bg-accent -mr-2"
                          />
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
                    {row.getVisibleCells().map((cell) => {
                      const width = getColumnWidth(cell.column.id)
                      return (
                        <TableCell 
                          key={cell.id}
                          style={{ width: width ? `${width}px` : undefined }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
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
      <div className="sticky bottom-0 flex-none bg-background border-t">
        <div className="p-4">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  )
}
