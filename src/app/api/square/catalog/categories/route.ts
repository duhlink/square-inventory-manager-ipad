import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { listCatalog } from '../axios-client'

export async function GET() {
  try {
    const response = await listCatalog()
    const items = response.objects || []
    
    // Extract unique categories from catalog items
    const categorySet = new Set<string>()
    items.forEach(item => {
      if (item.type === 'CATEGORY' && !item.is_deleted && item.category_data?.name) {
        categorySet.add(item.category_data.name)
      }
    })

    // Convert to array and sort alphabetically
    const categories = Array.from(categorySet)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({
        label: name,
        value: name
      }))

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
        message: error.message,
        status: error.response?.status,
        details: error.response?.data
      }
    }, { status: error.response?.status || 500 })
  }
}
