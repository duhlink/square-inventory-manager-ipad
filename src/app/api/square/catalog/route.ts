import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { listCatalog, retrieveCategories } from './axios-client'
import { bulkRetrieveVendors } from './vendor-utils'
import { extractImageUrls, extractMeasurementUnits } from './transform-utils'
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
    
    activeItems.forEach(item => {
      const itemCategoryIds = extractCategoryIds(item)
      itemCategoryIds.forEach(id => categoryIds.add(id))
      if (itemCategoryIds.length > 0) {
        itemCategoryMap.set(item.id, itemCategoryIds)
      }

      const variations = item.item_data?.variations || []
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

    writeDebugToFile({
      total_items: activeItems.length,
      items_with_categories: activeItems.filter(item => extractCategoryIds(item).length > 0).length,
      unique_category_ids: Array.from(categoryIds),
      item_category_mapping: Array.from(itemCategoryMap.entries()).map(([itemId, catIds]) => ({
        item_id: itemId,
        item_name: activeItems.find(item => item.id === itemId)?.item_data?.name,
        category_ids: catIds,
        raw_categories: activeItems.find(item => item.id === itemId)?.item_data?.categories
      }))
    }, 'category-collection')

    const [vendorMap, categoryMap, inventoryResponse] = await Promise.all([
      bulkRetrieveVendors(Array.from(vendorIds)),
      retrieveCategories(Array.from(categoryIds)),
      inventoryService.retrieveInventoryCounts(itemVariations)
    ])

    // Initialize inventory counts with a default empty Map if the response wasn't successful
    const inventoryCounts: Map<string, number> = inventoryResponse.success && inventoryResponse.data instanceof Map 
      ? inventoryResponse.data 
      : new Map<string, number>()

    writeDebugToFile({
      total_categories: categoryIds.size,
      category_mappings: Array.from(categoryMap.entries()).map((entry: [string, string]) => ({
        category_id: entry[0],
        category_name: entry[1]
      })),
      raw_category_ids: Array.from(categoryIds)
    }, 'category-mapping')

    const allCategories = createCategoryOptions(categoryMap)

    const mappedItems = activeItems.map(item => {
      const variations = item.item_data?.variations || []
      const firstVariation = variations[0]
      const vendorId = extractVendorId(item)
      const vendorName = getVendorName(vendorId, vendorMap)

      const categoryIds = extractCategoryIds(item)
      const categoryNames = getCategoryNames(categoryIds, categoryMap)

      const imageId = item.item_data?.image_ids?.[0]
      const imageUrl = imageId ? imageMap.get(imageId) : undefined

      const mappedVariations = mapVariations(variations, measurementUnitMap, vendorMap)

      // Calculate total quantity across all variations
      const quantity = variations.reduce((total, variation) => {
        return total + (inventoryCounts.get(variation.id || '') || 0)
      }, 0)

      return {
        id: item.id,
        name: item.item_data?.name || '',
        description: item.item_data?.description || '',
        sku: firstVariation?.item_variation_data?.sku || '',
        categories: categoryNames,
        categoryIds,
        price: safeMoneyToNumber(firstVariation?.item_variation_data?.price_money),
        unitCost: 0,
        quantity,
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
        trackInventory: variations.some((v: ItemVariation) => v.item_variation_data?.stockable),
        imageUrl,
        imageId
      }
    })

    writeDebugToFile({
      total_items: mappedItems.length,
      items_with_categories: mappedItems.map(item => ({
        id: item.id,
        name: item.name,
        categories: item.categories,
        category_ids: item.categoryIds,
        original_categories: activeItems.find(ai => ai.id === item.id)?.item_data?.categories
      }))
    }, 'categories')

    return NextResponse.json({
      success: true,
      data: mappedItems,
      categories: allCategories
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
