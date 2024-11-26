"use client"

import * as React from "react"
import { Check, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table } from "@tanstack/react-table"
import { LoadingSpinner, StatusMessage } from "@/components/ui/loading-state"

interface DataTableCategoriesProps<TData> {
  table: Table<TData>
}

export function DataTableCategories<TData>({
  table,
}: DataTableCategoriesProps<TData>) {
  const [categories, setCategories] = React.useState<{ label: string; value: string }[]>([])
  const [selectedValues, setSelectedValues] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [filtering, setFiltering] = React.useState(false)

  React.useEffect(() => {
    // Fetch categories when component mounts
    async function fetchCategories() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/square/catalog/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch categories')
        }
        console.log('Fetched categories:', result.data)
        setCategories(result.data)
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch categories')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  React.useEffect(() => {
    // Update table filters when selected values change
    const column = table.getColumn("categories")
    if (column) {
      setFiltering(true)
      console.log('Setting category filter:', selectedValues)
      // Pass the array of selected values directly
      column.setFilterValue(selectedValues)
      // Simulate filtering delay
      setTimeout(() => {
        setFiltering(false)
      }, 500)
    } else {
      console.warn('Category column not found')
    }
  }, [selectedValues, table])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
          disabled={loading}
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Categories
              {selectedValues.length > 0 && (
                <span className="ml-1 rounded-md bg-primary/20 px-1.5 py-0.5 text-xs font-medium leading-none">
                  {selectedValues.length}
                </span>
              )}
              {filtering && (
                <LoadingSpinner size="sm" className="ml-2" />
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Filter Categories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-2">
            <StatusMessage message={error} type="error" />
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {categories.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No categories found
              </div>
            ) : (
              categories.map((category) => {
                const isSelected = selectedValues.includes(category.value)
                return (
                  <DropdownMenuCheckboxItem
                    key={category.value}
                    className="flex items-center pr-6"
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedValues([...selectedValues, category.value])
                      } else {
                        setSelectedValues(selectedValues.filter(value => value !== category.value))
                      }
                    }}
                  >
                    <div className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      {category.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                )
              })
            )}
          </div>
        )}
        {selectedValues.length > 0 && !loading && !error && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setSelectedValues([])}
              disabled={filtering}
            >
              {filtering ? <LoadingSpinner size="sm" /> : "Clear Filters"}
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
