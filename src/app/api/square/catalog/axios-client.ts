import axios from 'axios'
import { CatalogObject } from './types'
import { writeDebugToFile } from './debug-utils'

const SQUARE_API_URL = 'https://connect.squareup.com/v2'
const SQUARE_ACCESS_TOKEN = process.env.NEXT_PUBLIC_SQUARE_ACCESS_TOKEN
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000

if (!SQUARE_ACCESS_TOKEN) {
  throw new Error('NEXT_PUBLIC_SQUARE_ACCESS_TOKEN is not configured')
}

interface SquareResponse {
  objects?: CatalogObject[]
  cursor?: string
  errors?: Array<{
    category: string
    code: string
    detail: string
  }>
}

interface Location {
  id: string
  name: string
  status: string
}

interface LocationResponse {
  locations?: Location[]
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    if (retries === 0 || error?.response?.status !== 429) {
      throw error
    }
    const delayTime = initialDelay * Math.pow(2, MAX_RETRIES - retries)
    console.log(`Rate limited. Retrying in ${delayTime}ms...`)
    await delay(delayTime)
    return retryWithBackoff(operation, retries - 1, initialDelay)
  }
}

export const axiosClient = axios.create({
  baseURL: SQUARE_API_URL,
  headers: {
    'Square-Version': '2024-01-17',
    'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

export async function listLocations(): Promise<Map<string, string>> {
  try {
    const response = await retryWithBackoff(() => 
      axiosClient.get<LocationResponse>('/locations')
    )

    const locationMap = new Map<string, string>()
    
    if (response.data.locations) {
      response.data.locations.forEach(location => {
        if (location.status === 'ACTIVE') {
          locationMap.set(location.id, location.name)
        }
      })
    }

    writeDebugToFile({
      total_locations: locationMap.size,
      locations: Array.from(locationMap.entries()).map(([id, name]) => ({
        id,
        name
      }))
    }, 'locations')

    return locationMap

  } catch (error) {
    console.error('Error fetching locations:', error)
    throw error
  }
}

export async function listCatalog(): Promise<{ objects: CatalogObject[] }> {
  try {
    let allObjects: CatalogObject[] = []
    let cursor: string | undefined = undefined
    let pageCount = 0

    do {
      const response = await retryWithBackoff(() => 
        axiosClient.get('/catalog/list', {
          params: {
            types: 'ITEM,CATEGORY,IMAGE,MEASUREMENT_UNIT',
            cursor: cursor
          }
        })
      )

      if (response.data.errors) {
        console.error('Square API errors:', response.data.errors)
      }

      if (response.data.objects) {
        allObjects.push(...response.data.objects)
      }

      cursor = response.data.cursor
      pageCount++

      if (cursor) {
        await delay(200)
      }

    } while (cursor)

    const categories = allObjects.filter(obj => obj.type === 'CATEGORY' && !obj.is_deleted)
    const items = allObjects.filter(obj => obj.type === 'ITEM' && !obj.is_deleted)

    writeDebugToFile({
      total_objects: allObjects.length,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.category_data?.name,
      })),
      items: items.map(item => ({
        id: item.id,
        name: item.item_data?.name,
        category_ids: item.item_data?.category_ids
      }))
    }, 'catalog')

    return {
      objects: allObjects
    }

  } catch (error) {
    console.error('Error in axios catalog list:', error)
    throw error
  }
}

export async function retrieveCategories(categoryIds: string[]): Promise<Map<string, string>> {
  try {
    if (!categoryIds.length) {
      console.log('No category IDs to retrieve')
      return new Map()
    }

    console.log(`Retrieving categories for IDs:`, categoryIds)

    const response = await retryWithBackoff(() =>
      axiosClient.post('/catalog/batch-retrieve', {
        object_ids: categoryIds,
        include_related_objects: false
      })
    )

    writeDebugToFile({
      request: {
        category_ids: categoryIds,
        timestamp: new Date().toISOString()
      },
      response: response.data
    }, 'category-response')

    const categoryMap = new Map<string, string>()
    
    if (response.data.objects) {
      response.data.objects.forEach((obj: CatalogObject) => {
        if (obj.type === 'CATEGORY' && !obj.is_deleted && obj.id) {
          const name = obj.category_data?.name?.trim()
          categoryMap.set(obj.id, name || obj.id)
        }
      })
    }

    writeDebugToFile({
      total_requested: categoryIds.length,
      total_retrieved: categoryMap.size,
      category_mappings: Array.from(categoryMap.entries()).map(([id, name]) => ({
        id,
        name
      }))
    }, 'category-mappings')

    return categoryMap

  } catch (error) {
    console.error('Error retrieving categories:', error)
    const categoryMap = new Map<string, string>()
    categoryIds.forEach(id => categoryMap.set(id, id))
    return categoryMap
  }
}
