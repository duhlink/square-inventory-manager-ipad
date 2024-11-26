import { Money, CatalogItem, CategoryOption, ItemVariation } from '../types'

interface FileInfo {
  name: string
  time: number
}

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
  
  if (item.item_data?.categories) {
    item.item_data.categories.forEach(category => {
      categoryIds.add(category.id)
    })
  }

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

export const writeDebugToFile = (data: any, prefix: string): void => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    const debugDir = path.join(process.cwd(), 'debug')
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true })
    }

    const dataString = JSON.stringify(data, null, 2)
    const lines = dataString.split('\n')
    const truncatedData = lines.slice(0, 300).join('\n')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = path.join(debugDir, `${prefix}-${timestamp}.json`)
    fs.writeFileSync(filePath, truncatedData)

    const files = fs.readdirSync(debugDir)
    const filesByPrefix = new Map<string, string[]>()
    
    files.forEach((file: string) => {
      const filePrefix = file.split('-')[0]
      if (!filesByPrefix.has(filePrefix)) {
        filesByPrefix.set(filePrefix, [])
      }
      filesByPrefix.get(filePrefix)?.push(file)
    })

    filesByPrefix.forEach((prefixFiles, filePrefix) => {
      const sortedFiles = prefixFiles.sort((a: string, b: string) => {
        const timeA = fs.statSync(path.join(debugDir, a)).mtime.getTime()
        const timeB = fs.statSync(path.join(debugDir, b)).mtime.getTime()
        return timeB - timeA
      })

      sortedFiles.slice(1).forEach((file: string) => {
        try {
          fs.unlinkSync(path.join(debugDir, file))
        } catch (error) {
          console.error(`Error removing old debug file ${file}:`, error)
        }
      })
    })

    const allFiles: FileInfo[] = fs.readdirSync(debugDir)
      .map((file: string) => ({
        name: file,
        time: fs.statSync(path.join(debugDir, file)).mtime.getTime()
      }))
      .sort((a: FileInfo, b: FileInfo) => b.time - a.time)

    allFiles.slice(10).forEach((file: FileInfo) => {
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
