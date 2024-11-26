"use client"

import { useState } from "react"
import useSWR from "swr"
import { DataTable } from "@/components/ui/data-table"
import { getCatalogColumns } from "./columns"
import { CatalogDialog } from "./catalog-dialog"
import { LoadingSpinner } from "@/components/ui/loading-state"

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

  const { data, error, isLoading } = useSWR('/api/square/catalog', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error instanceof Error ? error.message : 'An error occurred'}
      </div>
    )
  }

  const columns = getCatalogColumns({
    onEdit: handleEdit
  })

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
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
      <CatalogDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        categories={data.categories}
      />
    </div>
  )
}
