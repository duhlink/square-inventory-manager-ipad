import { NextResponse } from 'next/server'
import { squareClient } from '@/services/square/config'
import { getVendorName } from '@/services/square/vendors'
import { collectObjectIds, getCategoryNames, getMeasurementUnitNames, getImageUrls } from '@/services/square/catalog'
import * as Sentry from '@sentry/nextjs'
import { CatalogObject, Money } from 'square'

// Use type assertion instead of interface extension
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
    const { result } = await squareClient.catalogApi.listCatalog(
      undefined,
      'ITEM'
    )

    if (!result.objects) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Get all active items
    const activeItems = result.objects.filter(item => item.type === 'ITEM' && !item.isDeleted)

    // Collect all object IDs that need to be fetched
    const { categoryIds, measurementUnitIds, imageIds } = collectObjectIds(activeItems)

    // Batch fetch all needed data
    const [categoryNames, unitMap, imageMap] = await Promise.all([
      getCategoryNames(categoryIds),
      getMeasurementUnitNames(measurementUnitIds),
      getImageUrls(imageIds)
    ])

    // Map items with resolved data
    const items = await Promise.all(
      activeItems.map(async item => {
        // Get vendor info from first variation if available
        const firstVariation = item.itemData?.variations?.[0] as ExtendedCatalogItemVariation
        const vendorInfo = firstVariation?.itemVariationData?.itemVariationVendorInfos?.[0]
        const vendorId = vendorInfo?.itemVariationVendorInfoData?.vendorId || 'WBEGKGP7O4ZWECWE'
        
        // Get vendor name using our vendor service
        const vendorName = await getVendorName(vendorId)

        // Get measurement unit name if available
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
        const variations = await Promise.all((item.itemData?.variations || []).map(async variation => {
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
        }))

        // Map to our InventoryItem format
        const mappedItem = {
          id: item.id,
          name: item.itemData?.name || '',
          description: item.itemData?.description || '',
          sku: variations[0]?.sku || '',
          categories,
          categoryIds: itemCategoryIds,
          price: variations[0]?.price || 0,
          unitCost: variations[0]?.cost || 0,
          quantity: 0, // We'll handle inventory separately
          reorderPoint: 5,
          vendorId,
          vendorName,
          vendorCode: vendorId,
          unitType,
          measurementUnitId: measurementUnitId || '',
          lastUpdated: item.updatedAt || new Date().toISOString(),
          updatedBy: 'system',
          squareId: item.id,
          squareCatalogVersion: Number(item.version || 0),
          squareUpdatedAt: item.updatedAt || '',
          variations,
          isTaxable: item.itemData?.isTaxable || false,
          visibility: item.itemData?.availableOnline ? 'PUBLIC' : 'PRIVATE',
          trackInventory: variations[0]?.measurementUnit ? true : false,
          imageUrl,
          imageId
        }

        return mappedItem
      })
    )

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
