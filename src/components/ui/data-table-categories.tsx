"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Tags, Check, X } from "lucide-react"
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

interface DataTableCategoriesProps<TData> {
  table: Table<TData>
  categories: {
    label: string
    value: string
  }[]
}

export function DataTableCategories<TData>({
  table,
  categories,
}: DataTableCategoriesProps<TData>) {
  const categoriesColumn = table.getColumn("categories")
  const selectedValues = (categoriesColumn?.getFilterValue() as string[]) || []

  const toggleCategory = (value: string) => {
    if (!categoriesColumn) return

    const currentFilters = [...selectedValues]
    const index = currentFilters.indexOf(value)

    if (index === -1) {
      currentFilters.push(value)
    } else {
      currentFilters.splice(index, 1)
    }

    categoriesColumn.setFilterValue(currentFilters.length ? currentFilters : undefined)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 lg:h-10 px-3 lg:px-4 flex items-center gap-2"
          title="Filter by categories"
        >
          <Tags className="h-4 w-4" />
          <span className="hidden sm:inline">View Categories</span>
          {selectedValues.length > 0 && (
            <div className="ml-2 rounded-md bg-primary/20 px-1 text-xs font-medium leading-none text-primary">
              {selectedValues.length}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel className="py-2 px-4 text-sm font-semibold">
          Toggle Categories
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {categories.map((category) => {
            const isSelected = selectedValues.includes(category.value)
            return (
              <DropdownMenuCheckboxItem
                key={category.value}
                className={cn(
                  "py-3 px-4 cursor-pointer hover:bg-muted flex items-center justify-between gap-2",
                  "focus:bg-muted focus:text-foreground"
                )}
                checked={isSelected}
                onCheckedChange={() => toggleCategory(category.value)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isSelected ? (
                    <Check className="h-4 w-4 text-green-500 flex-none" />
                  ) : (
                    <X className="h-4 w-4 text-red-500 flex-none" />
                  )}
                  <span className={cn(
                    "text-sm truncate",
                    isSelected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {category.label}
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
