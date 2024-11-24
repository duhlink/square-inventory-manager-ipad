export type InventoryItem = {
  id: string
  name: string
  sku: string
  category: string
  price: number
  cost: number
  quantity: number
  reorderPoint: number
  vendor: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  lastUpdated: string
  updatedBy: string
  variations?: {
    id: string
    name: string
    sku: string
    price: number
    cost: number
    quantity: number
  }[]
  // Square API specific fields
  squareId?: string
  squareCatalogVersion?: number
  squareUpdatedAt?: string
}

export type InventoryAction = {
  id: string
  itemId: string
  action: 'create' | 'update' | 'delete'
  field?: string
  oldValue?: string
  newValue?: string
  timestamp: string
  userId: string
  userName: string
}

export type Vendor = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  categories: string[]
}

export type PurchaseOrder = {
  id: string
  vendorId: string
  status: 'open' | 'closed'
  createdAt: string
  updatedAt: string
  items: PurchaseOrderItem[]
  expectedTotal: number
  actualTotal: number
}

export type PurchaseOrderItem = {
  id: string
  itemId: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  receivedQuantity?: number
  actualPrice?: number
}