"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { InventoryItem, InventoryAction } from './types'
import { catalogService } from '@/services/square/catalog'
import { inventoryService } from '@/services/square/inventory'

interface InventoryContextType {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  actions: InventoryAction[]
  refreshInventory: () => Promise<void>
  addItem: (item: Partial<InventoryItem>) => Promise<void>
  updateItem: (item: InventoryItem) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [actions, setActions] = useState<InventoryAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const logAction = (action: Omit<InventoryAction, 'id' | 'timestamp'>) => {
    const newAction: InventoryAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }
    setActions(prev => [newAction, ...prev])
  }

  const refreshInventory = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch catalog items
      const catalogResponse = await catalogService.listCatalogItems()
      if (!catalogResponse.success) {
        throw new Error(catalogResponse.error?.message)
      }

      const items = catalogResponse.data || []

      // Fetch inventory counts for all items
      if (items.length > 0) {
        const inventoryResponse = await inventoryService.retrieveInventoryCounts(
          items.map(item => item.squareId!)
        )

        if (inventoryResponse.success && inventoryResponse.data) {
          // Update quantities and status
          items.forEach(item => {
            const quantity = inventoryResponse.data.get(item.squareId!) || 0
            item.quantity = quantity
            item.status = quantity === 0 ? 'out_of_stock' :
                         quantity <= item.reorderPoint ? 'low_stock' : 'in_stock'
          })
        }
      }

      setItems(items)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to refresh inventory'
      setError(errorMessage)
      console.error('Error refreshing inventory:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (newItem: Partial<InventoryItem>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await catalogService.createCatalogItem(newItem)
      if (!response.success) {
        throw new Error(response.error?.message)
      }

      const createdItem = response.data!
      setItems(prev => [...prev, createdItem])

      logAction({
        itemId: createdItem.id,
        action: 'create',
        userId: 'current-user', // Replace with actual user ID
        userName: 'Current User' // Replace with actual user name
      })

      // Set initial inventory if quantity provided
      if (newItem.quantity && newItem.quantity > 0) {
        await inventoryService.setInventoryLevel(
          createdItem.squareId!,
          newItem.quantity
        )
      }

      toast({
        variant: "success",
        title: "Item Added",
        description: `${createdItem.name} has been added to inventory.`
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add item'
      setError(errorMessage)
      console.error('Error adding item:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (updatedItem: InventoryItem) => {
    try {
      setLoading(true)
      setError(null)

      const response = await catalogService.updateCatalogItem(updatedItem)
      if (!response.success) {
        throw new Error(response.error?.message)
      }

      setItems(prev =>
        prev.map(item =>
          item.id === updatedItem.id ? response.data! : item
        )
      )

      logAction({
        itemId: updatedItem.id,
        action: 'update',
        userId: 'current-user', // Replace with actual user ID
        userName: 'Current User' // Replace with actual user name
      })

      toast({
        variant: "success",
        title: "Item Updated",
        description: `${updatedItem.name} has been updated successfully.`
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update item'
      setError(errorMessage)
      console.error('Error updating item:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      setLoading(true)
      setError(null)

      const itemToDelete = items.find(item => item.id === itemId)
      if (!itemToDelete) {
        throw new Error('Item not found')
      }

      const response = await catalogService.deleteCatalogItem(itemId)
      if (!response.success) {
        throw new Error(response.error?.message)
      }

      setItems(prev => prev.filter(item => item.id !== itemId))

      logAction({
        itemId,
        action: 'delete',
        userId: 'current-user', // Replace with actual user ID
        userName: 'Current User' // Replace with actual user name
      })

      toast({
        variant: "success",
        title: "Item Deleted",
        description: `${itemToDelete.name} has been removed from inventory.`
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete item'
      setError(errorMessage)
      console.error('Error deleting item:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true)
      setError(null)

      const item = items.find(i => i.id === itemId)
      if (!item) {
        throw new Error('Item not found')
      }

      const response = await inventoryService.setInventoryLevel(
        item.squareId!,
        quantity
      )
      if (!response.success) {
        throw new Error(response.error?.message)
      }

      setItems(prev =>
        prev.map(i => {
          if (i.id === itemId) {
            const status = quantity === 0 ? 'out_of_stock' :
                          quantity <= i.reorderPoint ? 'low_stock' : 'in_stock'
            return { ...i, quantity, status }
          }
          return i
        })
      )

      logAction({
        itemId,
        action: 'update',
        field: 'quantity',
        oldValue: item.quantity.toString(),
        newValue: quantity.toString(),
        userId: 'current-user', // Replace with actual user ID
        userName: 'Current User' // Replace with actual user name
      })

      toast({
        variant: "success",
        title: "Quantity Updated",
        description: `${item.name} quantity has been updated to ${quantity}.`
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update quantity'
      setError(errorMessage)
      console.error('Error updating quantity:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshInventory()
  }, [])

  const value = {
    items,
    loading,
    error,
    actions,
    refreshInventory,
    addItem,
    updateItem,
    deleteItem,
    updateQuantity
  }

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider')
  }
  return context
}