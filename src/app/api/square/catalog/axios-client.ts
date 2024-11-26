import axios, { AxiosResponse, AxiosError } from 'axios'
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

const axiosClient = axios.create({
  baseURL: SQUARE_API_URL,
  headers: {
    'Square-Version': '2024-11-20',
    'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
})

// Helper function to manage debug files
const manageDebugFiles = (debugDir: string, prefix: string) => {
  const files = fs.readdirSync(debugDir)
    .filter(file => file.startsWith(prefix))
    .sort((a, b) => {
      const timeA = fs.statSync(path.join(debugDir, a)).mtime.getTime()
      const timeB = fs.statSync(path.join(debugDir, b)).mtime.getTime()
      return timeB - timeA
    })

  // Keep only the last 250 files
  if (files.length > 250) {
    files.slice(250).forEach(file => {
      try {
        fs.unlinkSync(path.join(debugDir, file))
      } catch (error) {
        console.error(`Error removing old debug file ${file}:`, error)
      }
    })
  }
}

// Helper function to write debug data
const writeDebugToFile = (data: any, prefix: string) => {
  try {
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = path.join(debugDir, `${prefix}-${timestamp}.json`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    manageDebugFiles(debugDir, prefix)
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

      // Log each page's vendor information
      if (response.data.objects) {
        const vendorInfo = response.data.objects
          .filter(obj => obj.type === 'ITEM' && !obj.is_deleted)
          .map(item => {
            const variations = item.item_data?.variations || []
            return {
              item_id: item.id,
              item_name: item.item_data?.name,
              variations: variations.map((variation: { id: string, item_variation_data?: any }) => ({
                variation_id: variation.id,
                vendor_infos: variation.item_variation_data?.item_variation_vendor_infos || []
              }))
            }
          })
          .filter(item => item.variations.some((v: { vendor_infos: any[] }) => v.vendor_infos.length > 0))

        if (vendorInfo.length > 0) {
          writeDebugToFile({
            page: pageCount + 1,
            vendor_info: vendorInfo
          }, 'catalog-vendor-info')
        }
      }

      if (response.data.errors) {
        console.error('Square API errors:', response.data.errors)
      }

      if (response.data.objects) {
        allObjects.push(...response.data.objects)
      }

      cursor = response.data.cursor
      pageCount++

    } while (cursor)

    return {
      objects: allObjects
    }

  } catch (error) {
    console.error('Error in axios catalog list:', error)
    throw error
  }
}

export async function bulkRetrieveVendors(vendorIds: string[]): Promise<Map<string, string>> {
  try {
    if (!vendorIds.length) {
      console.log('No vendor IDs to retrieve')
      return new Map()
    }

    // Log the request attempt
    console.log(`Attempting to retrieve vendors for IDs:`, vendorIds)

    // Make individual requests for each vendor ID
    const vendorMap = new Map<string, string>()
    
    for (const vendorId of vendorIds) {
      try {
        const response: AxiosResponse<{ vendor?: Vendor }> = await axiosClient.get(`/vendors/${vendorId}`)
        
        // Log individual vendor response
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

    // Log vendor mapping summary
    const vendorSummary = {
      total_requested: vendorIds.length,
      total_retrieved: vendorMap.size,
      vendor_mappings: Array.from(vendorMap.entries()).map(([id, name]) => ({ id, name }))
    }
    writeDebugToFile(vendorSummary, 'vendor-mappings')

    console.log(`Retrieved ${vendorMap.size} vendors out of ${vendorIds.length} requested`)

    return vendorMap

  } catch (error: unknown) {
    console.error('Error in vendor retrieve:', error)
    
    // Log the full error details
    if (error instanceof Error) {
      writeDebugToFile({
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          response: axios.isAxiosError(error) ? error.response?.data : undefined
        }
      }, 'vendor-error-details')
    }

    // Create default mappings for all vendor IDs
    const vendorMap = new Map<string, string>()
    vendorIds.forEach(id => {
      vendorMap.set(id, id)
    })
    return vendorMap
  }
}

export function extractCategoryNames(objects: CatalogObject[]): Map<string, string> {
  const categoryMap = new Map<string, string>()
  
  const categories = objects.filter(obj => obj.type === 'CATEGORY' && !obj.is_deleted)
  categories.forEach(category => {
    if (category.id) {
      // Use category name if available and not empty, otherwise use ID
      const name = category.category_data?.name?.trim()
      if (name) {
        categoryMap.set(category.id, name)
      } else {
        console.warn(`No name found for category ID: ${category.id}`)
        categoryMap.set(category.id, category.id)
      }
    }
  })

  // Log category mapping summary
  console.log(`Extracted ${categoryMap.size} categories`)
  writeDebugToFile({
    total_categories: categoryMap.size,
    category_mappings: Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }))
  }, 'category-mappings')

  return categoryMap
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
