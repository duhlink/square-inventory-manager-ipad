"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { InventoryItem, InventoryAction } from './types'
import * as Sentry from '@sentry/nextjs'

interface InventoryContextType {
  items: InventoryItem[]
  loading: boolean
  error: string | null
  actions: InventoryAction[]
  refreshInventory: () => Promise<void>
  updateItem: (item: InventoryItem) => Promise<void>
  deleteItem: (itemId: string) => Promise<void>
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

function logError(error: any, context: string, extra?: Record<string, any>) {
  const errorDetails = {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
    code: error?.code,
    status: error?.status,
    response: error?.response,
    data: error?.data,
    ...extra
  }

  console.error(`Error in ${context}:`, JSON.stringify(errorDetails, null, 2))
  
  Sentry.captureException(error, {
    extra: {
      context,
      ...errorDetails
    }
  })

  return errorDetails
}

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

  const refreshInventory = useCallback(async () => {
    try {
      console.log('Starting inventory fetch...')
      setLoading(true)
      setError(null)

      const response = await fetch('/api/square/catalog')
      console.log('API response received:', response.status)

      const data = await response.json()
      console.log('Response parsed:', data.success ? 'success' : 'failure')

      if (!response.ok || !data.success) {
        console.error('Error response:', data)
        throw new Error(data.error?.message || 'Failed to fetch inventory')
      }

      console.log('Setting inventory data:', data.data?.length || 0, 'items')
      setItems(data.data || [])

    } catch (err: any) {
      const errorDetails = logError(err, 'refresh_inventory')
      const errorMessage = errorDetails.message || 'Failed to refresh inventory'
      
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })

    } finally {
      setLoading(false)
      console.log('Inventory fetch complete')
    }
  }, [toast])

  const updateItem = useCallback(async (updatedItem: InventoryItem) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/square/catalog', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedItem)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Failed to update item: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success || !data.data) {
        throw new Error(data.error?.message || 'Failed to update item')
      }

      setItems(prev =>
        prev.map(item =>
          item.id === updatedItem.id ? data.data : item
        )
      )

      logAction({
        itemId: updatedItem.id,
        action: 'update',
        userId: 'current-user',
        userName: 'Current User'
      })

      toast({
        title: "Success",
        description: `${updatedItem.name} has been updated successfully.`
      })

    } catch (err: any) {
      const errorDetails = logError(err, 'update_item', { updatedItem })
      const errorMessage = errorDetails.message || 'Failed to update item'
      
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })

    } finally {
      setLoading(false)
    }
  }, [toast])

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/square/catalog`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: itemId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Failed to delete item: ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete item')
      }

      setItems(prev => prev.filter(item => item.id !== itemId))

      logAction({
        itemId,
        action: 'delete',
        userId: 'current-user',
        userName: 'Current User'
      })

      toast({
        title: "Success",
        description: "Item has been deleted successfully."
      })

    } catch (err: any) {
      const errorDetails = logError(err, 'delete_item', { itemId })
      const errorMessage = errorDetails.message || 'Failed to delete item'
      
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })

    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refreshInventory()
  }, [refreshInventory])

  const value = {
    items,
    loading,
    error,
    actions,
    refreshInventory,
    updateItem,
    deleteItem
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
