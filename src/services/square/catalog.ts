import { squareClient, SquareResponse, CATALOG_TYPES } from './config'
import { InventoryItem, ItemVariation } from '@/app/inventory/types'
import * as Sentry from '@sentry/nextjs'
import { CatalogObject } from 'square'

export class CatalogService {
  private static instance: CatalogService

  private constructor() {
    console.log('Square client config:', {
      hasCatalogApi: !!squareClient.catalogApi,
      isInitialized: !!squareClient
    })
  }

  public static getInstance(): CatalogService {
    if (!CatalogService.instance) {
      CatalogService.instance = new CatalogService()
    }
    return CatalogService.instance
  }

  private mapToInventoryItem(obj: CatalogObject, categoryName: string): InventoryItem | null {
    if (!obj?.itemData) return null
    
    try {
      const customAttributes = obj.customAttributeValues || {}
      const variation = obj.itemData.variations?.[0]?.itemVariationData
      const priceAmount = variation?.priceMoney?.amount
      const price = priceAmount ? Number(priceAmount) / 100 : 0

      // Extract custom attributes
      const vendorCode = customAttributes?.vendor_code?.stringValue || ''
      const vendorName = customAttributes?.vendor_name?.stringValue || 'Default Vendor'
      const unitType = customAttributes?.unit_type?.stringValue || 'per item'
      const unitCost = Number(customAttributes?.unit_cost?.numberValue) || 0

      // Extract categories from both custom attributes and category_id
      const customCategories = customAttributes?.categories?.stringValue?.split(',').filter(Boolean) || []
      const defaultCategory = categoryName ? [categoryName] : []
      const categoriesSet = new Set([...defaultCategory, ...customCategories])
      const categories = Array.from(categoriesSet)
      
      // Map variations with extended data
      const variations: ItemVariation[] = obj.itemData.variations?.map(v => {
        const variationPrice = v.itemVariationData?.priceMoney?.amount
          ? Number(v.itemVariationData.priceMoney.amount) / 100
          : 0
        const variationCustomAttrs = v.customAttributeValues || {}
        const gtinValue = variationCustomAttrs?.gtin?.stringValue
        
        return {
          id: v.id,
          name: v.itemVariationData?.name || '',
          sku: v.itemVariationData?.sku || '',
          gtin: gtinValue || undefined,
          price: variationPrice,
          cost: Number(variationCustomAttrs?.cost?.numberValue) || variationPrice * 0.5,
          quantity: 0,
          weight: variationCustomAttrs?.weight?.numberValue ? {
            value: Number(variationCustomAttrs.weight.numberValue),
            unit: (variationCustomAttrs?.weight_unit?.stringValue as 'oz' | 'lb' | 'g' | 'kg') || 'lb'
          } : undefined
        }
      }) || []

      const cost = Number(customAttributes?.cost?.numberValue) || price * 0.5

      // Log category information for debugging
      console.log('Category mapping:', {
        itemId: obj.id,
        categoryId: obj.itemData.categoryId,
        categoryName,
        customCategories,
        finalCategories: categories
      })

      return {
        id: obj.id,
        name: obj.itemData.name || 'Unnamed Item',
        description: obj.itemData.description || '',
        sku: variation?.sku || '',
        category: categoryName,
        categories,
        price,
        cost,
        quantity: 0,
        reorderPoint: Number(customAttributes?.reorder_point?.numberValue) || 5,
        vendor: vendorName,
        vendorCode,
        vendorName,
        unitType,
        unitCost,
        status: 'in_stock',
        lastUpdated: obj.updatedAt || new Date().toISOString(),
        updatedBy: 'system',
        squareId: obj.id,
        squareCatalogVersion: Number(obj.version || 0),
        squareUpdatedAt: obj.updatedAt,
        variations
      }
    } catch (err) {
      console.error('Error mapping catalog item:', err)
      Sentry.captureException(err, {
        extra: { context: 'mapping_catalog_item', objectId: obj.id }
      })
      return null
    }
  }

  async updateCatalogItem(item: InventoryItem): Promise<SquareResponse<InventoryItem>> {
    try {
      if (!squareClient.catalogApi) {
        throw new Error('Square client not properly initialized')
      }

      console.log('Updating catalog item:', {
        id: item.id,
        name: item.name,
        categories: item.categories
      })

      // Prepare custom attributes as Record<string, CatalogCustomAttributeValue>
      const customAttributes: Record<string, any> = {
        vendor_code: { stringValue: item.vendorCode },
        vendor_name: { stringValue: item.vendorName },
        unit_type: { stringValue: item.unitType },
        unit_cost: { numberValue: item.unitCost.toString() },
        categories: { stringValue: item.categories.join(',') },
        cost: { numberValue: item.cost.toString() },
        reorder_point: { numberValue: item.reorderPoint.toString() }
      }

      const variations: CatalogObject[] = (item.variations || []).map(v => ({
        type: CATALOG_TYPES.ITEM_VARIATION,
        id: v.id,
        customAttributeValues: {
          gtin: { stringValue: v.gtin || '' },
          cost: { numberValue: v.cost.toString() },
          ...(v.weight && {
            weight: { numberValue: v.weight.value.toString() },
            weight_unit: { stringValue: v.weight.unit }
          })
        },
        itemVariationData: {
          name: v.name,
          sku: v.sku,
          priceMoney: {
            amount: BigInt(Math.round(v.price * 100)),
            currency: 'USD'
          }
        }
      }))

      if (variations.length === 0) {
        variations.push({
          type: CATALOG_TYPES.ITEM_VARIATION,
          id: item.id + '_variation',
          itemVariationData: {
            name: 'Regular',
            sku: item.sku,
            priceMoney: {
              amount: BigInt(Math.round(item.price * 100)),
              currency: 'USD'
            }
          }
        })
      }

      const { result } = await squareClient.catalogApi.batchUpsertCatalogObjects({
        idempotencyKey: crypto.randomUUID(),
        batches: [{
          objects: [{
            type: CATALOG_TYPES.ITEM,
            id: item.squareId!,
            version: BigInt(item.squareCatalogVersion || 0),
            customAttributeValues: customAttributes,
            itemData: {
              name: item.name,
              description: item.description || '',
              categoryId: item.category,
              variations
            }
          }]
        }]
      })

      if (!result.objects?.[0]) {
        throw new Error('Failed to update catalog item')
      }

      const updatedItem = this.mapToInventoryItem(result.objects[0], item.category)
      if (!updatedItem) {
        throw new Error('Failed to map updated catalog item')
      }

      console.log('Catalog item updated successfully:', {
        id: updatedItem.id,
        categories: updatedItem.categories
      })

      return { success: true, data: updatedItem }

    } catch (error: any) {
      console.error('Error updating catalog item:', error)
      Sentry.captureException(error, {
        extra: { context: 'update_catalog_item' }
      })
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unexpected error occurred',
          details: error
        }
      }
    }
  }
}

export const catalogService = CatalogService.getInstance()
