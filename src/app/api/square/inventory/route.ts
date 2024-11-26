import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { handleInventoryQuery, handleSingleUpdate, handleBatchUpdate } from './handlers'
import { InventoryQueryRequest, InventoryUpdateRequest } from './types'
import { errorResponse } from './utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Handle inventory query request
    if (body.type === 'query') {
      return handleInventoryQuery(body as InventoryQueryRequest)
    }

    // Handle batch update request
    if (Array.isArray(body)) {
      return handleBatchUpdate(body as InventoryUpdateRequest[])
    }

    // Handle single update request
    return handleSingleUpdate(body as InventoryUpdateRequest)

  } catch (error: any) {
    Sentry.captureException(error, {
      extra: { context: 'inventory_api_route' }
    })

    return errorResponse(
      'UNHANDLED_ERROR',
      error.message || 'An unexpected error occurred',
      500
    )
  }
}
