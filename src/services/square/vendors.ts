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
  // Filter out already cached vendors
  const uncachedIds = vendorIds.filter(id => !vendorCache.has(id))
  
  if (uncachedIds.length > 0) {
    try {
      // Fetch each vendor directly using their ID
      const vendorPromises = uncachedIds.map(async (id) => {
        try {
          const { result } = await squareClient.vendorsApi.retrieveVendor(id)
          if (result.vendor?.id && result.vendor?.name) {
            vendorCache.set(result.vendor.id, result.vendor.name)
          }
        } catch (error) {
          console.error(`Error fetching vendor ${id}:`, error)
        }
      })

      await Promise.all(vendorPromises)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  // Return map of all requested vendor IDs to names (using cache)
  const vendorMap = new Map<string, string>()
  vendorIds.forEach(id => {
    vendorMap.set(id, vendorCache.get(id) || '')
  })
  
  return vendorMap
}

export async function getVendorName(vendorId: string): Promise<string> {
  // Check cache first
  if (vendorCache.has(vendorId)) {
    return vendorCache.get(vendorId)!
  }

  // If not in cache, fetch vendor directly
  try {
    const { result } = await squareClient.vendorsApi.retrieveVendor(vendorId)
    if (result.vendor?.name) {
      vendorCache.set(vendorId, result.vendor.name)
      return result.vendor.name
    }
  } catch (error) {
    console.error(`Error fetching vendor ${vendorId}:`, error)
  }

  return ''
}
