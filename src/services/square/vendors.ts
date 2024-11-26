import { squareClient } from "./config"

export interface Vendor {
  id: string
  name: string
}

// Cache for vendor names
const vendorCache = new Map<string, string>()

export async function fetchVendors(): Promise<Vendor[]> {
  if (!squareClient?.vendorsApi) {
    throw new Error('Square vendors API is not properly initialized')
  }

  try {
    const { result } = await squareClient.vendorsApi.searchVendors({
      filter: {
        status: ['ACTIVE']
      }
    })

    if (!result.vendors) return []

    // Update cache with fresh data
    result.vendors
      .filter((vendor): vendor is { id: string; name: string } => 
        typeof vendor.id === 'string' && 
        typeof vendor.name === 'string'
      )
      .forEach(vendor => {
        vendorCache.set(vendor.id, vendor.name)
      })

    return result.vendors
      .filter((vendor): vendor is { id: string; name: string } => 
        typeof vendor.id === 'string' && 
        typeof vendor.name === 'string'
      )
      .map(vendor => ({
        id: vendor.id,
        name: vendor.name
      }))
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return []
  }
}

export async function getVendorNames(vendorIds: string[]): Promise<Map<string, string>> {
  console.log('Getting vendor names for IDs:', vendorIds)
  
  if (!vendorIds.length) {
    return new Map()
  }

  // Filter out already cached vendors
  const uncachedIds = vendorIds.filter(id => !vendorCache.has(id))
  console.log('Uncached vendor IDs:', uncachedIds)
  
  if (uncachedIds.length > 0) {
    try {
      // Fetch all active vendors
      const { result } = await squareClient.vendorsApi.searchVendors({
        filter: {
          status: ['ACTIVE']
        }
      })

      console.log('Search vendors result:', JSON.stringify(result, null, 2))

      if (result.vendors) {
        // Filter vendors to only those we need and cache them
        result.vendors
          .filter(vendor => 
            vendor.id && 
            vendor.name && 
            uncachedIds.includes(vendor.id)
          )
          .forEach(vendor => {
            if (vendor.id && vendor.name) {
              console.log('Caching vendor:', { id: vendor.id, name: vendor.name })
              vendorCache.set(vendor.id, vendor.name)
            }
          })
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  // Return map of all requested vendor IDs to names (using cache)
  const vendorMap = new Map<string, string>()
  vendorIds.forEach(id => {
    const name = vendorCache.get(id)
    if (name) {
      vendorMap.set(id, name)
    } else {
      console.log(`No vendor name found for ID: ${id}`)
    }
  })
  
  console.log('Final vendor map:', Object.fromEntries(vendorMap))
  return vendorMap
}

export async function getVendorName(vendorId: string): Promise<string | undefined> {
  // Check cache first
  if (vendorCache.has(vendorId)) {
    return vendorCache.get(vendorId)
  }

  try {
    // Try to get the vendor from the API
    const response = await squareClient.vendorsApi.retrieveVendor(vendorId)
    
    if (response.result?.vendor?.name) {
      const name = response.result.vendor.name
      vendorCache.set(vendorId, name)
      return name
    }
  } catch (error) {
    console.error(`Error fetching vendor ${vendorId}:`, error)
  }

  return undefined
}
