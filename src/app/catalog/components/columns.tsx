"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, History, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CatalogItem {
  id: string
  name: string
  description?: string
  sku: string
  categories: string[]
  categoryIds: string[]
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
  imageUrl?: string
}

interface CatalogColumnProps {
  onEdit: (item: CatalogItem) => void
}

export const getCatalogColumns = ({ onEdit }: CatalogColumnProps): ColumnDef<CatalogItem>[] => [
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.getValue("imageUrl") as string
      return imageUrl ? (
        <div className="px-6 py-4">
          <img 
            src={imageUrl} 
            alt={row.getValue("name")} 
            className="w-16 h-16 object-cover rounded-md"
          />
        </div>
      ) : null
    }
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    id: "categories",
    header: "Categories",
    accessorFn: (row) => row.categories,
    cell: ({ row }) => {
      const categories = row.getValue("categories") as string[]
      return categories?.join(", ") || "-"
    },
    filterFn: (row, id, filterValue) => {
      const categoryIds = row.original.categoryIds
      if (!filterValue?.length) return true
      return filterValue.some((value: string) => categoryIds.includes(value))
    }
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
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 border-dashed w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-[160px] p-2"
          >
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(item)
              }}
              className="flex items-center px-3 py-2 mb-1 rounded-md hover:bg-secondary cursor-pointer focus:bg-secondary"
            >
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit Item</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center px-3 py-2 mb-1 rounded-md hover:bg-secondary cursor-pointer focus:bg-secondary"
            >
              <History className="mr-2 h-4 w-4" />
              <span>View History</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center px-3 py-2 rounded-md hover:bg-secondary cursor-pointer focus:bg-secondary"
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Add to PO</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
