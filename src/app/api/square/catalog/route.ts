import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { listCatalog, retrieveCategories, listLocations } from './axios-client'
import { bulkRetrieveVendors } from './vendor-utils'
import { 
  extractImageUrls, 
  extractMeasurementUnits,
  createVariationOptions,
  VariationOption
} from './transform-utils'
import { CatalogItem, ItemVariation } from './types'
import {
  writeDebugToFile,
  safeMoneyToNumber,
  extractVendorId,
  extractCategoryIds,
  getCategoryNames,
  createCategoryOptions,
  mapVariations,
  getVendorName
} from './utils'
import { inventoryService } from '@/services/square/inventory'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('Starting catalog request...')
    
    // Get locations first
    const locationMap = await listLocations()
    console.log(`Found ${locationMap.size} active locations`)

    const response = await listCatalog()
    
    const imageMap = extractImageUrls(response.objects || [])
    const measurementUnitMap = extractMeasurementUnits(response.objects || [])

    const items = response.objects || []
    const activeItems = items.filter(item => 
      item.type === 'ITEM' && !item.is_deleted
    ) as CatalogItem[]

    console.log(`Found ${activeItems.length} active items`)

    const vendorIds = new Set<string>()
    const categoryIds = new Set<string>()
    const itemCategoryMap = new Map<string, string[]>()
    const itemVariations: { catalogItemId: string, variationId: string }[] = []
    const variationOptionsMap = new Map<string, VariationOption[]>()
    
    activeItems.forEach(item => {
      const itemCategoryIds = extractCategoryIds(item)
      itemCategoryIds.forEach(id => categoryIds.add(id))
      if (itemCategoryIds.length > 0) {
        itemCategoryMap.set(item.id, itemCategoryIds)
      }

      const variations = item.item_data?.variations || []
      // Create variation options for each item
      if (variations.length > 0) {
        variationOptionsMap.set(item.id, createVariationOptions(variations))
      }

      variations.forEach((variation: ItemVariation) => {
        if (variation.id) {
          itemVariations.push({
            catalogItemId: item.id,
            variationId: variation.id
          })
        }
        const vendorInfo = variation.item_variation_data?.item_variation_vendor_infos?.[0]
        if (vendorInfo?.item_variation_vendor_info_data?.vendor_id) {
          vendorIds.add(vendorInfo.item_variation_vendor_info_data.vendor_id)
        }
      })
    })

    console.log(`Fetching inventory for ${itemVariations.length} variations`)
    writeDebugToFile({
      variation_sample: itemVariations.slice(0, 5)
    }, 'variations-to-fetch')

    const [vendorMap, categoryMap, inventoryResponse] = await Promise.all([
      bulkRetrieveVendors(Array.from(vendorIds)),
      retrieveCategories(Array.from(categoryIds)),
      inventoryService.retrieveInventoryCounts(itemVariations)
    ])

    writeDebugToFile({
      inventory_response: {
        success: inventoryResponse.success,
        data_size: inventoryResponse.data instanceof Map ? inventoryResponse.data.size : 0,
        sample: inventoryResponse.data instanceof Map ? 
          Array.from(inventoryResponse.data.entries()).slice(0, 5) : 
          'Not a Map'
      }
    }, 'inventory-response')

    const inventoryCounts = new Map<string, number>()
    if (inventoryResponse.success && inventoryResponse.data instanceof Map) {
      inventoryResponse.data.forEach((value, key) => {
        inventoryCounts.set(key, value)
      })
    }

    console.log(`Retrieved ${inventoryCounts.size} inventory counts`)
    writeDebugToFile({
      inventory_counts: {
        total: inventoryCounts.size,
        sample: Array.from(inventoryCounts.entries()).slice(0, 5)
      }
    }, 'processed-inventory')

    const allCategories = createCategoryOptions(categoryMap)

    const mappedItems = activeItems.map(item => {
      const variations = item.item_data?.variations || []
      const vendorId = extractVendorId(item)
      const vendorName = getVendorName(vendorId, vendorMap)
      const categoryIds = extractCategoryIds(item)
      const categoryNames = getCategoryNames(categoryIds, categoryMap)
      const imageId = item.item_data?.image_ids?.[0]
      const imageUrl = imageId ? imageMap.get(imageId) : undefined
      const variationOptions = variationOptionsMap.get(item.id) || []

      // Calculate total quantity across all variations
      const quantity = variations.reduce((total, variation) => {
        return total + (inventoryCounts.get(variation.id || '') || 0)
      }, 0)

      const firstVariation = variations[0]
      const variationData = firstVariation?.item_variation_data

      return {
        id: item.id,
        variationId: firstVariation?.id,
        name: item.item_data?.name || '',
        variationName: variationData?.name || '',
        description: item.item_data?.description || '',
        sku: variationData?.sku || '',
        categories: categoryNames,
        categoryIds,
        variations: variationOptions,
        price: safeMoneyToNumber(variationData?.price_money),
        unitCost: safeMoneyToNumber(variationData?.default_unit_cost),
        ordinal: variationData?.ordinal || 0,
        trackInventory: variationData?.track_inventory ?? false,
        sellable: variationData?.sellable ?? false,
        stockable: variationData?.stockable ?? false,
        defaultUnitCost: safeMoneyToNumber(variationData?.default_unit_cost),
        reorderPoint: Number(variationData?.inventory_alert_threshold || 0),
        vendorId: vendorId || '',
        vendorName,
        vendorCode: vendorId || '',
        unitType: variationData?.measurement_unit_id ? 
          measurementUnitMap.get(variationData.measurement_unit_id) || 'unit' :
          'unit',
        measurementUnitId: variationData?.measurement_unit_id || '',
        lastUpdated: item.updated_at || new Date().toISOString(),
        updatedBy: 'system',
        squareId: item.id,
        squareCatalogVersion: Number(item.version || 0),
        squareUpdatedAt: item.updated_at || '',
        isTaxable: item.item_data?.is_taxable ?? false,
        visibility: item.item_data?.available_online 
          ? item.item_data?.available_for_pickup 
            ? 'PUBLIC'
            : 'PICKUP_ONLY'
          : 'PRIVATE',
        presentAtAllLocations: item.present_at_all_locations,
        presentAtLocationIds: item.present_at_location_ids || [],
        imageUrl,
        imageId,
        quantity
      }
    })

    writeDebugToFile({
      total_items: mappedItems.length,
      items_sample: mappedItems.slice(0, 5).map(item => ({
        id: item.id,
        name: item.name,
        variations: item.variations.length,
        quantity: item.quantity
      }))
    }, 'mapped-items')

    return NextResponse.json({
      success: true,
      data: mappedItems,
      categories: allCategories,
      locations: Array.from(locationMap.entries()).map(([id, name]) => ({ id, name }))
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
