import { NextResponse } from 'next/server'
import { listCatalog, bulkRetrieveVendors, extractCategoryNames, extractImageUrls } from '../axios-client'

interface VendorInfoData {
  vendor_id: string
  sku?: string
}

interface VendorInfo {
  item_variation_vendor_info_data: VendorInfoData
}

interface ItemVariationData {
  item_variation_vendor_infos?: VendorInfo[]
  measurement_unit_id?: string
}

interface ItemVariation {
  id: string
  item_variation_data?: ItemVariationData
}

interface ItemData {
  variations?: ItemVariation[]
  category_ids?: string[]
}

interface CatalogItem {
  id: string
  type: string
  is_deleted: boolean
  item_data?: ItemData
}

export async function GET() {
  try {
    console.log('Starting test request...')
    
    // Get catalog data
    const response = await listCatalog()
    
    // Log raw categories
    const categories = response.objects?.filter(obj => obj.type === 'CATEGORY' && !obj.is_deleted)
    console.log('Raw categories:', categories?.map(c => ({
      id: c.id,
      name: c.category_data?.name
    })))

    // Extract mappings
    const categoryMap = extractCategoryNames(response.objects || [])
    const imageMap = extractImageUrls(response.objects || [])

    // Get vendor IDs and measurement units from items
    const vendorIds = new Set<string>()
    const measurementUnits = new Set<string>()
    const itemCategories = new Map<string, string[]>()

    response.objects?.forEach(item => {
      if (item.type === 'ITEM' && !item.is_deleted) {
        const catalogItem = item as CatalogItem
        
        // Log category IDs for this item
        if (catalogItem.item_data?.category_ids) {
          console.log(`Item ${item.id} categories:`, catalogItem.item_data.category_ids)
          itemCategories.set(item.id, catalogItem.item_data.category_ids)
        }

        const variations = catalogItem.item_data?.variations || []
        variations.forEach(variation => {
          // Check for vendor info
          const vendorInfos = variation?.item_variation_data?.item_variation_vendor_infos
          if (Array.isArray(vendorInfos) && vendorInfos.length > 0) {
            const vendorId = vendorInfos[0]?.item_variation_vendor_info_data?.vendor_id
            if (vendorId) {
              vendorIds.add(vendorId)
              console.log(`Found vendor ID: ${vendorId} for item ${item.id}`)
            }
          }

          // Check for measurement unit
          const measurementUnitId = variation?.item_variation_data?.measurement_unit_id
          if (measurementUnitId) {
            measurementUnits.add(measurementUnitId)
            console.log(`Found measurement unit: ${measurementUnitId} for item ${item.id}`)
          }
        })
      }
    })

    console.log('Found vendor IDs:', Array.from(vendorIds))
    console.log('Found measurement units:', Array.from(measurementUnits))

    // Get vendor names
    const vendorMap = await bulkRetrieveVendors(Array.from(vendorIds))

    // Log all mappings
    console.log('Category mapping:', Object.fromEntries(categoryMap))
    console.log('Vendor mapping:', Object.fromEntries(vendorMap))
    console.log('Image mapping:', Object.fromEntries(imageMap))
    console.log('Item categories:', Object.fromEntries(itemCategories))

    return NextResponse.json({
      success: true,
      data: {
        categories: Object.fromEntries(categoryMap),
        vendors: Object.fromEntries(vendorMap),
        images: Object.fromEntries(imageMap),
        vendorIds: Array.from(vendorIds),
        measurementUnits: Array.from(measurementUnits),
        itemCategories: Object.fromEntries(itemCategories),
        rawCategories: categories,
        rawResponse: response.objects?.filter(obj => obj.type === 'ITEM' && !obj.is_deleted).slice(0, 5) // First 5 items for inspection
      }
    })

  } catch (error: any) {
    console.error('Error in test route:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        message: error.message,
        status: error.response?.status,
        details: error.response?.data
      }
    }, { status: error.response?.status || 500 })
  }
}
