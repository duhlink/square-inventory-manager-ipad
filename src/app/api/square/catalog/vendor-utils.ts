import { CatalogObject } from 'square'
import { VendorExtractResult, VendorInfo } from './vendor-types'
import fs from 'fs'
import path from 'path'

interface ExtendedItemVariationData {
  item_variation_vendor_infos?: VendorInfo[]
  name?: string
  sku?: string
}

interface ItemData {
  variations?: Array<{
    id: string
    itemVariationData?: ExtendedItemVariationData
  }>
  name?: string
}

// Helper function to write debug data
const writeDebugToFile = (data: any, prefix: string) => {
  try {
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = path.join(debugDir, `${prefix}-${timestamp}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Error writing debug file for ${prefix}:`, error)
  }
}

export function extractVendorId(itemData: ItemData): string | undefined {
  try {
    const variations = itemData?.variations || []
    const vendorDetails: Array<{
      variation_id: string
      variation_name?: string
      variation_sku?: string
      vendor_id?: string
      vendor_sku?: string
    }> = []

    for (const variation of variations) {
      const variationData = variation?.itemVariationData as ExtendedItemVariationData
      const vendorInfos = variationData?.item_variation_vendor_infos

      if (Array.isArray(vendorInfos) && vendorInfos.length > 0) {
        const vendorInfo = vendorInfos[0]?.item_variation_vendor_info_data
        vendorDetails.push({
          variation_id: variation.id,
          variation_name: variationData?.name,
          variation_sku: variationData?.sku,
          vendor_id: vendorInfo?.vendor_id,
          vendor_sku: vendorInfo?.sku
        })

        if (vendorInfo?.vendor_id) {
          // Log detailed vendor information
          writeDebugToFile({
            item_name: itemData.name,
            variation_details: vendorDetails
          }, 'vendor-extraction')
          
          return vendorInfo.vendor_id
        }
      }
    }
    return undefined
  } catch (error) {
    console.error('Error extracting vendor ID:', error)
    return undefined
  }
}

export function processVendorData(activeItems: CatalogObject[]): VendorExtractResult {
  const itemVendorMap = new Map<string, string>()
  const vendorDetails: Array<{
    item_id: string
    item_name?: string
    vendor_id: string
    variations: Array<{
      variation_id: string
      variation_name?: string
      variation_sku?: string
      vendor_sku?: string
    }>
  }> = []
  
  activeItems.forEach(item => {
    const vendorId = extractVendorId(item.itemData as ItemData)
    if (vendorId) {
      itemVendorMap.set(item.id, vendorId)
      
      // Collect detailed vendor information
      const variations = (item.itemData as ItemData)?.variations || []
      const itemVendorDetail = {
        item_id: item.id,
        item_name: (item.itemData as ItemData)?.name,
        vendor_id: vendorId,
        variations: variations.map(variation => ({
          variation_id: variation.id,
          variation_name: variation.itemVariationData?.name,
          variation_sku: variation.itemVariationData?.sku,
          vendor_sku: variation.itemVariationData?.item_variation_vendor_infos?.[0]?.item_variation_vendor_info_data?.sku
        }))
      }
      vendorDetails.push(itemVendorDetail)
    }
  })

  const vendorIds = new Set<string>(Array.from(itemVendorMap.values()))
  
  // Log processed vendor data
  writeDebugToFile({
    total_items: activeItems.length,
    items_with_vendors: itemVendorMap.size,
    unique_vendors: vendorIds.size,
    vendor_details: vendorDetails
  }, 'vendor-processing')

  return {
    itemVendorMap,
    vendorIds
  }
}
