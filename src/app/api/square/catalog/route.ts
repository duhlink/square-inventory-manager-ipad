import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { listCatalog, bulkRetrieveVendors, extractCategoryNames, extractImageUrls, extractMeasurementUnits } from './axios-client'
import fs from 'fs'
import path from 'path'

interface Money {
  amount?: number
  currency?: string
}

interface VendorInfoData {
  vendor_id: string
  sku?: string
}

interface VendorInfo {
  item_variation_vendor_info_data: VendorInfoData
}

interface ItemVariationData {
  name?: string
  sku?: string
  price_money?: Money
  measurement_unit_id?: string
  stockable?: boolean
  inventory_alert_threshold?: number
  item_variation_vendor_infos?: VendorInfo[]
}

interface ItemVariation {
  id: string
  item_variation_data: ItemVariationData
}

interface CatalogItem {
  id: string
  type: string
  version?: number
  is_deleted: boolean
  updated_at?: string
  item_data?: {
    name: string
    description?: string
    variations?: ItemVariation[]
    category_ids?: string[]
    image_ids?: string[]
    is_taxable?: boolean
    available_online?: boolean
    available_for_pickup?: boolean
  }
}

// Helper function to write debug data to file
const writeDebugToFile = (data: any, filename: string) => {
  try {
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }
    const filePath = path.join(debugDir, filename)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    console.log(`Debug data written to ${filePath}`)
  } catch (error) {
    console.error('Error writing debug file:', error)
  }
}

// Helper function to safely handle money amounts
const safeMoneyToNumber = (money: Money | undefined | null): number => {
  if (!money?.amount) return 0
  return Number(money.amount) / 100
}

// Helper function to extract vendor ID from item data
function extractVendorId(item: CatalogItem): string | undefined {
  try {
    const variations = item.item_data?.variations || []
    for (const variation of variations) {
      const vendorInfos = variation.item_variation_data?.item_variation_vendor_infos
      if (Array.isArray(vendorInfos) && vendorInfos.length > 0) {
        const vendorInfo = vendorInfos[0]?.item_variation_vendor_info_data
        if (vendorInfo?.vendor_id) {
          // Log vendor information to debug file
          writeDebugToFile({
            item_id: item.id,
            item_name: item.item_data?.name,
            variation_id: variation.id,
            vendor_info: vendorInfo
          }, `vendor-info-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
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

export async function GET() {
  try {
    console.log('Starting catalog request...')
    
    // Get catalog data using axios client
    const response = await listCatalog()
    
    // Write raw response to debug file
    writeDebugToFile(
      response,
      `catalog-response-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    )

    // Extract category names, image URLs, and measurement units
    const categoryMap = extractCategoryNames(response.objects || [])
    const imageMap = extractImageUrls(response.objects || [])
    const measurementUnitMap = extractMeasurementUnits(response.objects || [])

    // Process items and extract vendor IDs
    const items = response.objects || []
    const activeItems = items.filter(item => 
      item.type === 'ITEM' && !item.is_deleted
    ) as CatalogItem[]

    console.log(`Found ${activeItems.length} active items`)

    // Collect all vendor IDs and log vendor information
    const vendorIds = new Set<string>()
    const vendorInfos: any[] = []
    activeItems.forEach(item => {
      const variations = item.item_data?.variations || []
      variations.forEach(variation => {
        const vendorInfo = variation.item_variation_data?.item_variation_vendor_infos?.[0]
        if (vendorInfo?.item_variation_vendor_info_data?.vendor_id) {
          vendorIds.add(vendorInfo.item_variation_vendor_info_data.vendor_id)
          vendorInfos.push({
            item_id: item.id,
            item_name: item.item_data?.name,
            variation_id: variation.id,
            vendor_info: vendorInfo.item_variation_vendor_info_data
          })
        }
      })
    })

    // Write all vendor information to debug file
    writeDebugToFile(
      vendorInfos,
      `vendor-infos-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    )

    // Get vendor names
    const vendorMap = await bulkRetrieveVendors(Array.from(vendorIds))

    // Write mappings to debug file
    writeDebugToFile(
      {
        categories: Object.fromEntries(categoryMap),
        vendors: Object.fromEntries(vendorMap),
        images: Object.fromEntries(imageMap),
        measurementUnits: Object.fromEntries(measurementUnitMap)
      },
      `mappings-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    )

    // Map items to the expected format
    const mappedItems = activeItems.map(item => {
      const variations = item.item_data?.variations || []
      const firstVariation = variations[0]
      const vendorId = extractVendorId(item)
      
      // Get vendor name with validation
      let vendorName = vendorId || 'No Vendor' // Default to vendor ID if name not found
      if (vendorId && vendorMap.has(vendorId)) {
        const name = vendorMap.get(vendorId)
        if (name && name.trim()) {
          vendorName = name
        } else {
          console.warn(`No vendor name found for ID: ${vendorId}`)
        }
      }

      // Get category names with validation
      const categoryIds = item.item_data?.category_ids || []
      const categories = categoryIds.map(id => {
        const categoryName = categoryMap.get(id)
        if (!categoryName || !categoryName.trim()) {
          console.warn(`No category name found for ID: ${id}`)
          return id // Return category ID if name not found
        }
        return categoryName
      })

      // If no valid categories found, provide empty array
      if (categories.length === 0) {
        console.warn(`No categories found for item: ${item.id}`)
      }

      // Get image URL
      const imageId = item.item_data?.image_ids?.[0]
      const imageUrl = imageId ? imageMap.get(imageId) : undefined

      // Map variations with validation
      const mappedVariations = variations.map(variation => {
        const measurementUnitId = variation.item_variation_data?.measurement_unit_id
        const measurementUnit = measurementUnitId ? 
          measurementUnitMap.get(measurementUnitId) || 'unit' : 
          'unit'

        // Get vendor info for this variation
        const variationVendorInfo = variation.item_variation_data?.item_variation_vendor_infos?.[0]
        const variationVendorId = variationVendorInfo?.item_variation_vendor_info_data?.vendor_id
        let variationVendorName = variationVendorId || 'No Vendor'
        if (variationVendorId && vendorMap.has(variationVendorId)) {
          const name = vendorMap.get(variationVendorId)
          if (name && name.trim()) {
            variationVendorName = name
          }
        }

        return {
          id: variation.id,
          name: variation.item_variation_data?.name || '',
          sku: variation.item_variation_data?.sku || '',
          price: safeMoneyToNumber(variation.item_variation_data?.price_money),
          cost: 0,
          measurementUnit,
          vendorSku: variationVendorId ? `${variationVendorId}-${variation.item_variation_data?.sku}` : undefined,
          vendorId: variationVendorId || '',
          vendorName: variationVendorName,
          stockable: variation.item_variation_data?.stockable ?? false,
          quantity: 0 // Will be populated from inventory
        }
      })

      return {
        id: item.id,
        name: item.item_data?.name || '',
        description: item.item_data?.description || '',
        sku: firstVariation?.item_variation_data?.sku || '',
        categories,
        categoryIds,
        price: safeMoneyToNumber(firstVariation?.item_variation_data?.price_money),
        unitCost: 0,
        quantity: 0, // Will be populated from inventory
        reorderPoint: Number(firstVariation?.item_variation_data?.inventory_alert_threshold || 0),
        vendorId: vendorId || '',
        vendorName,
        vendorCode: vendorId || '',
        unitType: firstVariation?.item_variation_data?.measurement_unit_id ? 
          measurementUnitMap.get(firstVariation.item_variation_data.measurement_unit_id) || 'unit' :
          'unit',
        measurementUnitId: firstVariation?.item_variation_data?.measurement_unit_id || '',
        lastUpdated: item.updated_at || new Date().toISOString(),
        updatedBy: 'system',
        squareId: item.id,
        squareCatalogVersion: Number(item.version || 0),
        squareUpdatedAt: item.updated_at || '',
        variations: mappedVariations,
        isTaxable: item.item_data?.is_taxable ?? false,
        visibility: item.item_data?.available_online 
          ? item.item_data?.available_for_pickup 
            ? 'PUBLIC'
            : 'PICKUP_ONLY'
          : 'PRIVATE',
        trackInventory: variations.some(v => v.item_variation_data?.stockable),
        imageUrl,
        imageId
      }
    })

    return NextResponse.json({
      success: true,
      data: mappedItems
    })

  } catch (error: any) {
    console.error('Error fetching catalog:', error)
    Sentry.captureException(error, {
      extra: { context: 'catalog_api_route' }
    })
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
