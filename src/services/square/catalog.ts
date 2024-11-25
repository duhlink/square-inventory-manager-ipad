import { squareClient } from "./config"

// Cache for resolved objects
const objectCache = new Map<string, any>()

export async function batchFetchCatalogObjects(objectIds: string[]) {
  if (!squareClient?.catalogApi) {
    throw new Error('Square catalog API is not properly initialized')
  }

  // Filter out already cached objects
  const uncachedIds = objectIds.filter(id => !objectCache.has(id))
  
  if (uncachedIds.length === 0) {
    return objectIds.map(id => objectCache.get(id))
  }

  try {
    const { result } = await squareClient.catalogApi.batchRetrieveCatalogObjects({
      objectIds: uncachedIds,
      includeRelatedObjects: true
    })

    // Cache the results
    result.objects?.forEach(obj => {
      objectCache.set(obj.id, obj)
    })

    // Return all requested objects (from cache and newly fetched)
    return objectIds.map(id => objectCache.get(id))
  } catch (error) {
    console.error('Error batch fetching catalog objects:', error)
    return []
  }
}

export async function getCategoryNames(categoryIds: string[]): Promise<string[]> {
  if (!categoryIds.length) return []

  const objects = await batchFetchCatalogObjects(categoryIds)
  return objects
    .filter(obj => obj?.type === 'CATEGORY')
    .map(obj => obj?.categoryData?.name || 'Unknown Category')
}

export async function getMeasurementUnitNames(unitIds: string[]): Promise<Map<string, string>> {
  if (!unitIds.length) return new Map()

  const objects = await batchFetchCatalogObjects(unitIds)
  const unitMap = new Map<string, string>()
  
  objects.forEach(obj => {
    if (obj?.type === 'MEASUREMENT_UNIT') {
      let unitName = 'per item'
      if (obj.measurementUnitData?.precision) {
        const type = obj.measurementUnitData.measurementUnit?.type
        switch (type) {
          case 'TYPE_WEIGHT':
            unitName = 'per pound'
            break
          case 'TYPE_LENGTH':
            unitName = 'per foot'
            break
          case 'TYPE_GENERIC':
            unitName = 'per unit'
            break
        }
      }
      unitMap.set(obj.id, unitName)
    }
  })

  return unitMap
}

export async function getImageUrls(imageIds: string[]): Promise<Map<string, string>> {
  if (!imageIds.length) return new Map()

  const objects = await batchFetchCatalogObjects(imageIds)
  const urlMap = new Map<string, string>()
  
  objects.forEach(obj => {
    if (obj?.type === 'IMAGE') {
      urlMap.set(obj.id, obj.imageData?.url || '')
    }
  })

  return urlMap
}

// Helper function to collect all object IDs that need to be fetched
export function collectObjectIds(items: any[]) {
  const categoryIds = new Set<string>()
  const measurementUnitIds = new Set<string>()
  const imageIds = new Set<string>()

  items.forEach(item => {
    // Collect category IDs
    item.itemData?.categories?.forEach((cat: any) => {
      if (cat.id) categoryIds.add(cat.id)
    })

    // Collect measurement unit IDs
    item.itemData?.variations?.forEach((variation: any) => {
      if (variation.itemVariationData?.measurementUnitId) {
        measurementUnitIds.add(variation.itemVariationData.measurementUnitId)
      }
    })

    // Collect image IDs
    item.itemData?.imageIds?.forEach((imageId: string) => {
      imageIds.add(imageId)
    })
  })

  return {
    categoryIds: Array.from(categoryIds),
    measurementUnitIds: Array.from(measurementUnitIds),
    imageIds: Array.from(imageIds)
  }
}
