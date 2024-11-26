import { NextResponse } from 'next/server'
import { squareClient } from '@/services/square/config'
import * as Sentry from '@sentry/nextjs'
import { CatalogObject } from 'square'

export async function GET() {
  try {
    if (!squareClient?.catalogApi) {
      throw new Error('Square catalog API is not properly initialized')
    }

    console.log('Fetching catalog categories...')
    
    // Fetch all categories using pagination
    let allObjects: CatalogObject[] = []
    let cursor: string | undefined
    
    do {
      const { result } = await squareClient.catalogApi.listCatalog(
        cursor,
        'CATEGORY'
      )
      
      if (result.objects) {
        allObjects = [...allObjects, ...result.objects]
      }
      
      cursor = result.cursor
    } while (cursor)

    console.log(`Fetched ${allObjects.length} total categories`)

    if (!allObjects.length) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Map categories to the format needed by the data table
    const categories = allObjects
      .filter(obj => obj.type === 'CATEGORY' && !obj.isDeleted && obj.categoryData?.name)
      .map(obj => ({
        label: obj.categoryData!.name!,
        value: obj.id
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    console.log('Found categories:', categories)

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error: any) {
    console.error('Error fetching categories:', error)
    Sentry.captureException(error, {
      extra: { context: 'categories_api_route' }
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
