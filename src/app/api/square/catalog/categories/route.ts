import { NextResponse } from 'next/server'
import { squareClient } from '../../../../../services/square/config'
import * as Sentry from '@sentry/nextjs'
import { CatalogObject } from 'square'

interface CategoryData {
  id: string
  name: string
  value: string
}

// Simple in-memory cache for categories
let categoryCache: {
  data: {
    success: boolean
    data: CategoryData[]
  }
  timestamp: number
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for categories

interface ValidCategoryObject extends CatalogObject {
  type: 'CATEGORY'
  categoryData: {
    name: string
  }
}

const isCategoryObject = (obj: CatalogObject): obj is ValidCategoryObject => {
  return (
    obj.type === 'CATEGORY' &&
    obj.categoryData !== null &&
    obj.categoryData !== undefined &&
    typeof obj.categoryData.name === 'string' &&
    obj.categoryData.name.length > 0
  )
}

const normalizeValue = (name: string): string => {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
}

export async function GET() {
  try {
    // Check cache first
    if (categoryCache && (Date.now() - categoryCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached category data')
      return new NextResponse(JSON.stringify(categoryCache.data), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!squareClient?.catalogApi) {
      throw new Error('Square client is not properly initialized')
    }

    console.log('Fetching catalog categories...')
    const response = await squareClient.catalogApi.listCatalog(
      undefined,
      'CATEGORY'
    )

    if (!response.result.objects) {
      throw new Error('No categories found')
    }

    // Process categories and ensure uniqueness
    const categoriesMap = new Map<string, CategoryData>()
    
    response.result.objects
      .filter(isCategoryObject)
      .forEach(obj => {
        const name = obj.categoryData.name.trim()
        const value = normalizeValue(name)
        
        // Only add if we haven't seen this normalized value before
        if (!categoriesMap.has(value)) {
          categoriesMap.set(value, {
            id: obj.id,
            name,
            value
          })
        }
      })

    // Convert map to array and sort
    const categories = Array.from(categoriesMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))

    console.log(`Processed ${categories.length} unique categories`)

    const responseData = {
      success: true,
      data: categories
    }

    // Update cache
    categoryCache = {
      data: responseData,
      timestamp: Date.now()
    }

    return new NextResponse(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Error fetching categories:', error)

    // Clear cache on error
    categoryCache = null

    Sentry.captureException(error, {
      extra: { context: 'catalog_categories_api_route' }
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
