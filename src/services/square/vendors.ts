import { squareClient } from "./config"

export interface Vendor {
  id: string
  name: string
}

// Cache vendors to avoid repeated API calls
let vendorsCache: Map<string, string> | null = null

export async function fetchVendors(): Promise<Vendor[]> {
  if (!squareClient?.vendorsApi) {
    throw new Error('Square vendors API is not properly initialized')
  }

  const { result } = await squareClient.vendorsApi.searchVendors({
    filter: {
      status: ['ACTIVE']
    }
  })

  if (!result.vendors) return []

  // Update cache with fresh data
  vendorsCache = new Map(
    result.vendors
      .filter(vendor => vendor.id && vendor.name)
      .map(vendor => [vendor.id!, vendor.name!])
  )

  return result.vendors
    .filter(vendor => vendor.id && vendor.name)
    .map(vendor => ({
      id: vendor.id!,
      name: vendor.name!
    }))
}

export async function getVendorName(vendorId: string): Promise<string> {
  // Try cache first
  if (vendorsCache?.has(vendorId)) {
    return vendorsCache.get(vendorId)!
  }

  // If not in cache, fetch all vendors and update cache
  const vendors = await fetchVendors()
  const vendor = vendors.find(v => v.id === vendorId)
  return vendor?.name || 'Unknown Vendor'
}
