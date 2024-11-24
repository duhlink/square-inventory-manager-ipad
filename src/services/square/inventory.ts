import { squareClient, SquareResponse, RATE_LIMIT, INVENTORY_STATES } from './config'
import { delay } from '../../lib/utils'
import * as Sentry from '@sentry/nextjs'

// Type-safe LRU Cache implementation
class LRUCache {
  private cache: Map<string, any>
  private readonly maxSize: number

  constructor(maxSize: number) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  private isValidKey(key: unknown): key is string {
    return typeof key === 'string' && key.length > 0
  }

  get(key: unknown): any | undefined {
    if (!this.isValidKey(key)) return undefined
    const item = this.cache.get(key)
    if (item !== undefined) {
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: unknown, value: any): void {
    if (!this.isValidKey(key)) return
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = Array.from(this.cache.keys())[0]
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }
}

export class InventoryService {
  private static instance: InventoryService
  private requestQueue: Promise<any>[] = []
  private cache: LRUCache
  private batchSize: number = 100
  private requestCount: number = 0
  private lastRequestTime: number = Date.now()

  private constructor() {
    this.cache = new LRUCache(1000)
    this.requestQueue = []
    console.log('Inventory Service: Square client config:', {
      hasInventoryApi: !!squareClient?.inventoryApi,
      isInitialized: !!squareClient
    })
  }

  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService()
    }
    return InventoryService.instance
  }

  private async processQueue(): Promise<void> {
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()
      if (request) {
        await request
      }
      await this.checkRateLimit()
    }
  }

  private async checkRateLimit() {
    const now = Date.now()
    if (now - this.lastRequestTime < 1000) {
      this.requestCount++
      if (this.requestCount >= RATE_LIMIT.MAX_REQUESTS_PER_SECOND) {
        await delay(RATE_LIMIT.RETRY_AFTER_MS)
        this.requestCount = 0
      }
    } else {
      this.requestCount = 1
    }
    this.lastRequestTime = now
  }

  private serializeResponse(obj: any): any {
    if (!obj) return obj
    try {
      return JSON.parse(JSON.stringify(obj, (_, value) =>
        typeof value === 'bigint' ? Number(value) : value
      ))
    } catch (error) {
      Sentry.captureException(error, {
        extra: { context: 'serializeResponse', objectType: typeof obj }
      })
      return obj
    }
  }

  async retrieveInventoryCounts(items: { catalogItemId: string, variationId: string }[]): Promise<SquareResponse<Map<string, number>>> {
    const cacheKey = `inventory_counts_${items.map(i => i.variationId).join('_')}`
    const cachedData = this.cache.get(cacheKey)
    if (cachedData) {
      return cachedData
    }

    try {
      await this.checkRateLimit()

      if (!squareClient?.inventoryApi) {
        throw new Error('Square Inventory API is not initialized')
      }

      const batches = []
      for (let i = 0; i < items.length; i += this.batchSize) {
        batches.push(items.slice(i, i + this.batchSize))
      }

      const inventoryCounts = new Map<string, number>()

      for (const batch of batches) {
        const { result } = await squareClient.inventoryApi.batchRetrieveInventoryCounts({
          catalogObjectIds: batch.map(item => item.variationId),
          states: [INVENTORY_STATES.IN_STOCK]
        })

        if (result.counts) {
          result.counts.forEach(count => {
            if (count.catalogObjectId) {
              const item = batch.find(i => i.variationId === count.catalogObjectId)
              if (item && count.quantity) {
                inventoryCounts.set(
                  item.catalogItemId,
                  parseInt(count.quantity)
                )
              }
            }
          })
        }

        await this.checkRateLimit()
      }

      const response = { success: true, data: inventoryCounts }
      this.cache.set(cacheKey, response)
      return response

    } catch (error: any) {
      Sentry.captureException(error, {
        extra: { context: 'retrieve_inventory_counts' }
      })
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred',
          details: error
        }
      }
    }
  }

  async adjustInventory(
    variationId: string,
    quantity: number,
    fromState = INVENTORY_STATES.IN_STOCK,
    toState = INVENTORY_STATES.SOLD
  ): Promise<SquareResponse<void>> {
    try {
      await this.checkRateLimit()

      if (!squareClient?.inventoryApi) {
        throw new Error('Square Inventory API is not initialized')
      }

      await squareClient.inventoryApi.batchChangeInventory({
        idempotencyKey: crypto.randomUUID(),
        changes: [{
          type: 'ADJUSTMENT',
          adjustment: {
            catalogObjectId: variationId,
            fromState,
            toState,
            quantity: quantity.toString()
          }
        }]
      })

      this.cache.clear() // Invalidate cache after adjustment
      return { success: true }

    } catch (error: any) {
      Sentry.captureException(error, {
        extra: { context: 'adjust_inventory', variationId }
      })
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred',
          details: error
        }
      }
    }
  }

  async setInventoryLevel(
    variationId: string,
    quantity: number,
    state = INVENTORY_STATES.IN_STOCK
  ): Promise<SquareResponse<void>> {
    try {
      await this.checkRateLimit()

      if (!squareClient?.inventoryApi) {
        throw new Error('Square Inventory API is not initialized')
      }

      const { result } = await squareClient.inventoryApi.retrieveInventoryCount(
        variationId,
        state
      )

      if (!result.counts?.[0]?.quantity) {
        await this.adjustInventory(
          variationId,
          quantity,
          INVENTORY_STATES.NONE,
          state
        )
      } else {
        const currentQuantity = parseInt(result.counts[0].quantity)
        const difference = quantity - currentQuantity

        if (difference !== 0) {
          if (difference > 0) {
            await this.adjustInventory(
              variationId,
              difference,
              INVENTORY_STATES.NONE,
              state
            )
          } else {
            await this.adjustInventory(
              variationId,
              Math.abs(difference),
              state,
              INVENTORY_STATES.WASTE
            )
          }
        }
      }

      this.cache.clear() // Invalidate cache after level change
      return { success: true }

    } catch (error: any) {
      Sentry.captureException(error, {
        extra: { context: 'set_inventory_level', variationId }
      })
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred',
          details: error
        }
      }
    }
  }

  async batchSetInventoryLevels(
    items: { variationId: string; quantity: number }[]
  ): Promise<SquareResponse<void>> {
    try {
      await this.checkRateLimit()

      if (!squareClient?.inventoryApi) {
        throw new Error('Square Inventory API is not initialized')
      }

      const batches = []
      for (let i = 0; i < items.length; i += this.batchSize) {
        batches.push(items.slice(i, i + this.batchSize))
      }

      for (const batch of batches) {
        const changes = batch.map(item => ({
          type: 'PHYSICAL_COUNT',
          physicalCount: {
            catalogObjectId: item.variationId,
            state: INVENTORY_STATES.IN_STOCK,
            quantity: item.quantity.toString(),
            occurredAt: new Date().toISOString()
          }
        }))

        await squareClient.inventoryApi.batchChangeInventory({
          idempotencyKey: crypto.randomUUID(),
          changes
        })

        await this.checkRateLimit()
      }

      this.cache.clear() // Invalidate cache after batch update
      return { success: true }

    } catch (error: any) {
      Sentry.captureException(error, {
        extra: { context: 'batch_set_inventory_levels' }
      })
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred',
          details: error
        }
      }
    }
  }
}

export const inventoryService = InventoryService.getInstance()
