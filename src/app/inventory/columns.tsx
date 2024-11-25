"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { InventoryItem } from "./types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"

export const columns: ColumnDef<InventoryItem>[] = [
  {
    id: "image",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Image"
        className="w-[50px]"
      />
    ),
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl
      return imageUrl ? (
        <div className="w-[50px] h-[50px] relative">
          <img
            src={imageUrl}
            alt={row.getValue("name")}
            className="object-cover w-full h-full rounded-sm"
          />
        </div>
      ) : (
        <div className="w-[50px] h-[50px] bg-muted rounded-sm" />
      )
    },
    enableSorting: false,
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Name"
        className="min-w-[80px] sm:min-w-[120px]"
      />
    ),
    cell: ({ row }) => (
      <div className="max-w-[120px] sm:max-w-[200px] font-medium">
        <span className="truncate block">{row.getValue("name")}</span>
      </div>
    ),
    enableSorting: true,
  },
  {
    id: "sku",
    accessorKey: "sku",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="SKU"
      />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.getValue("sku") || "N/A"}
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "categories",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Categories"
      />
    ),
    cell: ({ row }) => {
      const categories = row.original.categories || []
      if (!categories.length) return <span className="text-muted-foreground text-sm">No categories</span>

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 flex items-center gap-1 hover:bg-accent hover:text-accent-foreground"
            >
              <Badge variant="outline" className="text-xs">
                {categories[0]}
              </Badge>
              {categories.length > 1 && (
                <Badge variant="secondary" className="text-xs">
                  +{categories.length - 1}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Categories</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories.map((category, index) => (
              <DropdownMenuItem key={index} className="text-sm">
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    filterFn: (row, id, value: string[]) => {
      const categoryIds = row.original.categoryIds as string[]
      if (!value?.length) return true // Show all when no filter is applied
      return value.some(val => categoryIds?.includes(val))
    },
    enableSorting: true,
  },
  {
    id: "quantity",
    accessorKey: "quantity",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Qty"
        className="w-[60px] sm:w-auto"
      />
    ),
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number
      const reorderPoint = row.original.reorderPoint
      return (
        <div className="flex items-center gap-1 sm:gap-2">
          <span>{quantity}</span>
          {quantity <= reorderPoint && (
            <Badge 
              variant={quantity === 0 ? "destructive" : "warning"}
              className="text-[10px] sm:text-xs px-1"
            >
              {quantity === 0 ? "Out" : "Low"}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: true,
  },
  {
    id: "unitType",
    accessorKey: "unitType",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Unit"
        className="hidden sm:table-cell"
      />
    ),
    cell: ({ row }) => (
      <span className="hidden sm:table-cell">
        {row.getValue("unitType") || "per item"}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "price",
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Price"
        className="w-[70px] sm:w-auto"
      />
    ),
    cell: ({ row }) => {
      const price = row.getValue("price") as number
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price || 0)
    },
    enableSorting: true,
  },
  {
    id: "unitCost",
    accessorKey: "unitCost",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Unit Cost"
        className="hidden lg:table-cell"
      />
    ),
    cell: ({ row }) => {
      const unitCost = row.getValue("unitCost") as number
      return (
        <span className="hidden lg:table-cell">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(unitCost || 0)}
        </span>
      )
    },
    enableSorting: true,
  },
  {
    id: "vendorName",
    accessorKey: "vendorName",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Vendor"
      />
    ),
    cell: ({ row }) => (
      <div className="max-w-[150px]">
        <span className="truncate block">{row.getValue("vendorName") || "No Vendor"}</span>
      </div>
    ),
    enableSorting: true,
  },
  {
    id: "variations",
    accessorKey: "variations",
    header: ({ column }) => (
      <DataTableColumnHeader 
        column={column} 
        title="Variations"
        className="hidden xl:table-cell"
      />
    ),
    cell: ({ row }) => {
      const variations = (row.getValue("variations") as InventoryItem["variations"]) || []
      if (!variations.length) return null
      return (
        <div className="hidden xl:flex flex-col gap-1">
          {variations.map((v, i) => (
            <div key={i} className="text-xs">
              <div className="font-medium">{v.name}</div>
              <div className="text-muted-foreground">
                SKU: {v.sku || "N/A"}
              </div>
            </div>
          ))}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end"
            className="w-[160px]"
          >
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              className="h-9"
              onClick={() => navigator.clipboard.writeText(item.id)}
            >
              Copy Item ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="h-9"
              onSelect={() => {
                const content = document.querySelector('[role="dialog"]')?.parentElement
                if (content) content.style.pointerEvents = "auto"
                window.dispatchEvent(new CustomEvent('edit-inventory-item', { detail: item }))
              }}
            >
              Edit Item
            </DropdownMenuItem>
            <DropdownMenuItem className="h-9">
              View History
            </DropdownMenuItem>
            <DropdownMenuItem className="h-9">
              Add to Purchase Order
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground h-9"
              onSelect={() => {
                const content = document.querySelector('[role="dialog"]')?.parentElement
                if (content) content.style.pointerEvents = "auto"
                window.dispatchEvent(new CustomEvent('delete-inventory-item', { detail: item }))
              }}
            >
              Delete Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
