"use client"

import { useEffect, useState } from "react"
import { DataTableVendors } from "@/components/ui/data-table-vendors"
import { Vendor } from "@/services/square/vendors"
import { Skeleton } from "@/components/ui/skeleton"

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVendors() {
      try {
        const response = await fetch('/api/square/vendors')
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to fetch vendors')
        }

        setVendors(result.data)
      } catch (err) {
        console.error('Error loading vendors:', err)
        setError(err instanceof Error ? err.message : 'Failed to load vendors')
      } finally {
        setLoading(false)
      }
    }

    loadVendors()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-md bg-destructive/15 p-4">
          <div className="text-sm text-destructive">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendors</h2>
          <p className="text-muted-foreground">
            List of all active vendors in the system
          </p>
        </div>
      </div>
      <div className="mt-6">
        <DataTableVendors data={vendors} />
      </div>
    </div>
  )
}
