"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CatalogItem {
  id: string
  name: string
  description?: string
  sku: string
  categories: string[]
  price: number
  unitCost: number
  quantity: number
  reorderPoint: number
  vendorId?: string
  vendorName?: string
  trackInventory: boolean
  sellable: boolean
  stockable: boolean
  isTaxable: boolean
  visibility: string
  variations: any[]
}

interface CatalogColumnProps {
  onEdit: (item: CatalogItem) => void
}

export const getCatalogColumns = ({ onEdit }: CatalogColumnProps): ColumnDef<CatalogItem>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "categories",
    header: "Categories",
    cell: ({ row }) => {
      const categories = row.getValue("categories") as string[]
      return categories?.join(", ") || "-"
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price)
      return formatted
    },
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "vendorName",
    header: "Vendor",
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => {
      const visibility = row.getValue("visibility") as string
      return visibility.replace(/_/g, " ").toLowerCase()
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
