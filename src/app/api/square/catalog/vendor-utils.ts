import { CatalogObject } from 'square'
import { VendorExtractResult, VendorInfo, VendorResponseDebug } from './vendor-types'
import { axiosClient } from './axios-client'
import { writeDebugToFile } from './debug-utils'

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

interface Vendor {
  id: string
  name?: string
  status?: string
  created_at?: string
  updated_at?: string
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function bulkRetrieveVendors(vendorIds: string[]): Promise<Map<string, string>> {
  try {
    if (!vendorIds.length) {
      console.log('No vendor IDs to retrieve')
      return new Map()
    }

    console.log(`Attempting to retrieve vendors for IDs:`, vendorIds)

    const vendorMap = new Map<string, string>()
    
    for (const vendorId of vendorIds) {
      try {
        const response = await axiosClient.get<{ vendor?: Vendor }>(`/vendors/${vendorId}`)
        
        const debugInfo: VendorResponseDebug = {
          request: {
            vendor_ids: [vendorId],
            timestamp: new Date().toISOString()
          },
          response: {
            vendors: response.data.vendor ? [{
              ...response.data.vendor,
              retrieved_at: new Date().toISOString()
            }] : undefined
          }
        }
        writeDebugToFile(debugInfo, `vendor-response-${vendorId}`)

        if (response.data.vendor) {
          const name = response.data.vendor.name?.trim()
          vendorMap.set(vendorId, name || vendorId)
        } else {
          console.warn(`No vendor data returned for ID: ${vendorId}`)
          vendorMap.set(vendorId, vendorId)
        }

        await delay(200)

      } catch (error) {
        console.error(`Error retrieving vendor ${vendorId}:`, error)
        vendorMap.set(vendorId, vendorId)
      }
    }

    writeDebugToFile({
      total_requested: vendorIds.length,
      total_retrieved: vendorMap.size,
      vendor_mappings: Array.from(vendorMap.entries()).map(([id, name]) => ({
        id,
        name
      }))
    }, 'vendor-mappings')

    return vendorMap

  } catch (error: unknown) {
    console.error('Error in vendor retrieve:', error)
    const vendorMap = new Map<string, string>()
    vendorIds.forEach(id => vendorMap.set(id, id))
    return vendorMap
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
