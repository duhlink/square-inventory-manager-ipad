export type InventoryItem = {
  id: string
  name: string
  description: string
  sku: string
  categories: string[] // Category names
  categoryIds: string[] // Category IDs for Square API
  price: number
  unitCost: number
  quantity: number
  reorderPoint: number
  vendorId: string
  vendorName: string
  vendorCode: string
  unitType: string
  measurementUnitId: string
  lastUpdated: string
  updatedBy: string
  squareId: string
  squareCatalogVersion: number
  squareUpdatedAt: string
  variations: ItemVariation[]
  isTaxable: boolean
  visibility: 'PUBLIC' | 'PRIVATE'
  trackInventory: boolean
  imageUrl?: string
  imageId?: string
}

export type ItemVariation = {
  id: string
  name: string
  sku: string
  price: number
  cost: number
  upc?: string
  measurementUnit: string
  vendorSku?: string
  priceMoney?: {
    amount: number
    currency: string
  }
  pricing?: {
    cost: number
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
  code: string
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
