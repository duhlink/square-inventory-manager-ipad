import { squareClient, SquareResponse, RATE_LIMIT } from './config'
import { InventoryItem } from '@/app/inventory/types'
import { delay } from '@/lib/utils'

export class CatalogService {
  private static instance: CatalogService
  private requestCount: number = 0
  private lastRequestTime: number = Date.now()

  private constructor() {}

  public static getInstance(): CatalogService {
    if (!CatalogService.instance) {
      CatalogService.instance = new CatalogService()
    }
    return CatalogService.instance
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

  async listCatalogItems(): Promise<SquareResponse<InventoryItem[]>> {
    try {
      await this.checkRateLimit()

      const { result } = await squareClient.catalogApi.listCatalog(
        undefined,
        'ITEM'
      )

      if (!result.objects) {
        return { success: true, data: [] }
      }

      const items: InventoryItem[] = result.objects.map(obj => ({
        id: obj.id!,
        squareId: obj.id,
        name: obj.itemData!.name!,
        sku: obj.itemData!.variations?.[0]?.itemVariationData?.sku || '',
        category: obj.itemData!.category?.id || '',
        price: obj.itemData!.variations?.[0]?.itemVariationData?.priceMoney?.amount! / 100,
        cost: 0, // Need to fetch from custom attribute or separate tracking
        quantity: 0, // Need to fetch from inventory API
        reorderPoint: 0, // Need to fetch from custom attribute
        vendor: '', // Need to fetch from custom attribute
        status: 'in_stock', // Need to determine based on quantity
        lastUpdated: obj.updatedAt || obj.createdAt!,
        updatedBy: 'system',
        squareCatalogVersion: obj.version,
        squareUpdatedAt: obj.updatedAt,
        variations: obj.itemData!.variations?.map(variation => ({
          id: variation.id!,
          name: variation.itemVariationData!.name!,
          sku: variation.itemVariationData!.sku!,
          price: variation.itemVariationData!.priceMoney!.amount! / 100,
          cost: 0,
          quantity: 0
        }))
      }))

      return { success: true, data: items }
    } catch (error: any) {
      console.error('Error listing catalog items:', error)
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

  async createCatalogItem(item: Partial<InventoryItem>): Promise<SquareResponse<InventoryItem>> {
    try {
      await this.checkRateLimit()

      const { result } = await squareClient.catalogApi.upsertCatalogObject({
        idempotencyKey: crypto.randomUUID(),
        object: {
          type: 'ITEM',
          id: '#' + item.name?.toLowerCase().replace(/\s+/g, '_'),
          itemData: {
            name: item.name,
            description: '',
            categoryId: item.category,
            variations: [
              {
                type: 'ITEM_VARIATION',
                id: '#' + item.name?.toLowerCase().replace(/\s+/g, '_') + '_variation',
                itemVariationData: {
                  name: 'Regular',
                  sku: item.sku,
                  priceMoney: {
                    amount: BigInt(Math.round(item.price! * 100)),
                    currency: 'USD'
                  }
                }
              }
            ]
          }
        }
      })

      if (!result.catalog_object) {
        throw new Error('Failed to create catalog item')
      }

      const newItem: InventoryItem = {
        id: result.catalog_object.id!,
        squareId: result.catalog_object.id,
        name: result.catalog_object.itemData!.name!,
        sku: result.catalog_object.itemData!.variations?.[0]?.itemVariationData?.sku || '',
        category: result.catalog_object.itemData!.category?.id || '',
        price: result.catalog_object.itemData!.variations?.[0]?.itemVariationData?.priceMoney?.amount! / 100,
        cost: item.cost || 0,
        quantity: 0,
        reorderPoint: item.reorderPoint || 0,
        vendor: item.vendor || '',
        status: 'in_stock',
        lastUpdated: result.catalog_object.updatedAt || result.catalog_object.createdAt!,
        updatedBy: 'system',
        squareCatalogVersion: result.catalog_object.version,
        squareUpdatedAt: result.catalog_object.updatedAt
      }

      return { success: true, data: newItem }
    } catch (error: any) {
      console.error('Error creating catalog item:', error)
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

  async updateCatalogItem(item: InventoryItem): Promise<SquareResponse<InventoryItem>> {
    try {
      await this.checkRateLimit()

      const { result } = await squareClient.catalogApi.upsertCatalogObject({
        idempotencyKey: crypto.randomUUID(),
        object: {
          type: 'ITEM',
          id: item.squareId,
          version: item.squareCatalogVersion,
          itemData: {
            name: item.name,
            description: '',
            categoryId: item.category,
            variations: [
              {
                type: 'ITEM_VARIATION',
                id: item.variations?.[0]?.id,
                itemVariationData: {
                  name: 'Regular',
                  sku: item.sku,
                  priceMoney: {
                    amount: BigInt(Math.round(item.price * 100)),
                    currency: 'USD'
                  }
                }
              }
            ]
          }
        }
      })

      if (!result.catalog_object) {
        throw new Error('Failed to update catalog item')
      }

      const updatedItem: InventoryItem = {
        ...item,
        squareCatalogVersion: result.catalog_object.version,
        squareUpdatedAt: result.catalog_object.updatedAt,
        lastUpdated: result.catalog_object.updatedAt!
      }

      return { success: true, data: updatedItem }
    } catch (error: any) {
      console.error('Error updating catalog item:', error)
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

  async deleteCatalogItem(itemId: string): Promise<SquareResponse<void>> {
    try {
      await this.checkRateLimit()

      await squareClient.catalogApi.deleteCatalogObject(itemId)

      return { success: true }
    } catch (error: any) {
      console.error('Error deleting catalog item:', error)
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

export const catalogService = CatalogService.getInstance()