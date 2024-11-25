import { NextResponse } from 'next/server'
import { squareClient } from '../../../../../services/square/config'
import * as Sentry from '@sentry/nextjs'
import { CatalogObject, SearchCatalogItemsRequest, Money } from 'square'

interface ItemVariationVendorInfoData {
  vendor_id: string
  sku?: string
  price_money?: Money
}

interface ItemVariationVendorInfo {
  id?: string
  version?: string
  item_variation_vendor_info_data: ItemVariationVendorInfoData
}

interface CatalogItemVariationData {
  item_id?: string
  name?: string
  sku?: string
  ordinal?: number
  pricing_type?: "FIXED_PRICING" | "VARIABLE_PRICING"
  price_money?: Money
  location_overrides?: Array<{
    location_id: string
    track_inventory?: boolean
    sold_out?: boolean
  }>
  track_inventory?: boolean
  inventory_alert_type?: string
  sellable?: boolean
  stockable?: boolean
  item_variation_vendor_infos?: ItemVariationVendorInfo[]
  measurement_unit_id?: string
}

interface VendorInfo {
  id: string
  name: string
  items: Array<{
    itemId: string
    itemName: string
    sku: string
  }>
}

export async function GET() {
  try {
    if (!squareClient?.catalogApi) {
      throw new Error('Square catalog API is not properly initialized')
    }

    console.log('Fetching catalog items to extract vendor information...')
    const { result } = await squareClient.catalogApi.searchCatalogItems({
      limit: 100,
      includeRelatedObjects: true,
      productTypes: ['REGULAR']
    } as SearchCatalogItemsRequest)

    if (!result.items) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Map to store unique vendors
    const vendorsMap = new Map<string, VendorInfo>()

    // Extract vendor information from items
    result.items.forEach(item => {
      if (item.itemData?.variations) {
        item.itemData.variations.forEach(variation => {
          const variationData = variation.itemVariationData as CatalogItemVariationData
          if (variationData?.item_variation_vendor_infos?.length) {
            variationData.item_variation_vendor_infos.forEach(vendorInfo => {
              const vendorId = vendorInfo.item_variation_vendor_info_data?.vendor_id
              if (vendorId) {
                if (!vendorsMap.has(vendorId)) {
                  vendorsMap.set(vendorId, {
                    id: vendorId,
                    name: `Vendor ${vendorId}`, // Default name if no other info available
                    items: []
                  })
                }
                
                // Add item to vendor's items list
                const currentVendor = vendorsMap.get(vendorId)
                if (currentVendor) {
                  currentVendor.items.push({
                    itemId: item.id,
                    itemName: item.itemData?.name || 'Unknown Item',
                    sku: variationData.sku || 'No SKU'
                  })
                }
              }
            })
          }
        })
      }
    })

    const vendors = Array.from(vendorsMap.values())
    console.log(`Found ${vendors.length} unique vendors`)

    return NextResponse.json({
      success: true,
      data: vendors
    })

  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    Sentry.captureException(error, {
      extra: { context: 'vendors_api_route' }
    })
    return NextResponse.json({ 
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error
      }
    }, { status: 500 })
  }
}
