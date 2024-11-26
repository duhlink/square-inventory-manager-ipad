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

interface VendorDetail {
  variation_id: string
  variation_name?: string
  variation_sku?: string
  vendor_id?: string
  vendor_sku?: string
}

interface ItemVendorDetail {
  item_id: string
  item_name?: string
  vendor_id: string
  variations: Array<{
    variation_id: string
    variation_name?: string
    variation_sku?: string
    vendor_sku?: string
  }>
}

// Helper function to write debug data with limits
const writeDebugToFile = (data: any, prefix: string) => {
  try {
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }

    // Truncate data to 300 lines
    const dataString = JSON.stringify(data, null, 2)
    const lines = dataString.split('\n')
    const truncatedData = lines.slice(0, 300).join('\n')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = path.join(debugDir, `${prefix}-${timestamp}.json`)
    fs.writeFileSync(filePath, truncatedData)

    // Get all debug files and group by prefix
    const files = fs.readdirSync(debugDir)
    const filesByPrefix = new Map<string, string[]>()
    
    files.forEach(file => {
      const filePrefix = file.split('-')[0]
      if (!filesByPrefix.has(filePrefix)) {
        filesByPrefix.set(filePrefix, [])
      }
      filesByPrefix.get(filePrefix)?.push(file)
    })

    // Keep only the most recent file per prefix
    filesByPrefix.forEach((prefixFiles, filePrefix) => {
      const sortedFiles = prefixFiles.sort((a, b) => {
        const timeA = fs.statSync(path.join(debugDir, a)).mtime.getTime()
        const timeB = fs.statSync(path.join(debugDir, b)).mtime.getTime()
        return timeB - timeA
      })

      // Remove all but the most recent file for this prefix
      sortedFiles.slice(1).forEach(file => {
        try {
          fs.unlinkSync(path.join(debugDir, file))
        } catch (error) {
          console.error(`Error removing old debug file ${file}:`, error)
        }
      })
    })

    // Keep only 10 most recent files total
    const allFiles = fs.readdirSync(debugDir)
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(debugDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)

    allFiles.slice(10).forEach(file => {
      try {
        fs.unlinkSync(path.join(debugDir, file.name))
      } catch (error) {
        console.error(`Error removing old debug file ${file.name}:`, error)
      }
    })

  } catch (error) {
    console.error(`Error writing debug file for ${prefix}:`, error)
  }
}

export function extractVendorId(itemData: ItemData): string | undefined {
  try {
    const variations = itemData?.variations || []
    const vendorDetails: VendorDetail[] = []

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
  const vendorDetails: ItemVendorDetail[] = []
  
  activeItems.forEach(item => {
    const vendorId = extractVendorId(item.itemData as ItemData)
    if (vendorId) {
      itemVendorMap.set(item.id, vendorId)
      
      // Collect detailed vendor information
      const variations = (item.itemData as ItemData)?.variations || []
      const itemVendorDetail: ItemVendorDetail = {
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
