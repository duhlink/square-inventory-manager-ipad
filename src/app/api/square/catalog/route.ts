import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { listCatalog, bulkRetrieveVendors, retrieveCategories, extractImageUrls, extractMeasurementUnits } from './axios-client'
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
    
    activeItems.forEach(item => {
      const itemCategoryIds = extractCategoryIds(item)
      itemCategoryIds.forEach(id => categoryIds.add(id))
      if (itemCategoryIds.length > 0) {
        itemCategoryMap.set(item.id, itemCategoryIds)
      }

      const variations = item.item_data?.variations || []
      variations.forEach((variation: ItemVariation) => {
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

    const [vendorMap, categoryMap] = await Promise.all([
      bulkRetrieveVendors(Array.from(vendorIds)),
      retrieveCategories(Array.from(categoryIds))
    ])

    writeDebugToFile({
      total_categories: categoryIds.size,
      category_mappings: Array.from(categoryMap.entries()).map(([id, name]) => ({
        category_id: id,
        category_name: name
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

      return {
        id: item.id,
        name: item.item_data?.name || '',
        description: item.item_data?.description || '',
        sku: firstVariation?.item_variation_data?.sku || '',
        categories: categoryNames,  // Keep as array for table component
        categoryIds,    // Raw category IDs for filtering
        price: safeMoneyToNumber(firstVariation?.item_variation_data?.price_money),
        unitCost: 0,
        quantity: 0,
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
