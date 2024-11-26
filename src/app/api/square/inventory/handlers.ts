import { NextResponse } from 'next/server'
import { squareClient } from '@/services/square/config'
import { inventoryService } from '@/services/square/inventory'
import { InventoryQueryRequest, InventoryUpdateRequest, ApiResponse } from './types'
import { errorResponse, successResponse } from './utils'

export async function handleInventoryQuery(body: InventoryQueryRequest): Promise<NextResponse<ApiResponse>> {
  const { items } = body
  
  if (!Array.isArray(items) || !items.every(item => 
    item && typeof item === 'object' && 
    typeof item.catalogItemId === 'string' && 
    typeof item.variationId === 'string'
  )) {
    return errorResponse(
      'INVALID_REQUEST',
      'Invalid items format. Expected array of {catalogItemId, variationId} objects'
    )
  }

  if (!squareClient?.inventoryApi) {
    return errorResponse(
      'INITIALIZATION_ERROR',
      'Square inventory API is not properly initialized',
      500
    )
  }

  const response = await inventoryService.retrieveInventoryCounts(items)
  if (!response.success) {
    return errorResponse(
      response.error?.code || 'UNKNOWN_ERROR',
      response.error?.message || 'An unknown error occurred',
      500
    )
  }

  const inventoryData = Object.fromEntries(response.data || new Map())
  return successResponse(inventoryData)
}

export async function handleSingleUpdate(body: InventoryUpdateRequest): Promise<NextResponse<ApiResponse>> {
  const { variationId, quantity } = body

  if (!variationId || typeof quantity !== 'number') {
    return errorResponse(
      'INVALID_REQUEST',
      'Variation ID and quantity are required'
    )
  }

  if (!squareClient?.inventoryApi) {
    return errorResponse(
      'INITIALIZATION_ERROR',
      'Square inventory API is not properly initialized',
      500
    )
  }

  const response = await inventoryService.setInventoryLevel(variationId, quantity)
  if (!response.success) {
    return errorResponse(
      response.error?.code || 'UNKNOWN_ERROR',
      response.error?.message || 'An unknown error occurred',
      500
    )
  }

  return successResponse()
}

export async function handleBatchUpdate(items: InventoryUpdateRequest[]): Promise<NextResponse<ApiResponse>> {
  if (!items.every(item => 
    typeof item === 'object' &&
    typeof item.variationId === 'string' &&
    typeof item.quantity === 'number'
  )) {
    return errorResponse(
      'INVALID_REQUEST',
      'Invalid batch update format. Expected array of {variationId, quantity} objects'
    )
  }

  const response = await inventoryService.batchSetInventoryLevels(items)
  if (!response.success) {
    return errorResponse(
      response.error?.code || 'UNKNOWN_ERROR',
      response.error?.message || 'An unknown error occurred',
      500
    )
  }

  return successResponse()
}
