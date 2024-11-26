"use client"

import { useState } from "react"
import useSWR from "swr"
import { DataTable } from "@/components/ui/data-table"
import { getCatalogColumns } from "./components/columns"
import { CatalogDialog } from "./components/catalog-dialog"
import { LoadingSpinner } from "@/components/ui/loading-state"
import { NavBar } from "@/components/ui/nav-bar"

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch catalog')
  }
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error?.message || 'Failed to fetch catalog')
  }
  return data
}

export default function CatalogPage() {
  const [editingItem, setEditingItem] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, error, isLoading, mutate } = useSWR('/api/square/catalog', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000
  })

  const handleEdit = (item: any) => {
    console.log('Opening edit dialog for item:', item)
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    console.log('Dialog state changing to:', open)
    if (!open) {
      setTimeout(() => {
        setEditingItem(null)
        mutate()
      }, 300)
    }
    setDialogOpen(open)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col bg-background">
        <NavBar />
        <div className="flex-1 flex items-center justify-center text-red-500">
          {error instanceof Error ? error.message : 'An error occurred'}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <NavBar />
      <div className="flex-1 min-h-0 overflow-hidden">
        <DataTable
          columns={getCatalogColumns({ onEdit: handleEdit })}
          data={data.data}
          filterableColumns={[
            {
              id: "categories",
              title: "Categories",
              options: data.categories.map((cat: any) => ({
                label: cat.label,
                value: cat.value
              }))
            }
          ]}
        />
      </div>
      {dialogOpen && (
        <CatalogDialog
          key={editingItem?.id}
          open={dialogOpen}
          onOpenChange={handleDialogChange}
          item={editingItem}
          categories={data.categories}
        />
      )}
    </div>
  )
}
