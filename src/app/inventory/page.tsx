"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { InventoryItem } from "./types"
import { LoadingState, StatusMessage } from "@/components/ui/loading-state"

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<{
    message: string;
    type: "info" | "success" | "warning" | "error";
  } | null>(null)

  useEffect(() => {
    async function loadInventory() {
      try {
        setLoading(true)
        setStatus({ message: "Fetching inventory data...", type: "info" })

        const response = await fetch('/api/square/catalog')
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch inventory')
        }

        setInventory(result.data)
        setStatus({ message: "Inventory loaded successfully", type: "success" })

        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatus(null)
        }, 3000)

      } catch (err) {
        console.error('Error loading inventory:', err)
        setStatus({
          message: err instanceof Error ? err.message : 'Failed to load inventory',
          type: "error"
        })
      } finally {
        setLoading(false)
      }
    }

    loadInventory()
  }, [])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {status && (
        <div className="flex-none px-2 pt-2">
          <StatusMessage 
            message={status.message} 
            type={status.type} 
          />
        </div>
      )}
      
      <div className="flex-1 min-h-0 px-2 pb-2">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingState message="Loading inventory data..." />
          </div>
        ) : (
          <div className="h-full">
            <DataTable 
              data={inventory} 
              columns={columns}
              filterableColumns={[
                {
                  id: "categories",
                  title: "Categories",
                  options: []
                }
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}
