import { squareClient } from '@/services/square/config'
import { CatalogObject } from 'square'

interface VendorInfoData {
  vendor_id: string
  sku?: string
}

interface VendorInfo {
  item_variation_vendor_info_data: VendorInfoData
}

interface ExtendedItemVariationData {
  item_variation_vendor_infos?: VendorInfo[]
}

interface BatchRetrieveResult {
  success: boolean
  objects?: CatalogObject[]
  error?: {
    code: string
    message: string
  }
}

export async function batchRetrieveCatalogItems(objectIds: string[]): Promise<BatchRetrieveResult> {
  try {
    if (!squareClient?.catalogApi) {
      throw new Error('Square catalog API is not properly initialized')
    }

    // Square has a limit on batch size, so we need to chunk the requests
    const BATCH_SIZE = 100
    const batches = []
    
    for (let i = 0; i < objectIds.length; i += BATCH_SIZE) {
      const batchIds = objectIds.slice(i, i + BATCH_SIZE)
      batches.push(batchIds)
    }

    // Process all batches
    const allObjects: CatalogObject[] = []
    
    for (const batchIds of batches) {
      const { result } = await squareClient.catalogApi.batchRetrieveCatalogObjects({
        objectIds: batchIds,
        includeRelatedObjects: false
      })

      if (result.objects) {
        allObjects.push(...result.objects)
      }
    }

    return {
      success: true,
      objects: allObjects
    }

  } catch (error: any) {
    console.error('Error in batch retrieve:', error)
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unknown error occurred'
      }
    }
  }
}

export function extractVendorIds(objects: CatalogObject[]): Map<string, string> {
  const vendorMap = new Map<string, string>()

  for (const obj of objects) {
    if (obj.type !== 'ITEM' || !obj.itemData?.variations) continue

    for (const variation of obj.itemData.variations) {
      // Type assertion for extended variation data
      const variationData = variation.itemVariationData as ExtendedItemVariationData
      const vendorInfos = variationData?.item_variation_vendor_infos

      if (!Array.isArray(vendorInfos)) continue

      for (const vendorInfo of vendorInfos) {
        const vendorId = vendorInfo?.item_variation_vendor_info_data?.vendor_id
        if (vendorId) {
          vendorMap.set(obj.id, vendorId)
          break // Found a vendor ID for this item, move to next item
        }
      }

      if (vendorMap.has(obj.id)) break // Already found a vendor ID, move to next item
    }
  }

  return vendorMap
}
