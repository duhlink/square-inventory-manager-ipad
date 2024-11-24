export type InventoryItem = {
  id: string
  name: string
  description: string
  sku: string
  category: string
  categories: string[] // Additional categorization
  price: number
  cost: number
  quantity: number
  reorderPoint: number
  vendor: string
  vendorCode: string // Added vendor code
  vendorName: string // Added explicit vendor name
  unitType: string // Added unit type (per item, per gallon, per foot)
  unitCost: number // Added unit cost
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  lastUpdated: string
  updatedBy: string
  variations?: ItemVariation[]
  // Square API specific fields
  squareId?: string
  squareCatalogVersion?: number
  squareUpdatedAt?: string
}

export type ItemVariation = {
  id: string
  name: string
  sku: string
  gtin?: string // Added Global Trade Item Number
  price: number
  cost: number
  quantity: number
  weight?: {
    value: number
    unit: 'oz' | 'lb' | 'g' | 'kg'
  }
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
  code: string // Added vendor code
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
