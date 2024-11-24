import { squareClient, SquareResponse, RATE_LIMIT, INVENTORY_STATES } from './config'
import { delay } from '@/lib/utils'

export class InventoryService {
  private static instance: InventoryService
  private requestCount: number = 0
  private lastRequestTime: number = Date.now()

  private constructor() {}

  public static getInstance(): InventoryService {
    if (!InventoryService.instance) {
      InventoryService.instance = new InventoryService()
    }
    return InventoryService.instance
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

  async retrieveInventoryCounts(catalogItemIds: string[]): Promise<SquareResponse<Map<string, number>>> {
    try {
      await this.checkRateLimit()

      const { result } = await squareClient.inventoryApi.batchRetrieveInventoryCounts({
        catalogObjectIds: catalogItemIds,
        states: [INVENTORY_STATES.IN_STOCK]
      })

      if (!result.counts) {
        return { success: true, data: new Map() }
      }

      const inventoryCounts = new Map<string, number>()
      
      result.counts.forEach(count => {
        if (count.catalogObjectId && count.quantity) {
          inventoryCounts.set(
            count.catalogObjectId,
            parseInt(count.quantity)
          )
        }
      })

      return { success: true, data: inventoryCounts }
    } catch (error: any) {
      console.error('Error retrieving inventory counts:', error)
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
    catalogItemId: string,
    quantity: number,
    fromState = INVENTORY_STATES.IN_STOCK,
    toState = INVENTORY_STATES.SOLD
  ): Promise<SquareResponse<void>> {
    try {
      await this.checkRateLimit()

      await squareClient.inventoryApi.batchChangeInventory({
        idempotencyKey: crypto.randomUUID(),
        changes: [
          {
            type: 'ADJUSTMENT',
            adjustment: {
              catalogObjectId: catalogItemId,
              fromState,
              toState,
              quantity: quantity.toString()
            }
          }
        ]
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error adjusting inventory:', error)
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
    catalogItemId: string,
    quantity: number,
    state = INVENTORY_STATES.IN_STOCK
  ): Promise<SquareResponse<void>> {
    try {
      await this.checkRateLimit()

      // First, get the current inventory level
      const { result } = await squareClient.inventoryApi.retrieveInventoryCount(
        catalogItemId,
        state
      )

      if (!result.counts?.[0]?.quantity) {
        // If no current inventory, set it directly
        await this.adjustInventory(
          catalogItemId,
          quantity,
          INVENTORY_STATES.NONE,
          state
        )
      } else {
        const currentQuantity = parseInt(result.counts[0].quantity)
        const difference = quantity - currentQuantity

        if (difference !== 0) {
          if (difference > 0) {
            // Add inventory
            await this.adjustInventory(
              catalogItemId,
              difference,
              INVENTORY_STATES.NONE,
              state
            )
          } else {
            // Remove inventory
            await this.adjustInventory(
              catalogItemId,
              Math.abs(difference),
              state,
              INVENTORY_STATES.WASTE
            )
          }
        }
      }

      return { success: true }
    } catch (error: any) {
      console.error('Error setting inventory level:', error)
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
    items: { catalogItemId: string; quantity: number }[]
  ): Promise<SquareResponse<void>> {
    try {
      await this.checkRateLimit()

      const changes = items.map(item => ({
        type: 'PHYSICAL_COUNT',
        physicalCount: {
          catalogObjectId: item.catalogItemId,
          state: INVENTORY_STATES.IN_STOCK,
          quantity: item.quantity.toString(),
          occurredAt: new Date().toISOString()
        }
      }))

      await squareClient.inventoryApi.batchChangeInventory({
        idempotencyKey: crypto.randomUUID(),
        changes
      })

      return { success: true }
    } catch (error: any) {
      console.error('Error batch setting inventory levels:', error)
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