"use client"

import * as React from "react"
import { Check, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Table } from "@tanstack/react-table"

interface DataTableCategoriesProps<TData> {
  table: Table<TData>
}

export function DataTableCategories<TData>({
  table,
}: DataTableCategoriesProps<TData>) {
  const [categories, setCategories] = React.useState<{ label: string; value: string }[]>([])
  const [open, setOpen] = React.useState(false)
  const [selectedValues, setSelectedValues] = React.useState<string[]>([])

  React.useEffect(() => {
    // Fetch categories when component mounts
    async function fetchCategories() {
      try {
        const response = await fetch('/api/square/catalog/categories')
        const result = await response.json()
        if (result.success) {
          console.log('Fetched categories:', result.data)
          setCategories(result.data)
        } else {
          console.error('Failed to fetch categories:', result.error)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  React.useEffect(() => {
    // Update table filters when selected values change
    const column = table.getColumn("categories")
    if (column) {
      console.log('Setting category filter:', selectedValues)
      column.setFilterValue(selectedValues.length ? selectedValues : undefined)
    } else {
      console.warn('Category column not found')
    }
  }, [selectedValues, table])

  // Get the selected category labels for display
  const getSelectedLabels = React.useCallback((values: string[]) => {
    return categories
      .filter(cat => values.includes(cat.value))
      .map(cat => cat.label)
  }, [categories])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Categories
          {selectedValues?.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.length} selected
                  </Badge>
                ) : (
                  getSelectedLabels(selectedValues).map((label) => (
                    <Badge
                      variant="secondary"
                      key={label}
                      className="rounded-sm px-1 font-normal"
                    >
                      {label}
                    </Badge>
                  ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              {categories.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        setSelectedValues(selectedValues.filter((value) => value !== option.value))
                      } else {
                        setSelectedValues([...selectedValues, option.value])
                      }
                      setOpen(true) // Keep the popover open
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedValues([])
                      setOpen(false)
                    }}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
