"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useHotkeys } from "@/hooks/use-hotkeys"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { InventoryProvider, useInventory } from "./inventory-context"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InventoryDialog } from "./inventory-dialog"
import { DeleteConfirmation } from "./delete-confirmation"
import { InventoryItem } from "./types"
import { LoadingPage } from "@/components/ui/loading"
import { InventoryTableSkeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

// Example filter options for the DataTable
const filterableColumns = [
  {
    id: "status",
    title: "Status",
    options: [
      { label: "In Stock", value: "in_stock" },
      { label: "Low Stock", value: "low_stock" },
      { label: "Out of Stock", value: "out_of_stock" },
    ],
  },
  {
    id: "category",
    title: "Category",
    options: [
      { label: "Beverages", value: "beverages" },
      { label: "Snacks", value: "snacks" },
      { label: "Groceries", value: "groceries" },
    ],
  },
]

function InventoryContent() {
  const { items, loading, error, refreshInventory, deleteItem } = useInventory()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>(undefined)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (!loading) {
      await refreshInventory()
      toast({
        title: "Refreshed",
        description: "Inventory has been refreshed.",
      })
    }
  }, [loading, refreshInventory])

  const handleNewItem = useCallback(() => {
    setSelectedItem(undefined)
    setDialogOpen(true)
  }, [])

  useHotkeys({
    'ctrl+r': handleRefresh,
    'ctrl+n': handleNewItem,
    'escape': () => {
      setDialogOpen(false)
      setDeleteDialogOpen(false)
    },
  })

  const handleDeleteConfirm = async (itemId: string) => {
    try {
      setIsDeleting(true)
      await deleteItem(itemId)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    const handleDeleteItem = (event: CustomEvent<InventoryItem>) => {
      setItemToDelete(event.detail)
      setDeleteDialogOpen(true)
    }

    window.addEventListener('delete-inventory-item', handleDeleteItem as EventListener)
    return () => {
      window.removeEventListener('delete-inventory-item', handleDeleteItem as EventListener)
    }
  }, [])

  useEffect(() => {
    const handleEditItem = (event: CustomEvent<InventoryItem>) => {
      setSelectedItem(event.detail)
      setDialogOpen(true)
    }

    window.addEventListener('edit-inventory-item', handleEditItem as EventListener)
    return () => {
      window.removeEventListener('edit-inventory-item', handleEditItem as EventListener)
    }
  }, [])

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">
              Manage your store inventory and stock levels
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh inventory"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={handleNewItem}
              title="Add new inventory item"
            >
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>
      </div>

      <InventoryDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <InventoryTableSkeleton />
      ) : (
        <DataTable 
          columns={columns} 
          data={items}
          filterableColumns={filterableColumns}
        />
      )}

      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        item={itemToDelete}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <InventoryProvider>
      <InventoryContent />
    </InventoryProvider>
  )
}