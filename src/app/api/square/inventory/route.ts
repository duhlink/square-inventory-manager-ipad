import { NextResponse } from 'next/server'
import { inventoryService } from '../../../../services/square/inventory'
import { squareClient } from '../../../../services/square/config'
import * as Sentry from '@sentry/nextjs'

interface InventoryUpdateRequest {
  variationId: string
  quantity: number
}

interface BatchInventoryUpdateRequest {
  items: InventoryUpdateRequest[]
}

interface InventoryQueryRequest {
  items: { catalogItemId: string, variationId: string }[]
}

function serializeResponse(obj: any): any {
  if (!obj) return obj
  try {
    return JSON.parse(JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? Number(value) : value
    ))
  } catch (error) {
    Sentry.captureException(error, {
      extra: { context: 'serializeResponse', objectType: typeof obj }
    })
    return obj
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Handle inventory query request
    if (body.type === 'query') {
      const { items } = body as InventoryQueryRequest
      
      if (!Array.isArray(items) || !items.every(item => 
        item && typeof item === 'object' && 
        typeof item.catalogItemId === 'string' && 
        typeof item.variationId === 'string'
      )) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid items format. Expected array of {catalogItemId, variationId} objects'
          }
        }, { status: 400 })
      }

      if (!squareClient?.inventoryApi) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INITIALIZATION_ERROR',
            message: 'Square inventory API is not properly initialized'
          }
        }, { status: 500 })
      }

      const response = await inventoryService.retrieveInventoryCounts(items)
      if (!response.success) {
        return NextResponse.json({
          success: false,
          error: response.error
        }, { status: 500 })
      }

      // Convert Map to object for JSON serialization
      const inventoryData = Object.fromEntries(response.data || new Map())
      return NextResponse.json({ success: true, data: inventoryData })
    }

    // Handle batch update request
    if (Array.isArray(body)) {
      if (!body.every(item => 
        typeof item === 'object' &&
        typeof item.variationId === 'string' &&
        typeof item.quantity === 'number'
      )) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid batch update format. Expected array of {variationId, quantity} objects'
          }
        }, { status: 400 })
      }

      const response = await inventoryService.batchSetInventoryLevels(body)
      if (!response.success) {
        return NextResponse.json({
          success: false,
          error: response.error
        }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Handle single update request
    const { variationId, quantity } = body as InventoryUpdateRequest

    if (!variationId || typeof quantity !== 'number') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Variation ID and quantity are required'
        }
      }, { status: 400 })
    }

    if (!squareClient?.inventoryApi) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INITIALIZATION_ERROR',
          message: 'Square inventory API is not properly initialized'
        }
      }, { status: 500 })
    }

    const response = await inventoryService.setInventoryLevel(variationId, quantity)
    if (!response.success) {
      return NextResponse.json({
        success: false,
        error: response.error
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { context: 'inventory_api_route' }
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
