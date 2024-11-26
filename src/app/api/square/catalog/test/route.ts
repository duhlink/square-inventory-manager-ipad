import { NextResponse } from 'next/server'
import { listCatalog, retrieveCategories } from '../axios-client'

export async function GET() {
  try {
    // Get catalog data
    const response = await listCatalog()
    
    // Extract all category IDs
    const categoryIds = new Set<string>()
    response.objects?.forEach(item => {
      if (item.type === 'ITEM' && !item.is_deleted && item.item_data?.category_ids) {
        item.item_data.category_ids.forEach(id => categoryIds.add(id))
      }
    })

    // Get category names
    const categoryMap = await retrieveCategories(Array.from(categoryIds))

    // Format categories for response
    const categories = Array.from(categoryMap.entries()).map(([id, name]) => ({
      id,
      name
    }))

    return NextResponse.json({
      success: true,
      data: categories
    })

  } catch (error: any) {
    console.error('Error in test route:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
