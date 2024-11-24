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

interface Category {
  id: string
  name: string
  value: string
}

function InventoryContent() {
  const { items, loading, error, refreshInventory, deleteItem } = useInventory()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | undefined>(undefined)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true)
      const response = await fetch('/api/square/catalog/categories')
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data)
      } else {
        throw new Error('Failed to fetch categories')
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load categories"
      })
    } finally {
      setLoadingCategories(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleRefresh = useCallback(async () => {
    if (!loading) {
      await refreshInventory()
      toast({
        title: "Refreshed",
        description: "Inventory has been refreshed.",
      })
    }
  }, [loading, refreshInventory, toast])

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

  useEffect(() => {
    refreshInventory()
  }, [refreshInventory])

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
      id: "categories",
      title: "Categories",
      options: categories.map(cat => ({
        label: cat.name,
        value: cat.value
      }))
    }
  ]

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden">
      <div className="flex-none px-2 py-2 flex justify-end gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

      {error && (
        <Alert variant="destructive" className="flex-none mx-2 my-1">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex-1 min-h-0 px-2 pb-2">
        {loading || loadingCategories ? (
          <InventoryTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={items}
            filterableColumns={filterableColumns}
          />
        )}
      </div>

      <InventoryDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
      />

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
