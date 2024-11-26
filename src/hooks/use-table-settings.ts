import { useState, useEffect } from 'react'

interface ColumnSettings {
  id: string
  width: number
  locked: boolean
}

export function useTableSettings(tableId: string, defaultWidths: Record<string, number>) {
  const [columnSettings, setColumnSettings] = useState<Record<string, ColumnSettings>>(() => {
    if (typeof window === 'undefined') return {}
    
    const saved = localStorage.getItem(`table-settings-${tableId}`)
    if (saved) {
      return JSON.parse(saved)
    }

    // Initialize with default widths and unlocked state
    return Object.entries(defaultWidths).reduce((acc, [id, width]) => ({
      ...acc,
      [id]: { id, width, locked: false }
    }), {})
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`table-settings-${tableId}`, JSON.stringify(columnSettings))
    }
  }, [columnSettings, tableId])

  const updateColumnWidth = (columnId: string, width: number) => {
    setColumnSettings(prev => {
      // Don't update if column is locked
      if (prev[columnId]?.locked) return prev

      return {
        ...prev,
        [columnId]: {
          ...prev[columnId],
          width
        }
      }
    })
  }

  const toggleColumnLock = (columnId: string) => {
    setColumnSettings(prev => ({
      ...prev,
      [columnId]: {
        ...prev[columnId],
        locked: !prev[columnId]?.locked
      }
    }))
  }

  const getColumnWidth = (columnId: string): number => {
    return columnSettings[columnId]?.width || defaultWidths[columnId] || 150
  }

  const isColumnLocked = (columnId: string): boolean => {
    return columnSettings[columnId]?.locked || false
  }

  return {
    columnSettings,
    updateColumnWidth,
    toggleColumnLock,
    getColumnWidth,
    isColumnLocked
  }
}
