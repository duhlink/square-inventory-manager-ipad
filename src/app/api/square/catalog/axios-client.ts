import axios, { AxiosResponse } from 'axios'
import fs from 'fs'
import path from 'path'

const SQUARE_API_URL = 'https://connect.squareup.com/v2'
const SQUARE_ACCESS_TOKEN = 'EAAAl7jn6--qEQf4iuFDvdTLzYgWNwIxBRj5HkBIm_vGcZuAzkmq95dLi8W-QqaE'

interface CatalogObject {
  id: string
  type: string
  version?: number
  is_deleted: boolean
  updated_at?: string
  category_data?: {
    name: string
  }
  image_data?: {
    url?: string
  }
  measurement_unit_data?: {
    measurement_unit?: {
      custom_unit?: {
        name: string
      }
      area_unit?: string
      length_unit?: string
      volume_unit?: string
      weight_unit?: string
      generic_unit?: string
      time_unit?: string
      type?: string
    }
    precision?: number
  }
  item_data?: {
    name: string
    category_ids?: string[]
    variations?: Array<{
      id: string
      item_variation_data?: {
        item_variation_vendor_infos?: Array<{
          item_variation_vendor_info_data?: {
            vendor_id: string
            sku?: string
          }
        }>
      }
    }>
  }
  [key: string]: any
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

interface Vendor {
  id: string
  name?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface VendorResponse {
  vendors?: Vendor[]
  errors?: Array<{
    category: string
    code: string
    detail: string
  }>
}

interface CategoryOption {
  value: string
  label: string
}

const axiosClient = axios.create({
  baseURL: SQUARE_API_URL,
  headers: {
    'Square-Version': '2024-11-20',
    'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

// Helper function to write debug data with limits
const writeDebugToFile = (data: any, prefix: string) => {
  try {
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }

    // Truncate data to 300 lines
    const dataString = JSON.stringify(data, null, 2)
    const lines = dataString.split('\n')
    const truncatedData = lines.slice(0, 300).join('\n')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = path.join(debugDir, `${prefix}-${timestamp}.json`)
    fs.writeFileSync(filePath, truncatedData)

    // Get all debug files and group by prefix
    const files = fs.readdirSync(debugDir)
    const filesByPrefix = new Map<string, string[]>()
    
    files.forEach(file => {
      const filePrefix = file.split('-')[0]
      if (!filesByPrefix.has(filePrefix)) {
        filesByPrefix.set(filePrefix, [])
      }
      filesByPrefix.get(filePrefix)?.push(file)
    })

    // Keep only the most recent file per prefix
    filesByPrefix.forEach((prefixFiles, filePrefix) => {
      const sortedFiles = prefixFiles.sort((a, b) => {
        const timeA = fs.statSync(path.join(debugDir, a)).mtime.getTime()
        const timeB = fs.statSync(path.join(debugDir, b)).mtime.getTime()
        return timeB - timeA
      })

      // Remove all but the most recent file for this prefix
      sortedFiles.slice(1).forEach(file => {
        try {
          fs.unlinkSync(path.join(debugDir, file))
        } catch (error) {
          console.error(`Error removing old debug file ${file}:`, error)
        }
      })
    })

    // Keep only 10 most recent files total
    const allFiles = fs.readdirSync(debugDir)
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(debugDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time)

    allFiles.slice(10).forEach(file => {
      try {
        fs.unlinkSync(path.join(debugDir, file.name))
      } catch (error) {
        console.error(`Error removing old debug file ${file.name}:`, error)
      }
    })

  } catch (error) {
    console.error(`Error writing debug file for ${prefix}:`, error)
  }
}

export async function listCatalog(): Promise<{ objects: CatalogObject[] }> {
  try {
    let allObjects: CatalogObject[] = []
    let cursor: string | undefined = undefined
    let pageCount = 0

    do {
      const response: AxiosResponse<SquareResponse> = await axiosClient.get('/catalog/list', {
        params: {
          types: 'ITEM,CATEGORY,IMAGE,MEASUREMENT_UNIT',
          cursor: cursor
        }
      })

      if (response.data.errors) {
        console.error('Square API errors:', response.data.errors)
      }

      if (response.data.objects) {
        allObjects.push(...response.data.objects)
      }

      cursor = response.data.cursor
      pageCount++

    } while (cursor)

    // Extract categories and items for debugging
    const categories = allObjects.filter(obj => obj.type === 'CATEGORY' && !obj.is_deleted)
    const items = allObjects.filter(obj => obj.type === 'ITEM' && !obj.is_deleted)

    // Write detailed catalog debug info
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

    const response: AxiosResponse<SquareResponse> = await axiosClient.post('/catalog/batch-retrieve', {
      object_ids: categoryIds,
      include_related_objects: false
    })

    writeDebugToFile({
      request: {
        category_ids: categoryIds,
        timestamp: new Date().toISOString()
      },
      response: response.data
    }, 'category-response')

    const categoryMap = new Map<string, string>()
    
    if (response.data.objects) {
      response.data.objects.forEach(obj => {
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

export async function bulkRetrieveVendors(vendorIds: string[]): Promise<Map<string, string>> {
  try {
    if (!vendorIds.length) {
      console.log('No vendor IDs to retrieve')
      return new Map()
    }

    console.log(`Attempting to retrieve vendors for IDs:`, vendorIds)

    const vendorMap = new Map<string, string>()
    
    for (const vendorId of vendorIds) {
      try {
        const response: AxiosResponse<{ vendor?: Vendor }> = await axiosClient.get(`/vendors/${vendorId}`)
        
        writeDebugToFile({
          vendor_id: vendorId,
          response: response.data,
          timestamp: new Date().toISOString()
        }, `vendor-response-${vendorId}`)

        if (response.data.vendor) {
          const name = response.data.vendor.name?.trim()
          vendorMap.set(vendorId, name || vendorId)
        } else {
          console.warn(`No vendor data returned for ID: ${vendorId}`)
          vendorMap.set(vendorId, vendorId)
        }
      } catch (error) {
        console.error(`Error retrieving vendor ${vendorId}:`, error)
        vendorMap.set(vendorId, vendorId)
      }
    }

    writeDebugToFile({
      total_requested: vendorIds.length,
      total_retrieved: vendorMap.size,
      vendor_mappings: Array.from(vendorMap.entries()).map(([id, name]) => ({
        id,
        name
      }))
    }, 'vendor-mappings')

    return vendorMap

  } catch (error: unknown) {
    console.error('Error in vendor retrieve:', error)
    const vendorMap = new Map<string, string>()
    vendorIds.forEach(id => vendorMap.set(id, id))
    return vendorMap
  }
}

export function extractImageUrls(objects: CatalogObject[]): Map<string, string> {
  const imageMap = new Map<string, string>()
  
  objects
    .filter(obj => obj.type === 'IMAGE' && !obj.is_deleted)
    .forEach(image => {
      if (image.id && image.image_data?.url) {
        imageMap.set(image.id, image.image_data.url)
      }
    })

  return imageMap
}

export function extractMeasurementUnits(objects: CatalogObject[]): Map<string, string> {
  const unitMap = new Map<string, string>()
  
  objects
    .filter(obj => obj.type === 'MEASUREMENT_UNIT' && !obj.is_deleted)
    .forEach(unit => {
      if (unit.id && unit.measurement_unit_data?.measurement_unit) {
        const measurementUnit = unit.measurement_unit_data.measurement_unit
        let unitName = ''

        if (measurementUnit.custom_unit?.name) {
          unitName = measurementUnit.custom_unit.name
        } else if (measurementUnit.area_unit) {
          unitName = measurementUnit.area_unit.toLowerCase()
        } else if (measurementUnit.length_unit) {
          unitName = measurementUnit.length_unit.toLowerCase()
        } else if (measurementUnit.volume_unit) {
          unitName = measurementUnit.volume_unit.toLowerCase()
        } else if (measurementUnit.weight_unit) {
          unitName = measurementUnit.weight_unit.toLowerCase()
        } else if (measurementUnit.generic_unit) {
          unitName = measurementUnit.generic_unit.toLowerCase()
        } else if (measurementUnit.time_unit) {
          unitName = measurementUnit.time_unit.toLowerCase()
        } else {
          unitName = 'unit'
        }

        unitMap.set(unit.id, unitName)
      }
    })

  return unitMap
}
