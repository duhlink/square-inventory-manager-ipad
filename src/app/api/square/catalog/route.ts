import { NextResponse } from 'next/server'
import { squareClient } from '@/services/square/config'
import { getVendorNames } from '@/services/square/vendors'
import { collectObjectIds, getCategoryNames, getMeasurementUnitNames, getImageUrls } from '@/services/square/catalog'
import * as Sentry from '@sentry/nextjs'
import { CatalogObject, Money } from 'square'

type ExtendedCatalogItemVariation = CatalogObject & {
  itemVariationData?: {
    itemId?: string
    name?: string
    sku?: string
    ordinal?: number
    pricingType?: string
    priceMoney?: Money
    locationOverrides?: Array<{
      locationId: string
      trackInventory?: boolean
      soldOut?: boolean
    }>
    measurementUnitId?: string
    itemVariationVendorInfos?: Array<{
      itemVariationVendorInfoData: {
        vendorId: string
        sku?: string
        priceMoney?: Money
      }
    }>
  }
}

export async function GET() {
  try {
    if (!squareClient?.catalogApi) {
      throw new Error('Square catalog API is not properly initialized')
    }

    console.log('Fetching catalog items...')
    
    // Fetch all items using pagination
    let allObjects: CatalogObject[] = []
    let cursor: string | undefined
    
    do {
      const { result } = await squareClient.catalogApi.listCatalog(
        cursor,
        'ITEM'
      )
      
      if (result.objects) {
        allObjects = [...allObjects, ...result.objects]
      }
      
      cursor = result.cursor
    } while (cursor)

    console.log(`Fetched ${allObjects.length} total items`)

    // Get all active items
    const activeItems = allObjects.filter(item => item.type === 'ITEM' && !item.isDeleted)

    // Collect all object IDs that need to be fetched
    const { categoryIds, measurementUnitIds, imageIds } = collectObjectIds(activeItems)

    // Collect all vendor IDs from variations
    const vendorIds = new Set<string>()
    activeItems.forEach(item => {
      const variations = item.itemData?.variations || []
      variations.forEach(variation => {
        const vendorInfos = (variation as ExtendedCatalogItemVariation).itemVariationData?.itemVariationVendorInfos || []
        vendorInfos.forEach(info => {
          const vendorId = info.itemVariationVendorInfoData?.vendorId
          if (vendorId) {
            vendorIds.add(vendorId)
          }
        })
      })
    })

    console.log('Found vendor IDs:', Array.from(vendorIds))

    // Batch fetch all needed data
    const [categoryNames, unitMap, imageMap, vendorMap] = await Promise.all([
      getCategoryNames(categoryIds),
      getMeasurementUnitNames(measurementUnitIds),
      getImageUrls(imageIds),
      getVendorNames(Array.from(vendorIds))
    ])

    // Map items with resolved data
    const items = activeItems.map(item => {
      // Get vendor info from variations
      const variations = item.itemData?.variations || []
      let vendorId: string | undefined
      let vendorName: string | undefined

      // Look through variations for vendor info
      for (const variation of variations) {
        const vendorInfos = (variation as ExtendedCatalogItemVariation).itemVariationData?.itemVariationVendorInfos || []
        for (const info of vendorInfos) {
          if (info.itemVariationVendorInfoData?.vendorId) {
            vendorId = info.itemVariationVendorInfoData.vendorId
            vendorName = vendorMap.get(vendorId)
            if (vendorName) break
          }
        }
        if (vendorName) break
      }

      // Get measurement unit name if available
      const firstVariation = variations[0] as ExtendedCatalogItemVariation
      const measurementUnitId = firstVariation?.itemVariationData?.measurementUnitId
      const unitType = measurementUnitId 
        ? unitMap.get(measurementUnitId) || 'per item'
        : 'per item'

      // Get category names
      const itemCategoryIds = (item.itemData?.categories || []).map(c => c.id).filter((id): id is string => !!id)
      const categories = itemCategoryIds.map((id, index) => categoryNames[index] || 'Unknown Category')

      // Get image URL if available
      const imageId = item.itemData?.imageIds?.[0]
      const imageUrl = imageId ? imageMap.get(imageId) : undefined

      // Map variations
      const mappedVariations = variations.map(variation => {
        const extendedVariation = variation as ExtendedCatalogItemVariation
        const vendorInfo = extendedVariation.itemVariationData?.itemVariationVendorInfos?.[0]
        const measurementUnitId = extendedVariation.itemVariationData?.measurementUnitId
        const unitName = measurementUnitId 
          ? unitMap.get(measurementUnitId) || 'per item'
          : 'per item'
        
        return {
          id: variation.id,
          name: extendedVariation.itemVariationData?.name || '',
          sku: extendedVariation.itemVariationData?.sku || '',
          price: extendedVariation.itemVariationData?.priceMoney?.amount 
            ? Number(extendedVariation.itemVariationData.priceMoney.amount) / 100 
            : 0,
          cost: vendorInfo?.itemVariationVendorInfoData?.priceMoney?.amount
            ? Number(vendorInfo.itemVariationVendorInfoData.priceMoney.amount) / 100
            : 0,
          measurementUnit: unitName,
          vendorSku: vendorInfo?.itemVariationVendorInfoData?.sku
        }
      })

      // Map to our InventoryItem format
      return {
        id: item.id,
        name: item.itemData?.name || '',
        description: item.itemData?.description || '',
        sku: mappedVariations[0]?.sku || '',
        categories,
        categoryIds: itemCategoryIds,
        price: mappedVariations[0]?.price || 0,
        unitCost: mappedVariations[0]?.cost || 0,
        quantity: 0, // We'll handle inventory separately
        reorderPoint: 5,
        vendorId: vendorId || '',
        vendorName: vendorName || '',
        vendorCode: vendorId || '',
        unitType,
        measurementUnitId: measurementUnitId || '',
        lastUpdated: item.updatedAt || new Date().toISOString(),
        updatedBy: 'system',
        squareId: item.id,
        squareCatalogVersion: Number(item.version || 0),
        squareUpdatedAt: item.updatedAt || '',
        variations: mappedVariations,
        isTaxable: item.itemData?.isTaxable || false,
        visibility: item.itemData?.availableOnline ? 'PUBLIC' : 'PRIVATE',
        trackInventory: mappedVariations[0]?.measurementUnit ? true : false,
        imageUrl,
        imageId
      }
    })

    return NextResponse.json({
      success: true,
      data: items
    })

  } catch (error: any) {
    console.error('Error fetching catalog:', error)
    Sentry.captureException(error, {
      extra: { context: 'catalog_api_route' }
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
