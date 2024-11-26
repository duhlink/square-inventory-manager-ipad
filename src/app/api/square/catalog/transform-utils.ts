import { CatalogItem, Money, CategoryOption, ItemVariation, CatalogObject } from './types'

export const safeMoneyToNumber = (money: Money | undefined | null): number => {
  if (!money?.amount) return 0
  return Number(money.amount) / 100
}

export const extractVendorId = (item: CatalogItem): string | undefined => {
  try {
    const variations = item.item_data?.variations || []
    for (const variation of variations) {
      const vendorInfos = variation.item_variation_data?.item_variation_vendor_infos
      if (Array.isArray(vendorInfos) && vendorInfos.length > 0) {
        const vendorInfo = vendorInfos[0]?.item_variation_vendor_info_data
        if (vendorInfo?.vendor_id) {
          return vendorInfo.vendor_id
        }
      }
    }
    return undefined
  } catch (error) {
    console.error('Error extracting vendor ID:', error)
    return undefined
  }
}

export const extractCategoryIds = (item: CatalogItem): string[] => {
  const categoryIds = new Set<string>()
  
  // Get category IDs from the categories array
  if (item.item_data?.categories) {
    item.item_data.categories.forEach(category => {
      categoryIds.add(category.id)
    })
  }

  // Also get category IDs from the category_ids array if it exists
  if (item.item_data?.category_ids) {
    item.item_data.category_ids.forEach(id => {
      categoryIds.add(id)
    })
  }

  return Array.from(categoryIds)
}

export const getCategoryNames = (categoryIds: string[], categoryMap: Map<string, string>): string[] => {
  return categoryIds.map(id => categoryMap.get(id) || id)
}

export const createCategoryOptions = (categoryMap: Map<string, string>): CategoryOption[] => {
  return Array.from(categoryMap.entries())
    .map(([id, name]) => ({
      value: id,
      label: name
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export const mapVariations = (
  variations: ItemVariation[],
  measurementUnitMap: Map<string, string>,
  vendorMap: Map<string, string>
): any[] => {
  return variations.map(variation => {
    const measurementUnitId = variation.item_variation_data?.measurement_unit_id
    const measurementUnit = measurementUnitId ? 
      measurementUnitMap.get(measurementUnitId) || 'unit' : 
      'unit'

    // Get vendor info for this variation
    const variationVendorInfo = variation.item_variation_data?.item_variation_vendor_infos?.[0]
    const variationVendorId = variationVendorInfo?.item_variation_vendor_info_data?.vendor_id
    let variationVendorName = variationVendorId || 'No Vendor'
    if (variationVendorId && vendorMap.has(variationVendorId)) {
      const name = vendorMap.get(variationVendorId)
      if (name && name.trim()) {
        variationVendorName = name
      }
    }

    return {
      id: variation.id,
      name: variation.item_variation_data?.name || '',
      sku: variation.item_variation_data?.sku || '',
      price: safeMoneyToNumber(variation.item_variation_data?.price_money),
      cost: 0,
      measurementUnit,
      vendorSku: variationVendorId ? `${variationVendorId}-${variation.item_variation_data?.sku}` : undefined,
      vendorId: variationVendorId || '',
      vendorName: variationVendorName,
      stockable: variation.item_variation_data?.stockable ?? false,
      quantity: 0
    }
  })
}

export const getVendorName = (vendorId: string | undefined, vendorMap: Map<string, string>): string => {
  if (!vendorId) return 'No Vendor'
  const name = vendorMap.get(vendorId)
  return (name && name.trim()) ? name : vendorId
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
