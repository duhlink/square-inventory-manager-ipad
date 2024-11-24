import { NextResponse } from 'next/server'
import { squareClient } from '../../../../services/square/config'
import * as Sentry from '@sentry/nextjs'
import { CatalogObject, SearchCatalogItemsResponse } from 'square'

// Extend Square's type to include relatedObjects
interface ExtendedSearchCatalogItemsResponse extends SearchCatalogItemsResponse {
  relatedObjects?: CatalogObject[]
}

// Simple in-memory cache
let cache: {
  data: any
  timestamp: number
} | null = null;

const CACHE_DURATION = 60 * 1000; // 1 minute cache

// Helper function to safely serialize any object with BigInt values
const safeSerialize = (obj: any): any => {
  try {
    return JSON.parse(JSON.stringify(obj, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ))
  } catch (error) {
    console.error('Serialization error:', error)
    return String(obj)
  }
}

export async function GET() {
  try {
    // Check cache first
    if (cache && (Date.now() - cache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached catalog data')
      return new NextResponse(JSON.stringify(cache.data), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!squareClient?.catalogApi) {
      throw new Error('Square catalog API is not properly initialized')
    }

    console.log('Fetching catalog items...')
    const catalogResponse = await squareClient.catalogApi.searchCatalogItems({
      includeRelatedObjects: true
    } as any) // Type assertion needed due to Square types

    console.log('Catalog items:', catalogResponse.result.items?.length || 0)

    if (!catalogResponse.result.items) {
      throw new Error('No catalog items found')
    }

    // Process and combine the data
    const items = catalogResponse.result.items
      .filter(item => item.type === 'ITEM')
      .map(item => {
        const variations = item.itemData?.variations?.map(variation => ({
          id: variation.id,
          name: variation.itemVariationData?.name || '',
          sku: variation.itemVariationData?.sku || '',
          price: variation.itemVariationData?.priceMoney?.amount 
            ? Number(variation.itemVariationData.priceMoney.amount) / 100
            : 0,
          cost: variation.itemVariationData?.priceMoney?.amount 
            ? Number(variation.itemVariationData.priceMoney.amount) / 200
            : 0,
          quantity: 0
        })) || []

        // Get category from related objects
        const categoryId = item.itemData?.categoryId
        const extendedResult = catalogResponse.result as ExtendedSearchCatalogItemsResponse
        const category = categoryId && extendedResult.relatedObjects
          ? extendedResult.relatedObjects.find(
              (obj: CatalogObject) => obj.type === 'CATEGORY' && obj.id === categoryId
            )?.categoryData?.name || ''
          : ''

        const price = variations[0]?.price || 0

        return {
          id: item.id,
          name: item.itemData?.name || '',
          description: item.itemData?.description || '',
          sku: variations[0]?.sku || '',
          category,
          price,
          cost: price * 0.5,
          quantity: 0,
          reorderPoint: 5,
          vendor: 'Default Vendor',
          status: 'in_stock',
          lastUpdated: item.updatedAt || new Date().toISOString(),
          updatedBy: 'system',
          squareId: item.id,
          squareCatalogVersion: Number(item.version || 0),
          squareUpdatedAt: item.updatedAt,
          variations
        }
      })

    console.log(`Processed ${items.length} catalog items`)

    const response = {
      success: true,
      data: items
    }

    // Update cache
    cache = {
      data: response,
      timestamp: Date.now()
    }

    return new NextResponse(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Error fetching catalog:', error)

    // Clear cache on error
    cache = null

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

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    if (!squareClient?.catalogApi) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INITIALIZATION_ERROR',
          message: 'Square catalog API is not properly initialized'
        }
      }, { status: 500 })
    }

    // Handle single update request
    if (!body || typeof body !== 'object' || !body.id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body'
        }
      }, { status: 400 })
    }

    const { result } = await squareClient.catalogApi.batchUpsertCatalogObjects({
      idempotencyKey: crypto.randomUUID(),
      batches: [{
        objects: [{
          type: 'ITEM',
          id: body.squareId!,
          version: BigInt(body.squareCatalogVersion || 0),
          itemData: {
            name: body.name,
            description: body.description || '',
            categoryId: body.category,
            variations: [{
              type: 'ITEM_VARIATION',
              id: (body.variations?.[0]?.id || body.id) + '_variation',
              itemVariationData: {
                name: 'Regular',
                sku: body.sku,
                priceMoney: {
                  amount: BigInt(Math.round(body.price * 100)),
                  currency: 'USD'
                }
              }
            }]
          }
        }]
      }]
    })

    if (!result.objects?.[0]) {
      throw new Error('Failed to update catalog item')
    }

    // Clear cache after update
    cache = null

    return NextResponse.json({
      success: true,
      data: result.objects[0]
    })

  } catch (error: any) {
    console.error('Catalog API error:', error)
    Sentry.captureException(error, {
      extra: { context: 'catalog_api_route' }
    })

    return NextResponse.json({ 
      success: false,
      error: {
        code: 'UNHANDLED_ERROR',
        message: error.message || 'An unexpected error occurred'
      }
    }, { status: 500 })
  }
}
