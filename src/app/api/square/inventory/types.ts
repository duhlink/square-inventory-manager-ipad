export interface InventoryUpdateRequest {
  variationId: string
  quantity: number
}

export interface BatchInventoryUpdateRequest {
  items: InventoryUpdateRequest[]
}

export interface InventoryQueryRequest {
  type: 'query'
  items: { 
    catalogItemId: string
    variationId: string 
  }[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
