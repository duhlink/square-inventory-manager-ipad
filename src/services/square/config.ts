import { Client, Environment } from 'square'

// Initialize the Square client
export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NODE_ENV === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
})

// Square API endpoints
export const SQUARE_API = {
  CATALOG: {
    LIST: '/catalog/list',
    UPSERT: '/catalog/upsert',
    DELETE: '/catalog/delete',
    BATCH_UPSERT: '/catalog/batch-upsert',
    BATCH_DELETE: '/catalog/batch-delete',
    SEARCH: '/catalog/search'
  },
  INVENTORY: {
    COUNT: '/inventory/count',
    BATCH_CHANGE: '/inventory/batch-change',
    BATCH_RETRIEVE: '/inventory/batch-retrieve'
  }
}

// Square API response types
export type SquareResponse<T> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Square API error codes
export const SQUARE_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
}

// Square API rate limiting configuration
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_SECOND: 25,
  RETRY_AFTER_MS: 1000
}

// Square catalog types mapping
export const CATALOG_TYPES = {
  ITEM: 'ITEM',
  ITEM_VARIATION: 'ITEM_VARIATION',
  CATEGORY: 'CATEGORY',
  TAX: 'TAX',
  DISCOUNT: 'DISCOUNT',
  MODIFIER_LIST: 'MODIFIER_LIST',
  MODIFIER: 'MODIFIER',
  PRICING_RULE: 'PRICING_RULE'
}

// Square inventory states
export const INVENTORY_STATES = {
  IN_STOCK: 'IN_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  WASTE: 'WASTE',
  UNLINKED_RETURN: 'UNLINKED_RETURN',
  SOLD: 'SOLD'
}